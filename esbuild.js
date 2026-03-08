const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const watch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  sourcemap: false,
  outfile: 'dist/extension.js',
  external: ['vscode', 'sharp'],
  logLevel: 'info',
  target: 'node20'
};

// ── sharp native dependency copy ────────────────────────────────────
// sharp is a native C++ addon — esbuild cannot bundle .node binaries
// or platform dylibs. Copy only the runtime files into dist/node_modules/
// so the VSIX ships a self-contained dist/ with no top-level node_modules.

const SHARP_RUNTIME_DEPS = [
  'sharp',
  'detect-libc',
  'semver',
  'color',
  'color-convert',
  'color-name',
  'color-string',
  'simple-swizzle',
  'is-arrayish'
];

const SKIP_PATTERN = /\.(md|d\.ts|d\.mts|cc|cpp|h|gyp|map)$|^(LICENSE|LICENCE)(\.txt)?$/i;
const SKIP_DIRS = new Set([
  'src',
  'test',
  'tests',
  'docs',
  'example',
  'examples',
  '.github',
  'bin',
  'install'
]);

function copyDirFiltered(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) copyDirFiltered(s, d);
    } else if (!SKIP_PATTERN.test(entry.name)) {
      fs.copyFileSync(s, d);
    }
  }
}

function copySharpToDist() {
  const nmSrc = path.join(__dirname, 'node_modules');
  const nmDest = path.join(__dirname, 'dist', 'node_modules');

  fs.rmSync(nmDest, { recursive: true, force: true });

  // Copy JS runtime deps
  for (const dep of SHARP_RUNTIME_DEPS) {
    copyDirFiltered(path.join(nmSrc, dep), path.join(nmDest, dep));
  }

  // Copy @img platform-specific binaries (whatever is installed)
  const imgDir = path.join(nmSrc, '@img');
  if (fs.existsSync(imgDir)) {
    for (const name of fs.readdirSync(imgDir)) {
      copyDirFiltered(path.join(imgDir, name), path.join(nmDest, '@img', name));
    }
  }

  console.log('  Copied sharp native deps → dist/node_modules/');
}

// ── main ────────────────────────────────────────────────────────────
async function main() {
  if (watch) {
    const ctx = await esbuild.context(baseConfig);
    copySharpToDist();
    await ctx.watch();
    console.log('ImageLint: watching for changes...');
    return;
  }

  await esbuild.build(baseConfig);
  copySharpToDist();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
