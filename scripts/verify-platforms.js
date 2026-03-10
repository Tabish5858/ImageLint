// Verify platform native binaries are present and would be correctly copied
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const nmSrc = path.join(root, 'node_modules');
const imgDir = path.join(nmSrc, '@img');

const SKIP_DIRS = new Set([
  'src',
  'test',
  'tests',
  'docs',
  'example',
  'examples',
  '.github',
  'bin',
  'install',
  'node_modules'
]);
const SKIP_PATTERN = /\.(md|d\.ts|d\.mts|cc|cpp|h|gyp|map)$|^(LICENSE|LICENCE)(\.txt)?$/i;

function findBinaries(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...findBinaries(full));
    } else if (/\.(node|dll|dylib|so)(\.\d+)*$/.test(entry.name)) {
      result.push(entry.name);
    }
  }
  return result;
}

// Map: same as esbuild.js TARGET_TO_IMG
const TARGET_TO_IMG = {
  'win32-x64': ['sharp-win32-x64'],
  'win32-ia32': ['sharp-win32-ia32'],
  'linux-x64': [
    'sharp-linux-x64',
    'sharp-linuxmusl-x64',
    'sharp-libvips-linux-x64',
    'sharp-libvips-linuxmusl-x64'
  ],
  'linux-arm64': [
    'sharp-linux-arm64',
    'sharp-linuxmusl-arm64',
    'sharp-libvips-linux-arm64',
    'sharp-libvips-linuxmusl-arm64'
  ],
  'darwin-x64': ['sharp-darwin-x64', 'sharp-libvips-darwin-x64'],
  'darwin-arm64': ['sharp-darwin-arm64', 'sharp-libvips-darwin-arm64'],
  'alpine-x64': ['sharp-linuxmusl-x64', 'sharp-libvips-linuxmusl-x64'],
  'alpine-arm64': ['sharp-linuxmusl-arm64', 'sharp-libvips-linuxmusl-arm64']
};

let allGood = true;

console.log('=== Verifying @img packages for all platforms ===\n');

for (const [target, prefixes] of Object.entries(TARGET_TO_IMG)) {
  const missing = [];
  const found = [];
  for (const prefix of prefixes) {
    const pkgDir = path.join(imgDir, prefix);
    if (fs.existsSync(pkgDir)) {
      const bins = findBinaries(pkgDir);
      found.push(`${prefix} (${bins.join(', ')})`);
    } else {
      missing.push(prefix);
    }
  }
  // Also check @img/colour (required by sharp 0.34+)
  const colourDir = path.join(imgDir, 'colour');
  const hasColour = fs.existsSync(colourDir);

  const status = missing.length === 0 && hasColour ? '✓' : '✗';
  if (missing.length > 0 || !hasColour) allGood = false;

  console.log(`${status} ${target}:`);
  for (const f of found) console.log(`    ${f}`);
  if (!hasColour) console.log('    MISSING: @img/colour');
  for (const m of missing) console.log(`    MISSING: ${m}`);
}

console.log('');
if (allGood) {
  console.log('✓ All platforms have required native binaries');
} else {
  console.log('✗ Some platforms are missing binaries!');
  console.log('  Run: npm run install:sharp-all');
  process.exit(1);
}
