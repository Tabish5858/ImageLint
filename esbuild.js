const esbuild = require('esbuild');

const watch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  sourcemap: true,
  outfile: 'dist/extension.js',
  external: ['vscode', 'sharp'],
  logLevel: 'info',
  target: 'node20'
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context(baseConfig);
    await ctx.watch();
    console.log('ImageLint: watching for changes...');
    return;
  }

  await esbuild.build(baseConfig);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
