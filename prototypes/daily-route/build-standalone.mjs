import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = new URL('./', import.meta.url);
const read = async (name) => readFile(new URL(name, base), 'utf8');

let html = await read('index.html');
const css = await read('game.css');
const voyageCss = await read('../../assets/voyage.css');
const voyageCode = (await read('../../assets/voyage.mjs')).replace(/^export /gm, '');
const levels = (await read('route-levels.mjs')).replace(/^export /gm, '');
const core = (await read('game-core.mjs')).replace(/^import .* from '\.\/route-levels\.mjs';\n/, '').replace(/^export /gm, '');
const analytics = (await read('../../assets/game-analytics.mjs')).replace(/^export /gm, '');
const game = (await read('game.mjs'))
  .replace(/^import .* from '\.\/game-core\.mjs';\n/, '')
  .replace(/^import .* from '\.\.\/\.\.\/assets\/game-analytics\.mjs';\n/, '')
  .replace(/^import .* from '\.\.\/\.\.\/assets\/voyage\.mjs';\n/, '');

html = html
  .replace('<link rel="stylesheet" href="./game.css">', `<style>\n${css}\n</style>`)
  .replace('<link rel="stylesheet" href="../../assets/voyage.css">', `<style>\n${voyageCss}\n</style>`)
  .replace('<script type="module" src="./game.mjs"></script>', `<script>\n${levels}\n${core}\n${analytics}\n${voyageCode}\n${game}\n</script>`)
  .replace('href="./"', 'href="./daily-route.html"')
  .replace('<a href="./PLAN.md">设计与验证范围</a>', '离线可玩');

for (const name of ['boat', 'dock', 'beacon', 'reef', 'lighthouse', 'logo']) {
  const svg = await read(`assets/${name}.svg`);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  html = html.replaceAll(`./assets/${name}.svg`, dataUrl);
}

const output = fileURLToPath(new URL('daily-route.html', base));
await writeFile(output, html);
console.log(output);

const home = html
  .replace('<meta name="robots" content="noindex,nofollow">', '<meta name="google-adsense-account" content="ca-pub-6426056111301969">\n  <link rel="canonical" href="https://tylerzhang.xyz/"><link rel="icon" type="image/svg+xml" href="/favicon.svg?v=3"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=3"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3">')
  .replace('href="./daily-route.html"', 'href="/"')
  .replace('每日航线 · 独立可玩原型 · 无广告与账号 · 离线可玩', '© 2026 每日航线 · <a href="/about">关于</a> · <a href="/privacy">隐私</a> · <a href="/contact">反馈</a>');
await writeFile(fileURLToPath(new URL('../../index.html', base)), home);
await writeFile(fileURLToPath(new URL('../../assets/daily-route-logo.svg', base)), await read('assets/logo.svg'));
