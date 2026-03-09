import * as vscode from 'vscode';
import { ImageLintConfig } from './config';
import { isSupportedImageFile } from './utils';

const IMAGE_GLOB = '**/*.{png,jpg,jpeg}';

export async function scanWorkspaceForImages(config: ImageLintConfig): Promise<vscode.Uri[]> {
  const excludeGlob =
    config.excludePatterns.length > 0 ? `{${config.excludePatterns.join(',')}}` : undefined;
  const results = await vscode.workspace.findFiles(IMAGE_GLOB, excludeGlob);
  // Ensure only supported image files are returned (extra safety validation)
  return results.filter((uri) => isSupportedImageFile(uri.fsPath));
}
