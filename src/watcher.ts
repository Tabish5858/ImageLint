import * as vscode from 'vscode';
import { ImageLintConfig } from './config';

export class ScanWatcher {
  private readonly fileWatcher: vscode.FileSystemWatcher;
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly getConfig: () => ImageLintConfig,
    private readonly triggerScan: () => Promise<void>
  ) {
    this.fileWatcher = vscode.workspace.createFileSystemWatcher('**/*');

    const onFsEvent = () => {
      const cfg = this.getConfig();
      if (!cfg.enabled || !cfg.scanOnSave) {
        return;
      }
      this.debouncedTrigger();
    };

    this.fileWatcher.onDidChange(onFsEvent);
    this.fileWatcher.onDidCreate(onFsEvent);
    this.fileWatcher.onDidDelete(onFsEvent);
  }

  private debouncedTrigger(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      void this.triggerScan();
    }, 600);
  }

  dispose(): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.fileWatcher.dispose();
  }
}
