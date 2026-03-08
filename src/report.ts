import * as crypto from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as vscode from 'vscode';
import { ImageIssue } from './types';
import { formatBytes } from './utils';

interface ReportMessage {
  type: string;
  issueId?: string;
  action?: string;
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
  canConvert: boolean;
}

export class ReportPanel {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly onMessage: (message: ReportMessage) => void
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

      this.panel.webview.onDidReceiveMessage((message: ReportMessage) => {
        this.onMessage(message);
      });

      this.panel.webview.html = await this.getHtml(this.panel.webview);
    }

    this.panel.reveal(vscode.ViewColumn.Beside);
    this.sendData(issues);
  }

  update(issues: ImageIssue[]): void {
    if (this.panel) {
      this.sendData(issues);
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
      canConvert:
        !modernFormats.has(issue.format.toLowerCase()) &&
        !['svg', 'gif'].includes(issue.format.toLowerCase())
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
