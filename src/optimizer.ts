import { execFile } from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';
import * as vscode from 'vscode';
import { ImageLintConfig } from './config';
import { ImageIssue, OptimizationAction, OptimizationResult } from './types';

const execFileAsync = promisify(execFile);

async function fileSize(filePath: string): Promise<number> {
  return (await fs.stat(filePath)).size;
}

async function optimizeRasterInPlace(
  filePath: string,
  ext: string,
  quality: number
): Promise<void> {
  const buf = await fs.readFile(filePath);
  const sharpOpts = ext === '.gif' ? { animated: true } : {};
  const tmpPath = filePath + '.tmp';

  if (ext === '.png') {
    try {
      await sharp(buf, sharpOpts)
        .png({ quality, compressionLevel: 9, palette: true })
        .toFile(tmpPath);
    } catch {
      // Palette quantisation can fail on certain images; fall back to lossless compression
      await sharp(buf, sharpOpts).png({ compressionLevel: 9 }).toFile(tmpPath);
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await sharp(buf, sharpOpts).jpeg({ quality, mozjpeg: true }).toFile(tmpPath);
  } else if (ext === '.webp') {
    await sharp(buf, sharpOpts).webp({ quality }).toFile(tmpPath);
  } else if (ext === '.avif') {
    await sharp(buf, sharpOpts).avif({ quality }).toFile(tmpPath);
  } else {
    return;
  }

  await fs.rename(tmpPath, filePath);
}

async function optimizeSvgInPlace(filePath: string): Promise<void> {
  const svgSource = await fs.readFile(filePath, 'utf8');
  const result = optimizeSvg(svgSource, {
    multipass: true
  });
  await fs.writeFile(filePath, result.data, 'utf8');
}

async function optimizeGifWithGifsicle(filePath: string, tmpPath: string): Promise<boolean> {
  try {
    await execFileAsync('gifsicle', ['-O3', filePath, '-o', tmpPath]);
    return true;
  } catch (err) {
    const isNotFound =
      err instanceof Error &&
      ('code' in err ? (err as NodeJS.ErrnoException).code === 'ENOENT' : false);
    if (isNotFound) {
      return false;
    }
    throw err;
  }
}

async function optimizeGifInPlace(filePath: string): Promise<void> {
  const tmpPath = `${filePath}.tmp.gif`;

  // Try gifsicle first (best GIF optimization)
  const gifsicleWorked = await optimizeGifWithGifsicle(filePath, tmpPath);
  if (gifsicleWorked) {
    await fs.rename(tmpPath, filePath);
    return;
  }

  // Fallback: use sharp for basic GIF recompression
  try {
    await sharp(filePath, { animated: true }).gif({ effort: 10 }).toFile(tmpPath);
    await fs.rename(tmpPath, filePath);
  } catch {
    throw new Error(
      'GIF optimization failed. For best results, install gifsicle:\n' +
        '  macOS:    brew install gifsicle\n' +
        '  Linux:    sudo apt install gifsicle  (or yum/pacman equivalent)\n' +
        '  Windows:  choco install gifsicle  (via Chocolatey) or scoop install gifsicle\n' +
        'Then reload VS Code.'
    );
  }
}

async function convertToModern(
  sourcePath: string,
  ext: '.webp' | '.avif',
  quality: number
): Promise<string> {
  const targetPath = sourcePath.replace(/\.[^.]+$/, ext);
  const buf = await fs.readFile(sourcePath);
  if (ext === '.webp') {
    await sharp(buf).webp({ quality }).toFile(targetPath);
  } else {
    await sharp(buf).avif({ quality }).toFile(targetPath);
  }
  return targetPath;
}

async function resizeWidthInPlace(
  filePath: string,
  targetWidth: number,
  quality: number
): Promise<void> {
  const ext = path.extname(filePath).toLowerCase();
  const buf = await fs.readFile(filePath);
  const resizeOpts = { width: targetWidth, withoutEnlargement: true };
  const tmpPath = filePath + '.tmp';

  if (ext === '.png') {
    try {
      await sharp(buf)
        .resize(resizeOpts)
        .png({ quality, compressionLevel: 9, palette: true })
        .toFile(tmpPath);
    } catch {
      await sharp(buf).resize(resizeOpts).png({ compressionLevel: 9 }).toFile(tmpPath);
    }
  } else if (ext === '.jpg' || ext === '.jpeg') {
    await sharp(buf).resize(resizeOpts).jpeg({ quality, mozjpeg: true }).toFile(tmpPath);
  } else if (ext === '.webp') {
    await sharp(buf).resize(resizeOpts).webp({ quality }).toFile(tmpPath);
  } else if (ext === '.avif') {
    await sharp(buf).resize(resizeOpts).avif({ quality }).toFile(tmpPath);
  } else {
    await sharp(buf).resize(resizeOpts).toFile(tmpPath);
  }

  await fs.rename(tmpPath, filePath);
}

export async function optimizeIssue(
  issue: ImageIssue,
  action: OptimizationAction,
  config: ImageLintConfig
): Promise<OptimizationResult> {
  const sourcePath = issue.uri.fsPath;
  const ext = path.extname(sourcePath).toLowerCase();
  const quality = Math.round(Math.max(1, Math.min(100, Number(config.compressionQuality) || 80)));
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
