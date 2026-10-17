import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

const result = await build({
  entryPoints: [
    'schema-lab.mjs',
    'schema-worker.mjs',
    'sse-lab.mjs',
    'http-headers-lab.mjs',
    'usage-cost-lab.mjs',
  ],
  outdir: 'assets/labs',
  entryNames: '[name]',
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: ['es2022'],
  minify: true,
  metafile: true,
  logLevel: 'info',
});

const packages = [...new Set(Object.keys(result.metafile.inputs)
  .filter((path) => path.startsWith('node_modules/'))
  .map((path) => path.split('/')[1]))].sort();
const notices = await Promise.all(packages.map(async (name) => {
  const root = `node_modules/${name}`;
  const manifest = JSON.parse(await readFile(`${root}/package.json`, 'utf8'));
  const license = await readFile(`${root}/LICENSE`, 'utf8');
  return `${name} ${manifest.version} (${manifest.license})\n${license.trim()}\n`;
}));
await writeFile('assets/labs/THIRD_PARTY_NOTICES.txt', notices.join('\n---\n\n'));
