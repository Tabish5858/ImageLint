import * as vscode from 'vscode';
import { ImageLintConfig } from './config';
import { isSupportedImageFile } from './utils';

const IMAGE_GLOB = '**/*.{png,jpg,jpeg}';
const ALWAYS_EXCLUDED = ['**/node_modules/**', '**/.git/**', '**/.vscode-test/**'];

export async function scanWorkspaceForImages(config: ImageLintConfig): Promise<vscode.Uri[]> {
  const allExcludes = [...new Set([...ALWAYS_EXCLUDED, ...config.excludePatterns])];
  const excludeGlob = `{${allExcludes.join(',')}}`;
  const results = await vscode.workspace.findFiles(IMAGE_GLOB, excludeGlob);
  // Ensure only supported image files are returned (extra safety validation)
  return results.filter((uri) => isSupportedImageFile(uri.fsPath));
}
