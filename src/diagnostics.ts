import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as vscode from 'vscode';
import { DiagnosticsConfig, DiagnosticSeverityLevel } from './config';
import { ImageIssue } from './types';
import { escapeRegExp, toPosixPath } from './utils';

function buildCodeGlob(fileTypes: string[]): string {
  if (fileTypes.length === 0) {
    return '';
  }
  return `**/*.{${fileTypes.join(',')}}`;
}

function toVscodeSeverity(level: DiagnosticSeverityLevel): vscode.DiagnosticSeverity {
  switch (level) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
      return vscode.DiagnosticSeverity.Warning;
    case 'information':
      return vscode.DiagnosticSeverity.Information;
    case 'hint':
      return vscode.DiagnosticSeverity.Hint;
  }
}

function offsetToPosition(text: string, offset: number): vscode.Position {
  const upToOffset = text.slice(0, offset);
  const lines = upToOffset.split('\n');
  const line = lines.length - 1;
  const character = lines[lines.length - 1]?.length ?? 0;
  return new vscode.Position(line, character);
}

export class DiagnosticsManager {
  private readonly collection: vscode.DiagnosticCollection;
  private readonly issueById = new Map<string, ImageIssue>();

  constructor() {
    this.collection = vscode.languages.createDiagnosticCollection('imagelint');
  }

  dispose(): void {
    this.collection.dispose();
    this.issueById.clear();
  }

  clear(): void {
    this.collection.clear();
    this.issueById.clear();
  }

  getIssueById(id: string): ImageIssue | undefined {
    return this.issueById.get(id);
  }

  async setIssues(
    issues: ImageIssue[],
    excludePatterns: string[],
    diagConfig: DiagnosticsConfig
  ): Promise<void> {
    this.clear();

    // Always store issues for code actions even if diagnostics are off
    for (const issue of issues) {
      this.issueById.set(issue.id, issue);
    }

    if (!diagConfig.enabled || issues.length === 0 || diagConfig.fileTypes.length === 0) {
      return;
    }

    const codeGlob = buildCodeGlob(diagConfig.fileTypes);
    const excludeGlob = excludePatterns.length > 0 ? `{${excludePatterns.join(',')}}` : undefined;
    const codeFiles = await vscode.workspace.findFiles(codeGlob, excludeGlob);

    const severity = toVscodeSeverity(diagConfig.severity);
    const diagnosticsByFile = new Map<string, vscode.Diagnostic[]>();

    for (const fileUri of codeFiles) {
      const text = await fs.readFile(fileUri.fsPath, 'utf8');
      for (const issue of issues) {
        const normalizedRef = toPosixPath(issue.relativePath);
        const basename = path.basename(issue.relativePath);
        const pattern = new RegExp(`${escapeRegExp(normalizedRef)}|${escapeRegExp(basename)}`, 'g');
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          const startPos = offsetToPosition(text, match.index);
          const endPos = offsetToPosition(text, match.index + match[0].length);
          const fullRange = new vscode.Range(startPos, endPos);

          const diagnostic = new vscode.Diagnostic(fullRange, issue.message, severity);
          diagnostic.source = 'ImageLint';
          diagnostic.code = issue.id;

          const existing = diagnosticsByFile.get(fileUri.fsPath) ?? [];
          existing.push(diagnostic);
          diagnosticsByFile.set(fileUri.fsPath, existing);
        }
      }
    }

    for (const [filePath, diagnostics] of diagnosticsByFile.entries()) {
      this.collection.set(vscode.Uri.file(filePath), diagnostics);
    }
  }
}
