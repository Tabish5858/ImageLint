import * as vscode from 'vscode';
import { ScanSummary } from './types';
import { formatBytes } from './utils';

export class StatusBarController {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = 'imagelint.showReport';
    this.item.text = 'ImageLint: scanning...';
    this.item.tooltip = 'ImageLint scan status';
    this.item.show();
  }

  setVisible(isVisible: boolean): void {
    if (isVisible) {
      this.item.show();
      return;
    }
    this.item.hide();
  }

  setSummary(summary: ScanSummary): void {
    this.item.text = `ImageLint: ${summary.flagged} issues (${formatBytes(summary.totalSavingsBytes)} savings)`;
    this.item.tooltip = `Scanned ${summary.scanned} images`;
  }

  setIdle(): void {
    this.item.text = 'ImageLint: ready';
  }

  dispose(): void {
    this.item.dispose();
  }
}
