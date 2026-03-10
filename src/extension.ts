import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { analyzeImages } from './analyzer';
import { ImageLintCodeActionProvider } from './codeActions';
import { getConfig } from './config';
import { DiagnosticsManager } from './diagnostics';
import { optimizeIssue } from './optimizer';
import { ReportPanel } from './report';
import { scanWorkspaceForImages } from './scanner';
import { StatusBarController } from './statusBar';
import { ImageIssue, OptimizationAction, ScanSummary } from './types';
import { escapeRegExp, formatBytes } from './utils';
import { ScanWatcher } from './watcher';

let diagnosticsManager: DiagnosticsManager;
let statusBar: StatusBarController;
let reportPanel: ReportPanel;
let watcher: ScanWatcher;
let latestIssues: ImageIssue[] = [];

const CODE_GLOB = '**/*.{js,jsx,ts,tsx,html,css,scss,vue,svelte,md,mdx}';

async function runScan(showInfoMessage = false): Promise<ScanSummary> {
  const config = getConfig();

  if (!config.enabled) {
    latestIssues = [];
    diagnosticsManager.clear();
    statusBar.setIdle();
    return { scanned: 0, flagged: 0, totalSavingsBytes: 0 };
  }

  const imageUris = await scanWorkspaceForImages(config);
  const issues = await analyzeImages(imageUris, config);
  latestIssues = issues;

  await diagnosticsManager.setIssues(issues, config.excludePatterns);

  const summary: ScanSummary = {
    scanned: imageUris.length,
    flagged: issues.length,
    totalSavingsBytes: issues.reduce((sum, item) => sum + item.savingsBytes, 0)
  };

  statusBar.setVisible(config.showStatusBar);
  statusBar.setSummary(summary);
  reportPanel.update(issues);

  if (showInfoMessage) {
    vscode.window.showInformationMessage(
      `ImageLint scanned ${summary.scanned} images, found ${summary.flagged} issues with potential savings of ${formatBytes(summary.totalSavingsBytes)}.`
    );
  }

  return summary;
}

async function updateReferences(oldRelativePath: string, newRelativePath: string): Promise<void> {
  const files = await vscode.workspace.findFiles(CODE_GLOB, '{**/node_modules/**,**/.git/**}');
  const oldBase = path.basename(oldRelativePath);
  const newBase = path.basename(newRelativePath);

  // Single combined regex handles:
  //   1. Full relative path (with optional leading ./ or .\): images/logo.png OR ./images/logo.png
  //   2. Standalone basename only when NOT preceded by a path separator,
  //      which avoids corrupting references to other files with the same name in different directories.
  const fullPathPattern = `(?:\\.[/\\\\])?${escapeRegExp(oldRelativePath)}`;
  const standaloneBasePattern = `(?<![/\\\\])${escapeRegExp(oldBase)}`;
  const combined = new RegExp(`${fullPathPattern}|${standaloneBasePattern}`, 'g');

  await Promise.all(
    files.map(async (uri: vscode.Uri) => {
      const text = await fs.readFile(uri.fsPath, 'utf8');
      const next = text.replace(combined, (match) => {
        if (match.endsWith(oldRelativePath)) {
          return match.replace(oldRelativePath, newRelativePath);
        }
        return newBase;
      });
      if (next !== text) {
        await fs.writeFile(uri.fsPath, next, 'utf8');
      }
    })
  );
}

async function applyFixById(issueId: string, action: OptimizationAction): Promise<void> {
  const issue = latestIssues.find((item) => item.id === issueId);
  if (!issue) {
    vscode.window.showWarningMessage('ImageLint: issue is no longer available. Run a new scan.');
    return;
  }

  const config = getConfig();
  try {
    const result = await optimizeIssue(issue, action, config);
    if (action === 'convert-modern' && result.outputUri.fsPath !== result.originalUri.fsPath) {
      const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      if (root) {
        const oldRel = path.relative(root, result.originalUri.fsPath).split(path.sep).join('/');
        const newRel = path.relative(root, result.outputUri.fsPath).split(path.sep).join('/');
        await updateReferences(oldRel, newRel);
      }
      await fs.unlink(result.originalUri.fsPath);
    }

    const saved = Math.max(0, result.originalBytes - result.optimizedBytes);
    vscode.window.showInformationMessage(`ImageLint optimized file. Saved ${formatBytes(saved)}.`);
    await runScan(false);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown optimization error';
    vscode.window.showErrorMessage(`ImageLint optimization failed: ${message}`);
  }
}

async function optimizeActiveFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('ImageLint: no active file open.');
    return;
  }

  const target = latestIssues.find((item) => item.uri.fsPath === editor.document.uri.fsPath);
  if (!target) {
    vscode.window.showInformationMessage('ImageLint: active file is not currently flagged.');
    return;
  }

  await applyFixById(target.id, 'compress');
}

function getBestAction(issue: ImageIssue): OptimizationAction {
  const hasConvert = issue.suggestions.some((s) => s.includes('convert'));
  if (hasConvert) {
    return 'convert-modern';
  }
  return 'compress';
}

async function optimizeAllIssues(): Promise<void> {
  if (latestIssues.length === 0) {
    vscode.window.showInformationMessage('ImageLint: no flagged images to optimize.');
    return;
  }

  const config = getConfig();
  let fixed = 0;
  let failed = 0;
  for (const issue of [...latestIssues]) {
    try {
      const action = getBestAction(issue);
      const result = await optimizeIssue(issue, action, config);
      if (action === 'convert-modern' && result.outputUri.fsPath !== result.originalUri.fsPath) {
        const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (root) {
          const oldRel = path.relative(root, result.originalUri.fsPath).split(path.sep).join('/');
          const newRel = path.relative(root, result.outputUri.fsPath).split(path.sep).join('/');
          await updateReferences(oldRel, newRel);
        }
        await fs.unlink(result.originalUri.fsPath);
      }
      fixed++;
    } catch {
      failed++;
    }
  }

  const parts: string[] = [];
  if (fixed > 0) {
    parts.push(`${fixed} optimized`);
  }
  if (failed > 0) {
    parts.push(`${failed} failed`);
  }
  await runScan(false);
  vscode.window.showInformationMessage(
    `ImageLint: ${parts.join(', ')}. ${latestIssues.length} issues remaining.`
  );
}

async function ignoreImage(relativePath: string): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('imagelint');
  const current = cfg.get<string[]>('excludePatterns', ['**/node_modules/**']);
  const normalized = `**/${relativePath}`;
  if (!current.includes(normalized)) {
    await cfg.update(
      'excludePatterns',
      [...current, normalized],
      vscode.ConfigurationTarget.Workspace
    );
  }
  await runScan(false);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  diagnosticsManager = new DiagnosticsManager();
  statusBar = new StatusBarController();
  reportPanel = new ReportPanel(context.extensionUri, async (message) => {
    if (message.type === 'fixAll') {
      await optimizeAllIssues();
      reportPanel.update(latestIssues);
    } else if (message.type === 'fix' && message.issueId && message.action) {
      await applyFixById(message.issueId, message.action as OptimizationAction);
      reportPanel.update(latestIssues);
    } else if (message.type === 'rescan') {
      await runScan(false);
      reportPanel.update(latestIssues);
    }
  });

  const codeActionProvider = new ImageLintCodeActionProvider(diagnosticsManager, getConfig);
  watcher = new ScanWatcher(getConfig, async () => {
    await runScan(false);
  });

  context.subscriptions.push(
    diagnosticsManager,
    statusBar,
    watcher,
    vscode.languages.registerCodeActionsProvider(
      [
        { scheme: 'file', language: 'javascript' },
        { scheme: 'file', language: 'typescript' },
        { scheme: 'file', language: 'javascriptreact' },
        { scheme: 'file', language: 'typescriptreact' },
        { scheme: 'file', language: 'html' },
        { scheme: 'file', language: 'css' }
      ],
      codeActionProvider,
      { providedCodeActionKinds: ImageLintCodeActionProvider.providedCodeActionKinds }
    ),
    vscode.commands.registerCommand('imagelint.scanWorkspace', async () => {
      await runScan(true);
    }),
    vscode.commands.registerCommand('imagelint.optimizeFile', async () => {
      await optimizeActiveFile();
    }),
    vscode.commands.registerCommand('imagelint.optimizeAll', async () => {
      await optimizeAllIssues();
    }),
    vscode.commands.registerCommand('imagelint.showReport', async () => {
      await reportPanel.show(latestIssues);
    }),
    vscode.commands.registerCommand('imagelint.clearDiagnostics', () => {
      diagnosticsManager.clear();
      latestIssues = [];
      statusBar.setIdle();
    }),
    vscode.commands.registerCommand('imagelint.toggleEnabled', async () => {
      const cfg = vscode.workspace.getConfiguration('imagelint');
      const current = cfg.get<boolean>('enabled', true);
      await cfg.update('enabled', !current, vscode.ConfigurationTarget.Global);
      await runScan(false);
    }),
    vscode.commands.registerCommand(
      'imagelint.applyFix',
      async (issueId: string, action: OptimizationAction) => {
        await applyFixById(issueId, action);
      }
    ),
    vscode.commands.registerCommand('imagelint.ignoreImage', async (relativePath: string) => {
      await ignoreImage(relativePath);
    })
  );

  await runScan(false);
}

export function deactivate(): void {
  diagnosticsManager?.dispose();
  statusBar?.dispose();
  watcher?.dispose();
}
