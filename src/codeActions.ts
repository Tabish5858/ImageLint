import * as vscode from 'vscode';
import { ImageLintConfig } from './config';
import { DiagnosticsManager } from './diagnostics';

export class ImageLintCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  constructor(
    private readonly diagnosticsManager: DiagnosticsManager,
    private readonly getConfig: () => ImageLintConfig
  ) {}

  provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== 'ImageLint' || typeof diagnostic.code !== 'string') {
        continue;
      }

      const issue = this.diagnosticsManager.getIssueById(diagnostic.code);
      if (!issue) {
        continue;
      }

      const compress = new vscode.CodeAction(
        `Compress in place (save ~${issue.savingsPct}%)`,
        vscode.CodeActionKind.QuickFix
      );
      compress.command = {
        command: 'imagelint.applyFix',
        title: 'Compress image in place',
        arguments: [issue.id, 'compress']
      };
      actions.push(compress);

      const cfg = this.getConfig();
      const modernFormat = cfg.preferAVIF ? 'AVIF' : 'WebP';
      const convert = new vscode.CodeAction(
        `Convert to ${modernFormat}`,
        vscode.CodeActionKind.QuickFix
      );
      convert.command = {
        command: 'imagelint.applyFix',
        title: `Convert image to ${modernFormat}`,
        arguments: [issue.id, 'convert-modern']
      };
      actions.push(convert);

      const resize = new vscode.CodeAction('Resize to 800px width', vscode.CodeActionKind.QuickFix);
      resize.command = {
        command: 'imagelint.applyFix',
        title: 'Resize image to 800px width',
        arguments: [issue.id, 'resize']
      };
      actions.push(resize);

      const ignore = new vscode.CodeAction('Ignore this image', vscode.CodeActionKind.QuickFix);
      ignore.command = {
        command: 'imagelint.ignoreImage',
        title: 'Ignore image in ImageLint settings',
        arguments: [issue.relativePath]
      };
      actions.push(ignore);
    }

    return actions;
  }
}
