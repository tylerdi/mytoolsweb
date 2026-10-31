import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const base = new URL('./', import.meta.url);
const read = async (name) => readFile(new URL(name, base), 'utf8');

let html = await read('index.html');
const css = await read('game.css');
const core = (await read('game-core.mjs')).replace(/^export /gm, '');
const game = (await read('game.mjs')).replace(/^import .* from '\.\/game-core\.mjs';\n/, '');

html = html
  .replace('<link rel="stylesheet" href="./game.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./game.mjs"></script>', `<script>\n${core}\n${game}\n</script>`)
  .replace('href="./"', 'href="./daily-route.html"')
  .replace('<a href="./PLAN.md">设计与验证范围</a>', '离线可玩');

for (const name of ['boat', 'dock', 'beacon', 'reef', 'lighthouse']) {
  const svg = await read(`assets/${name}.svg`);
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  html = html.replaceAll(`./assets/${name}.svg`, dataUrl);
}

const output = fileURLToPath(new URL('daily-route.html', base));
await writeFile(output, html);
console.log(output);

const home = html
  .replace('<meta name="robots" content="noindex,nofollow">', '<meta name="google-adsense-account" content="ca-pub-6426056111301969">\n  <link rel="canonical" href="https://tylerzhang.xyz/"><link rel="icon" href="/favicon.svg">')
  .replace('href="./daily-route.html"', 'href="/"')
  .replace('独立游戏原型 · 本机保存成绩', '每日一局 · 本机保存成绩')
  .replace('每日航线 · 独立可玩原型 · 无广告与账号 · 离线可玩', '© 2026 每日航线 · <a href="/about">关于</a> · <a href="/privacy">隐私</a> · <a href="/contact">反馈</a>');
await writeFile(fileURLToPath(new URL('../../index.html', base)), home);
