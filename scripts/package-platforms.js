/**
 * Build platform-specific VSIX packages for ImageLint.
 *
 * Usage:
 *   node scripts/package-platforms.js                    # build all targets
 *   node scripts/package-platforms.js win32-x64          # build one target
 *   node scripts/package-platforms.js linux-x64 darwin-arm64  # build specific targets
 *
 * Prerequisites:
 *   npm run install:sharp-all   (installs @img/sharp-* for every platform)
 */

const { execSync } = require('child_process');
const path = require('path');

const ALL_TARGETS = [
  'win32-x64',
  'linux-x64',
  'linux-arm64',
  'darwin-x64',
  'darwin-arm64',
  'alpine-x64',
  'alpine-arm64'
];

const args = process.argv.slice(2);
const targets = args.length ? args : ALL_TARGETS;

const root = path.resolve(__dirname, '..');

for (const target of targets) {
  if (!ALL_TARGETS.includes(target)) {
    console.error(`Unknown target: ${target}`);
    console.error(`Valid targets: ${ALL_TARGETS.join(', ')}`);
    process.exit(1);
  }
}

for (const target of targets) {
  console.log(`\n── Building VSIX for ${target} ──`);

  // 1. Run esbuild with the platform target (copies only matching @img binaries)
  execSync(`node esbuild.js --vscode-target=${target}`, {
    cwd: root,
    stdio: 'inherit'
  });

  // 2. Package the VSIX for this target
  execSync(`npx vsce package --target ${target} --no-dependencies`, {
    cwd: root,
    stdio: 'inherit'
  });

  console.log(`✓ ${target} done`);
}

console.log(`\n── All ${targets.length} platform(s) packaged ──`);
