import * as vscode from 'vscode';
import { ImageLintConfig } from './config';

const IMAGE_GLOB = '**/*.{png,jpg,jpeg,gif,svg,webp,avif}';

export async function scanWorkspaceForImages(config: ImageLintConfig): Promise<vscode.Uri[]> {
  const excludeGlob = config.excludePatterns.length > 0 ? `{${config.excludePatterns.join(',')}}` : undefined;
  return vscode.workspace.findFiles(IMAGE_GLOB, excludeGlob);
}
