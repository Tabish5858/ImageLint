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
const fs = require('fs');
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

// ── Preflight: verify all platform binaries are available ──
console.log('── Preflight: verifying platform binaries ──');
try {
  execSync('node scripts/verify-platforms.js', { cwd: root, stdio: 'inherit' });
} catch {
  console.error('\n✗ Platform binaries missing. Run: npm run install:sharp-all');
  process.exit(1);
}

// ── Preflight: lint check ──
console.log('\n── Preflight: linting ──');
execSync('npm run lint', { cwd: root, stdio: 'inherit' });

for (const target of targets) {
  console.log(`\n── Building VSIX for ${target} ──`);

  // 1. Run esbuild with the platform target (copies only matching @img binaries)
  execSync(`node esbuild.js --vscode-target=${target}`, {
    cwd: root,
    stdio: 'inherit'
  });

  // 2. Verify the dist has the required files
  const distImg = path.join(root, 'dist', 'node_modules', '@img');
  const colourExists = fs.existsSync(path.join(distImg, 'colour'));
  const hasBinaries = fs.readdirSync(distImg).some((name) => name.startsWith('sharp-'));
  if (!colourExists || !hasBinaries) {
    console.error(`✗ ${target}: dist is missing required @img packages`);
    console.error(
      `  colour: ${colourExists ? 'OK' : 'MISSING'}, binaries: ${hasBinaries ? 'OK' : 'MISSING'}`
    );
    process.exit(1);
  }

  // 3. Run smoke test (validates extension loads + sharp works on current platform)
  console.log(`  Running smoke test...`);
  execSync('node scripts/smoke-test.js', { cwd: root, stdio: 'inherit' });

  // 4. Package the VSIX for this target
  execSync(`npx vsce package --target ${target} --no-dependencies`, {
    cwd: root,
    stdio: 'inherit'
  });

  console.log(`✓ ${target} done`);
}

console.log(`\n── All ${targets.length} platform(s) packaged ──`);
