import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import sharp from 'sharp';
import * as vscode from 'vscode';
import { ImageLintConfig } from './config';
import { ImageIssue } from './types';
import { createIssueId, estimateSavingsPct, toPosixPath } from './utils';

function estimateOptimizedBytes(ext: string, bytes: number): number {
  const lower = ext.toLowerCase();
  // Smaller files have diminishing compression returns
  const smallFileAdjust = bytes < 10240 ? 0.92 : bytes < 51200 ? 0.8 : 1.0;
  if (lower === '.png') {
    return Math.floor(bytes * (1 - 0.35 * smallFileAdjust));
  }
  if (lower === '.jpg' || lower === '.jpeg') {
    return Math.floor(bytes * (1 - 0.3 * smallFileAdjust));
  }
  if (lower === '.gif') {
    return Math.floor(bytes * (1 - 0.2 * smallFileAdjust));
  }
  if (lower === '.svg') {
    return Math.floor(bytes * (1 - 0.25 * smallFileAdjust));
  }
  return Math.floor(bytes * 0.9);
}

function getSeverity(originalBytes: number, thresholdBytes: number): 'warning' | 'error' {
  if (originalBytes > thresholdBytes * 2) {
    return 'error';
  }
  return 'warning';
}

export async function analyzeImages(
  imageUris: vscode.Uri[],
  config: ImageLintConfig
): Promise<ImageIssue[]> {
  const issues: ImageIssue[] = [];
  const thresholdBytes = config.sizeThresholdKB * 1024;
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  for (const uri of imageUris) {
    const ext = path.extname(uri.fsPath).toLowerCase();
    const stat = await fs.stat(uri.fsPath);
    const originalBytes = stat.size;
    let metadata: sharp.Metadata | undefined;

    if (ext !== '.svg' && ext !== '.gif') {
      try {
        metadata = await sharp(uri.fsPath).metadata();
      } catch {
        // Ignore metadata failures; file-size checks still apply.
      }
    }

    const isTooLarge = originalBytes > thresholdBytes;
    const needsModernFormat =
      config.autoConvertToWebP && !['.webp', '.avif', '.svg', '.gif'].includes(ext);
    const likelyOversizedDimensions = Boolean(metadata?.width && metadata.width > 2000);

    if (!isTooLarge && !needsModernFormat && !likelyOversizedDimensions) {
      continue;
    }

    const estimatedBytes = estimateOptimizedBytes(ext, originalBytes);
    const savingsBytes = Math.max(0, originalBytes - estimatedBytes);

    // Skip images with minimal absolute savings (< 1 KB) — likely already optimized
    if (savingsBytes < 1024 && !needsModernFormat && !likelyOversizedDimensions) {
      continue;
    }

    const relativePath = rootPath
      ? toPosixPath(path.relative(rootPath, uri.fsPath))
      : path.basename(uri.fsPath);

    const suggestions: string[] = [];
    if (isTooLarge && savingsBytes >= 1024) {
      suggestions.push('compress');
    }
    if (needsModernFormat) {
      suggestions.push(config.preferAVIF ? 'convert to AVIF' : 'convert to WebP');
    }
    if (likelyOversizedDimensions) {
      suggestions.push('resize width to 1600px or less');
    }

    if (suggestions.length === 0) {
      continue;
    }

    issues.push({
      id: createIssueId(relativePath),
      uri,
      relativePath,
      format: ext.replace('.', '').toUpperCase(),
      originalBytes,
      estimatedBytes,
      savingsBytes,
      savingsPct: estimateSavingsPct(originalBytes, estimatedBytes),
      severity: getSeverity(originalBytes, thresholdBytes),
      message: `Unoptimized image (${Math.round(originalBytes / 1024)} KB). Potential savings: ${Math.round(savingsBytes / 1024)} KB.`,
      suggestions,
      targetWidth: likelyOversizedDimensions ? 1600 : undefined
    });
  }

  return issues;
}
