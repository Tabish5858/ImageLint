import * as path from 'path';

export const SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function isSupportedImageFile(filePath: string): boolean {
  return SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}

export function toPosixPath(value: string): string {
  return value.split(path.sep).join('/');
}

export function createIssueId(relativePath: string): string {
  return `imagelint:${toPosixPath(relativePath)}`;
}

export function estimateSavingsPct(originalBytes: number, estimatedBytes: number): number {
  if (originalBytes <= 0) {
    return 0;
  }
  return Math.max(0, Math.round(((originalBytes - estimatedBytes) / originalBytes) * 100));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
