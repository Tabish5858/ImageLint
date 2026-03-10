import * as vscode from 'vscode';

export type DiagnosticSeverityLevel = 'error' | 'warning' | 'information' | 'hint';

const DEFAULT_FILE_TYPES = [
  'js',
  'jsx',
  'ts',
  'tsx',
  'html',
  'css',
  'scss',
  'vue',
  'svelte',
  'md',
  'mdx'
];

export interface DiagnosticsConfig {
  enabled: boolean;
  severity: DiagnosticSeverityLevel;
  fileTypes: string[];
}

export interface ImageLintConfig {
  enabled: boolean;
  sizeThresholdKB: number;
  autoConvertToWebP: boolean;
  preferAVIF: boolean;
  scanOnSave: boolean;
  excludePatterns: string[];
  showStatusBar: boolean;
  compressionQuality: number;
  diagnostics: DiagnosticsConfig;
}

export function getConfig(): ImageLintConfig {
  const cfg = vscode.workspace.getConfiguration('imagelint');
  const diagCfg = vscode.workspace.getConfiguration('imagelint.diagnostics');

  const severity = diagCfg.get<string>('severity', 'warning');
  const validSeverities: DiagnosticSeverityLevel[] = ['error', 'warning', 'information', 'hint'];
  const safeSeverity: DiagnosticSeverityLevel = validSeverities.includes(
    severity as DiagnosticSeverityLevel
  )
    ? (severity as DiagnosticSeverityLevel)
    : 'warning';

  return {
    enabled: cfg.get<boolean>('enabled', true),
    sizeThresholdKB: cfg.get<number>('sizeThreshold', 100),
    autoConvertToWebP: cfg.get<boolean>('autoConvertToWebP', true),
    preferAVIF: cfg.get<boolean>('preferAVIF', false),
    scanOnSave: cfg.get<boolean>('scanOnSave', true),
    excludePatterns: cfg.get<string[]>('excludePatterns', ['**/node_modules/**']),
    showStatusBar: cfg.get<boolean>('showStatusBar', true),
    compressionQuality: cfg.get<number>('compressionQuality', 80),
    diagnostics: {
      enabled: diagCfg.get<boolean>('enabled', true),
      severity: safeSeverity,
      fileTypes: diagCfg.get<string[]>('fileTypes', DEFAULT_FILE_TYPES)
    }
  };
}
