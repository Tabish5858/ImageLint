import * as vscode from 'vscode';

export type IssueSeverity = 'warning' | 'error';

export type OptimizationAction = 'compress' | 'convert-modern' | 'resize';

export interface ImageIssue {
  id: string;
  uri: vscode.Uri;
  relativePath: string;
  format: string;
  originalBytes: number;
  estimatedBytes: number;
  savingsBytes: number;
  savingsPct: number;
  severity: IssueSeverity;
  message: string;
  suggestions: string[];
  targetWidth?: number;
}

export interface ScanSummary {
  scanned: number;
  flagged: number;
  totalSavingsBytes: number;
}

export interface OptimizationResult {
  originalUri: vscode.Uri;
  outputUri: vscode.Uri;
  originalBytes: number;
  optimizedBytes: number;
  action: OptimizationAction;
}
