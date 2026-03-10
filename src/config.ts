import * as vscode from 'vscode';

export interface ImageLintConfig {
  enabled: boolean;
  sizeThresholdKB: number;
  autoConvertToWebP: boolean;
  preferAVIF: boolean;
  scanOnSave: boolean;
  excludePatterns: string[];
  showStatusBar: boolean;
  compressionQuality: number;
}

export function getConfig(): ImageLintConfig {
  const cfg = vscode.workspace.getConfiguration('imagelint');
  return {
    enabled: cfg.get<boolean>('enabled', true),
    sizeThresholdKB: cfg.get<number>('sizeThreshold', 100),
    autoConvertToWebP: cfg.get<boolean>('autoConvertToWebP', true),
    preferAVIF: cfg.get<boolean>('preferAVIF', false),
    scanOnSave: cfg.get<boolean>('scanOnSave', true),
    excludePatterns: cfg.get<string[]>('excludePatterns', ['**/node_modules/**']),
    showStatusBar: cfg.get<boolean>('showStatusBar', true),
    compressionQuality: cfg.get<number>('compressionQuality', 80)
  };
}
