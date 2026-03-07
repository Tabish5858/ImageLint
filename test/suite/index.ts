import * as path from 'node:path';
import Mocha from 'mocha';
import { globSync } from 'glob';

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    const files = globSync('**/*.test.js', { cwd: testsRoot });
    for (const file of files) {
      mocha.addFile(path.resolve(testsRoot, file));
    }

    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
          return;
        }
        resolve();
      });
    } catch (runError) {
      reject(runError);
    }
  });
}
