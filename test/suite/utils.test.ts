import * as assert from 'node:assert';
import { formatBytes } from '../../src/utils';

suite('utils', () => {
  test('formatBytes for bytes', () => {
    assert.equal(formatBytes(900), '900 B');
  });

  test('formatBytes for KB', () => {
    assert.equal(formatBytes(2048), '2.0 KB');
  });

  test('formatBytes for MB', () => {
    assert.equal(formatBytes(1024 * 1024), '1.00 MB');
  });
});
