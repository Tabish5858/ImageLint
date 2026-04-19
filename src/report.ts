import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as vscode from 'vscode';
import { DiagnosticsConfig } from './config';
import { ImageIssue } from './types';
import { formatBytes } from './utils';

interface ReportMessage {
  type: string;
  issueId?: string;
  action?: string;
  diagnosticsEnabled?: boolean;
  severity?: string;
  fileTypes?: string[];
}

interface ReportRow {
  id: string;
  path: string;
  format: string;
  size: string;
  sizeBytes: number;
  estimated: string;
  savingsPct: number;
  suggestions: string[];
  canCompress: boolean;
  canConvert: boolean;
  canResize: boolean;
}

export class ReportPanel {
  private panel: vscode.WebviewPanel | undefined;
  private webviewReady = false;
  private pendingIssues: ImageIssue[] = [];
  private pendingSettings: DiagnosticsConfig | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly onMessage: (message: ReportMessage) => void
  ) {}

  async show(issues: ImageIssue[]): Promise<void> {
    this.pendingIssues = issues;
    const preferredColumn = this.getPreferredColumn();

    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'imagelint.report',
        'ImageLint Audit Report',
        preferredColumn,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'webview')]
        }
      );
      this.webviewReady = false;

      this.panel.onDidDispose(() => {
        this.panel = undefined;
        this.webviewReady = false;
        this.pendingSettings = undefined;
      });

      this.panel.webview.onDidReceiveMessage((message: ReportMessage) => {
        if (message.type === 'ready') {
          this.webviewReady = true;
          this.flushPendingMessages();
          return;
        }
        this.onMessage(message);
      });

      this.panel.onDidChangeViewState((event) => {
        if (event.webviewPanel.visible) {
          this.flushPendingMessages();
        }
      });

      try {
        this.panel.webview.html = await this.getHtml(this.panel.webview);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to load the ImageLint report view.';
        this.panel.webview.html = this.getErrorHtml(message);
      }
    } else {
      this.panel.reveal(this.panel.viewColumn ?? preferredColumn, false);
    }

    this.flushPendingMessages();
  }

  private getPreferredColumn(): vscode.ViewColumn {
    return (
      vscode.window.activeTextEditor?.viewColumn ??
      vscode.window.visibleTextEditors.find((editor) => editor.viewColumn !== undefined)
        ?.viewColumn ??
      vscode.ViewColumn.One
    );
  }

  update(issues: ImageIssue[]): void {
    this.pendingIssues = issues;
    this.flushPendingMessages();
  }

  sendSettings(diagConfig: DiagnosticsConfig): void {
    this.pendingSettings = diagConfig;
    this.flushPendingMessages();
  }

  private flushPendingMessages(): void {
    if (!this.panel || !this.webviewReady) {
      return;
    }

    this.sendData(this.pendingIssues);

    if (this.pendingSettings) {
      this.panel.webview.postMessage({
        type: 'settingsData',
        diagnosticsEnabled: this.pendingSettings.enabled,
        severity: this.pendingSettings.severity,
        fileTypes: this.pendingSettings.fileTypes
      });
    }
  }

  private sendData(issues: ImageIssue[]): void {
    if (!this.panel) {
      return;
    }

    const modernFormats = new Set(['webp', 'avif']);
    const rows: ReportRow[] = issues.map((issue) => ({
      id: issue.id,
      path: issue.relativePath,
      format: issue.format,
      size: formatBytes(issue.originalBytes),
      sizeBytes: issue.originalBytes,
      estimated: formatBytes(issue.estimatedBytes),
      savingsPct: issue.savingsPct,
      suggestions: issue.suggestions,
      canCompress: issue.suggestions.some((s) => s === 'compress'),
      canConvert:
        !modernFormats.has(issue.format.toLowerCase()) &&
        !['svg', 'gif'].includes(issue.format.toLowerCase()),
      canResize: issue.suggestions.some((s) => s.includes('resize'))
    }));

    const formatCounts: Record<string, number> = {};
    for (const row of rows) {
      formatCounts[row.format] = (formatCounts[row.format] || 0) + 1;
    }

    this.panel.webview.postMessage({
      type: 'reportData',
      summary: {
        count: issues.length,
        totalSavings: formatBytes(issues.reduce((sum, issue) => sum + issue.savingsBytes, 0)),
        totalSavingsBytes: issues.reduce((sum, issue) => sum + issue.savingsBytes, 0),
        totalOriginalBytes: issues.reduce((sum, issue) => sum + issue.originalBytes, 0),
        formatCounts
      },
      rows
    });
  }

  private async getHtml(webview: vscode.Webview): Promise<string> {
    const htmlPath = vscode.Uri.joinPath(this.extensionUri, 'webview', 'report.html');
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'report.css')
    );
    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'webview', 'report.js')
    );

    const nonce = this.getNonce();
    const cspSource = webview.cspSource;
    const template = await fs.readFile(htmlPath.fsPath, 'utf8');

    return template
      .replace(/\{\{cspSource\}\}/g, cspSource)
      .replace(/\{\{styleUri\}\}/g, cssUri.toString())
      .replace(/\{\{scriptUri\}\}/g, jsUri.toString())
      .replace(/\{\{nonce\}\}/g, nonce);
  }

  private getNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private getErrorHtml(errorMessage: string): string {
    const escapedMessage = errorMessage
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 20px;
        font-family: var(--vscode-font-family, sans-serif);
        font-size: var(--vscode-font-size, 13px);
        color: var(--vscode-editor-foreground, #cccccc);
        background: var(--vscode-editor-background, #1e1e1e);
      }

      h1 {
        font-size: 16px;
        margin: 0 0 10px;
      }

      p {
        margin: 0;
        color: var(--vscode-descriptionForeground, #999999);
      }

      code {
        display: inline-block;
        margin-top: 12px;
        color: var(--vscode-terminal-ansiRed, #f14c4c);
      }
    </style>
  </head>
  <body>
    <h1>ImageLint Report Failed to Load</h1>
    <p>The audit report could not be initialized. Try re-running <strong>ImageLint: Show Audit Report</strong>.</p>
    <code>${escapedMessage}</code>
  </body>
</html>`;
  }
}
