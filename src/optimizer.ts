import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import * as vscode from 'vscode';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';
import { ImageLintConfig } from './config';
import { ImageIssue, OptimizationAction, OptimizationResult } from './types';

const execFileAsync = promisify(execFile);

async function fileSize(filePath: string): Promise<number> {
  return (await fs.stat(filePath)).size;
}

async function optimizeRasterInPlace(filePath: string, ext: string, quality: number): Promise<void> {
  const pipeline = sharp(filePath, { animated: ext === '.gif' });

  if (ext === '.png') {
    await pipeline.png({ quality, compressionLevel: 9, palette: true }).toFile(filePath + '.tmp');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await pipeline.jpeg({ quality, mozjpeg: true }).toFile(filePath + '.tmp');
  } else if (ext === '.webp') {
    await pipeline.webp({ quality }).toFile(filePath + '.tmp');
  } else if (ext === '.avif') {
    await pipeline.avif({ quality }).toFile(filePath + '.tmp');
  } else {
    return;
  }

  await fs.rename(filePath + '.tmp', filePath);
}

async function optimizeSvgInPlace(filePath: string): Promise<void> {
  const svgSource = await fs.readFile(filePath, 'utf8');
  const result = optimizeSvg(svgSource, {
    multipass: true
  });
  await fs.writeFile(filePath, result.data, 'utf8');
}

async function optimizeGifInPlace(filePath: string): Promise<void> {
  const tmpPath = `${filePath}.tmp.gif`;
  await execFileAsync('gifsicle', ['-O3', filePath, '-o', tmpPath]);
  await fs.rename(tmpPath, filePath);
}

async function convertToModern(
  sourcePath: string,
  ext: '.webp' | '.avif',
  quality: number
): Promise<string> {
  const targetPath = sourcePath.replace(/\.[^.]+$/, ext);
  const image = sharp(sourcePath);
  if (ext === '.webp') {
    await image.webp({ quality }).toFile(targetPath);
  } else {
    await image.avif({ quality }).toFile(targetPath);
  }
  return targetPath;
}

async function resizeWidthInPlace(filePath: string, targetWidth: number, quality: number): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  const pipeline = sharp(filePath).resize({ width: targetWidth, withoutEnlargement: true });

  if (ext === '.png') {
    await pipeline.png({ quality, compressionLevel: 9, palette: true }).toFile(filePath + '.tmp');
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await pipeline.jpeg({ quality, mozjpeg: true }).toFile(filePath + '.tmp');
  } else if (ext === '.webp') {
    await pipeline.webp({ quality }).toFile(filePath + '.tmp');
  } else if (ext === '.avif') {
    await pipeline.avif({ quality }).toFile(filePath + '.tmp');
  } else {
    await pipeline.toFile(filePath + '.tmp');
  }

  await fs.rename(filePath + '.tmp', filePath);
}

export async function optimizeIssue(
  issue: ImageIssue,
  action: OptimizationAction,
  config: ImageLintConfig
): Promise<OptimizationResult> {
  const sourcePath = issue.uri.fsPath;
  const ext = path.extname(sourcePath).toLowerCase();
  const quality = Math.max(1, Math.min(100, config.compressionQuality));
  const originalBytes = await fileSize(sourcePath);
  let outputPath = sourcePath;

  if (action === 'compress') {
    if (ext === '.svg') {
      await optimizeSvgInPlace(sourcePath);
    } else if (ext === '.gif') {
      await optimizeGifInPlace(sourcePath);
    } else {
      await optimizeRasterInPlace(sourcePath, ext, quality);
    }
  } else if (action === 'convert-modern') {
    const targetExt: '.webp' | '.avif' = config.preferAVIF ? '.avif' : '.webp';
    outputPath = await convertToModern(sourcePath, targetExt, quality);
  } else if (action === 'resize') {
    const targetWidth = issue.targetWidth ?? 800;
    await resizeWidthInPlace(sourcePath, targetWidth, quality);
  }

  const optimizedBytes = await fileSize(outputPath);

  return {
    originalUri: issue.uri,
    outputUri: vscode.Uri.file(outputPath),
    originalBytes,
    optimizedBytes,
    action
  };
}
