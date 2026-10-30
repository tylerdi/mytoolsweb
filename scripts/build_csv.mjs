import { build } from 'esbuild';

await build({
  entryPoints: ['csv-lab.mjs'],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  outfile: 'assets/csv-lab.js',
});
