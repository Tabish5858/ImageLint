import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as vscode from 'vscode';
import { ImageIssue } from './types';
import { formatBytes } from './utils';

interface ReportRow {
  id: string;
  path: string;
  format: string;
  size: string;
  estimated: string;
  savingsPct: number;
  suggestions: string;
}

export class ReportPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly onFixAll: () => void
  ) {}

  async show(issues: ImageIssue[]): Promise<void> {
    if (!this.panel) {
      this.panel = vscode.window.createWebviewPanel(
        'imagelint.report',
        'ImageLint Audit Report',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, 'webview')]
        }
      );

      this.panel.onDidDispose(() => {
        this.panel = undefined;
      });

      this.panel.webview.onDidReceiveMessage((message: { type: string }) => {
        if (message.type === 'fixAll') {
          this.onFixAll();
        }
      });

      this.panel.webview.html = await this.getHtml(this.panel.webview);
    }

    this.panel.reveal(vscode.ViewColumn.Beside);

    const rows: ReportRow[] = issues.map((issue) => ({
      id: issue.id,
      path: issue.relativePath,
      format: issue.format,
      size: formatBytes(issue.originalBytes),
      estimated: formatBytes(issue.estimatedBytes),
      savingsPct: issue.savingsPct,
      suggestions: issue.suggestions.join(', ')
    }));

    this.panel.webview.postMessage({
      type: 'reportData',
      summary: {
        count: issues.length,
        totalSavings: formatBytes(issues.reduce((sum, issue) => sum + issue.savingsBytes, 0))
      },
      rows
    });
  }

  private async getHtml(webview: vscode.Webview): Promise<string> {
    const htmlPath = vscode.Uri.joinPath(this.extensionUri, 'webview', 'report.html');
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'webview', 'report.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'webview', 'report.js'));

    const template = await fs.readFile(htmlPath.fsPath, 'utf8');

    return template
      .replace(/\{\{styleUri\}\}/g, cssUri.toString())
      .replace(/\{\{scriptUri\}\}/g, jsUri.toString())
      .replace(/\{\{nonce\}\}/g, this.getNonce());
  }

  private getNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }
}
