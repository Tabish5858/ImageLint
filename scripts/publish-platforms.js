/**
 * Publish all platform-specific VSIX files found in the project root.
 *
 * Usage:
 *   node scripts/publish-platforms.js              # publish all .vsix files
 *   node scripts/publish-platforms.js --dry-run    # list what would be published
 *
 * Prerequisites:
 *   npm run package:target   (builds all platform VSIX files)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const vsixFiles = fs
  .readdirSync(root)
  .filter((f) => f.endsWith('.vsix'))
  .sort();

if (vsixFiles.length === 0) {
  console.error('No .vsix files found. Run "npm run package:target" first.');
  process.exit(1);
}

console.log(`Found ${vsixFiles.length} VSIX file(s):\n`);
for (const f of vsixFiles) {
  const size = fs.statSync(path.join(root, f)).size;
  const mb = (size / 1024 / 1024).toFixed(1);
  console.log(`  ${f}  (${mb} MB)`);
}

if (dryRun) {
  console.log('\n--dry-run: nothing published.');
  process.exit(0);
}

console.log('');

const failed = [];
const succeeded = [];

for (const f of vsixFiles) {
  console.log(`── Publishing ${f} ──`);
  try {
    execSync(`npx vsce publish --packagePath ${f} --no-dependencies`, {
      cwd: root,
      stdio: 'inherit'
    });
    succeeded.push(f);
    console.log(`✓ ${f} published\n`);
  } catch {
    failed.push(f);
    console.error(`✗ ${f} failed to publish\n`);
  }
}

console.log(`── Done: ${succeeded.length} published, ${failed.length} failed ──`);
if (failed.length > 0) {
  console.error('\nFailed:');
  for (const f of failed) console.error(`  - ${f}`);
  process.exit(1);
}
