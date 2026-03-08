import * as assert from 'node:assert';
import {
  clamp,
  createIssueId,
  escapeRegExp,
  estimateSavingsPct,
  formatBytes,
  isSupportedImageFile,
  toPosixPath
} from '../../src/utils';

suite('utils', () => {
  suite('formatBytes', () => {
    test('bytes', () => {
      assert.equal(formatBytes(0), '0 B');
      assert.equal(formatBytes(900), '900 B');
      assert.equal(formatBytes(1023), '1023 B');
    });

    test('KB', () => {
      assert.equal(formatBytes(1024), '1.0 KB');
      assert.equal(formatBytes(2048), '2.0 KB');
      assert.equal(formatBytes(512000), '500.0 KB');
    });

    test('MB', () => {
      assert.equal(formatBytes(1024 * 1024), '1.00 MB');
      assert.equal(formatBytes(5 * 1024 * 1024), '5.00 MB');
    });
  });

  suite('isSupportedImageFile', () => {
    test('returns true for supported formats', () => {
      assert.ok(isSupportedImageFile('photo.png'));
      assert.ok(isSupportedImageFile('photo.jpg'));
      assert.ok(isSupportedImageFile('photo.jpeg'));
      assert.ok(isSupportedImageFile('photo.gif'));
      assert.ok(isSupportedImageFile('photo.svg'));
      assert.ok(isSupportedImageFile('photo.webp'));
      assert.ok(isSupportedImageFile('photo.avif'));
    });

    test('returns false for unsupported formats', () => {
      assert.ok(!isSupportedImageFile('file.txt'));
      assert.ok(!isSupportedImageFile('file.ts'));
      assert.ok(!isSupportedImageFile('file.pdf'));
      assert.ok(!isSupportedImageFile('file'));
    });

    test('handles paths with directories', () => {
      assert.ok(isSupportedImageFile('/images/photo.png'));
      assert.ok(isSupportedImageFile('src/assets/logo.svg'));
    });

    test('is case-insensitive via lowercase extension', () => {
      assert.ok(isSupportedImageFile('photo.PNG'));
      assert.ok(isSupportedImageFile('photo.JPG'));
    });
  });

  suite('toPosixPath', () => {
    test('converts backslashes to forward slashes', () => {
      const result = toPosixPath('images/logo.png');
      assert.equal(result, 'images/logo.png');
    });

    test('preserves forward slashes', () => {
      assert.equal(toPosixPath('a/b/c'), 'a/b/c');
    });
  });

  suite('createIssueId', () => {
    test('creates id with imagelint prefix', () => {
      const id = createIssueId('images/logo.png');
      assert.equal(id, 'imagelint:images/logo.png');
    });
  });

  suite('estimateSavingsPct', () => {
    test('returns 0 for zero original bytes', () => {
      assert.equal(estimateSavingsPct(0, 0), 0);
    });

    test('calculates correct percentage', () => {
      assert.equal(estimateSavingsPct(1000, 700), 30);
    });

    test('returns 0 when estimated is larger', () => {
      assert.equal(estimateSavingsPct(100, 200), 0);
    });
  });

  suite('clamp', () => {
    test('clamps below min', () => {
      assert.equal(clamp(-10, 0, 100), 0);
    });

    test('clamps above max', () => {
      assert.equal(clamp(200, 0, 100), 100);
    });

    test('passes through value in range', () => {
      assert.equal(clamp(50, 0, 100), 50);
    });
  });

  suite('escapeRegExp', () => {
    test('escapes special regex characters', () => {
      const escaped = escapeRegExp('file.name (1).png');
      assert.equal(escaped, 'file\\.name \\(1\\)\\.png');
    });

    test('leaves normal strings unchanged', () => {
      assert.equal(escapeRegExp('hello'), 'hello');
    });

    test('escapes all special chars', () => {
      const special = '.*+?^${}()|[]\\';
      const escaped = escapeRegExp(special);
      assert.ok(!escaped.includes('.*'));
      assert.ok(escaped.includes('\\'));
    });
  });
});
