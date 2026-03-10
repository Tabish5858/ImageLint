// Quick smoke test: can the bundle load and does sharp work?
const Module = require('module');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === 'vscode') return request;
  return origResolve.call(this, request, parent, ...rest);
};

// Minimal vscode stub
require.cache['vscode'] = {
  id: 'vscode',
  filename: 'vscode',
  loaded: true,
  exports: {
    workspace: {
      getConfiguration: () => ({ get: () => undefined }),
      onDidChangeConfiguration: () => ({ dispose() {} }),
      findFiles: async () => [],
      workspaceFolders: []
    },
    window: {
      createOutputChannel: () => ({ appendLine() {}, show() {}, dispose() {} }),
      showInformationMessage: async () => {},
      showWarningMessage: async () => {},
      showErrorMessage: async () => {}
    },
    commands: { registerCommand: () => ({ dispose() {} }) },
    languages: { registerCodeActionsProvider: () => ({ dispose() {} }) },
    Uri: { file: (p) => ({ fsPath: p, toString: () => p }) },
    EventEmitter: class {
      event = () => {};
      fire() {}
      dispose() {}
    },
    Disposable: { from: () => ({}) },
    CodeActionKind: { QuickFix: 'quickfix' },
    DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
    ConfigurationTarget: { Global: 1, Workspace: 2 },
    RelativePattern: class {
      constructor(base, pattern) {
        this.base = base;
        this.pattern = pattern;
      }
    },
    FileSystemWatcher: class {},
    DiagnosticCollection: class {}
  }
};

const path = require('path');
const root = path.resolve(__dirname, '..');

try {
  const ext = require(path.join(root, 'dist', 'extension.js'));
  console.log('✓ Extension module loaded');
  console.log('  Exports:', Object.keys(ext));
  console.log('  activate:', typeof ext.activate);
  console.log('  deactivate:', typeof ext.deactivate);
} catch (e) {
  console.log('✗ Extension load FAILED:', e.message);
  console.log(e.stack);
  process.exit(1);
}

// Test sharp separately
try {
  const sharp = require(path.join(root, 'dist', 'node_modules', 'sharp'));
  console.log(
    '✓ Sharp loaded, version:',
    require(path.join(root, 'dist', 'node_modules', 'sharp', 'package.json')).version
  );

  // Test actual image processing
  sharp({ create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } } })
    .png({ quality: 80, compressionLevel: 9, palette: true })
    .toBuffer()
    .then((buf) => {
      console.log('✓ Sharp PNG pipeline works, output:', buf.length, 'bytes');
      return sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } }
      })
        .webp({ quality: 80 })
        .toBuffer();
    })
    .then((buf) => {
      console.log('✓ Sharp WebP pipeline works, output:', buf.length, 'bytes');
      return sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } }
      })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    })
    .then((buf) => {
      console.log('✓ Sharp JPEG pipeline works, output:', buf.length, 'bytes');
      return sharp({
        create: { width: 10, height: 10, channels: 3, background: { r: 255, g: 0, b: 0 } }
      })
        .avif({ quality: 80 })
        .toBuffer();
    })
    .then((buf) => {
      console.log('✓ Sharp AVIF pipeline works, output:', buf.length, 'bytes');
      console.log('\n✓ All smoke tests passed!');
    })
    .catch((e) => {
      console.log('✗ Sharp pipeline FAILED:', e.message);
      process.exit(1);
    });
} catch (e) {
  console.log('✗ Sharp load FAILED:', e.message);
  console.log(e.stack);
  process.exit(1);
}
