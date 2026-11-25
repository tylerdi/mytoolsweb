import { mkdir, writeFile } from 'node:fs/promises';
import { corner, spot } from '../src/puzzles.mjs';

const publicDir = new URL('../public/', import.meta.url);
const siteOrigin = 'https://tylerzhang.xyz';
const sitemapUrls = [];
const canonicalPath = (name) => name === 'index.html' ? '/' : '/' + name.replace(/\.html$/, '');
const write = (name, value) => writeFile(new URL(name, publicDir), value, 'utf8');
function writePage(name, options) {
  if (name !== '404.html') sitemapUrls.push(siteOrigin + canonicalPath(name));
  return write(name, page({ ...options, name }));
}
const e = (str) => String(str).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const games = {
  spot: { name: '一眼穿帮', kind: '线索推理', puzzles: spot },
  corner: { name: '这是什么的一角', kind: '看图猜物', puzzles: corner },
};
const puzzleUrl = (base, game, puzzle) => base + 'play/' + game + '-' + puzzle.id + '.html';
const catalogUrl = (base, game) => base + game + '.html';
const progressId = (game, puzzle) => `${game}-${puzzle.id}${puzzle.revision ? '-r' + puzzle.revision : ''}`;

function page({ name, title, description, main, base = './', active = '', bodyClass = '' }) {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${e(title)}</title>
  <meta name="description" content="${e(description)}">
  <meta name="theme-color" content="#f5f2e9">
  ${name === '404.html' ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${siteOrigin}${canonicalPath(name)}">`}
${name === 'index.html' ? '  <meta name="google-adsense-account" content="ca-pub-6426056111301969">\n' : ''}  <link rel="icon" href="${base}assets/icon.png" type="image/png">
  <link rel="stylesheet" href="${base}assets/site.css">
  <script defer src="${base}assets/play.js"></script>
</head>
<body class="${bodyClass}">
  <a class="skip" href="#main">跳到正文</a>
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="${base}index.html"><span class="brand-mark" aria-hidden="true">✦</span> 三分钟谜题社</a>
      <nav aria-label="游戏导航">
        ${Object.entries(games).map(([key, game]) => `<a ${active === key ? 'aria-current="true"' : ''} href="${catalogUrl(base, key)}">${game.name}</a>`).join('')}
      </nav>
    </div>
  </header>
  <main id="main" class="wrap">${main}</main>
  <footer class="site-footer">
    <div class="wrap footer-inner"><a href="${base}index.html">三分钟谜题社</a><a href="${base}about.html">关于题目与隐私</a></div>
  </footer>
</body>
</html>\n`;
}

function card(game, className, mark, headline, description) {
  const info = games[game];
  return `<article class="game-card ${className}">
  <div class="card-top"><span>${info.kind} <span aria-hidden="true">·</span> ${info.puzzles.length} 题</span><span class="card-mark" aria-hidden="true">${mark}</span></div>
  <h3>${headline}</h3><p>${description}</p>
  <div class="card-actions">
    <a class="button" href="${puzzleUrl('./', game, info.puzzles[0])}">开始${info.kind === '线索推理' ? '推理' : '猜图'} <span aria-hidden="true">↗</span></a>
    <a class="button secondary" href="${catalogUrl('./', game)}" aria-label="${info.name}选题">选题</a>
  </div>
</article>`;
}

await mkdir(new URL('play/', publicDir), { recursive: true });
await writePage('index.html', {
  title: '三分钟谜题社 · 两款短谜题',
  description: `玩一局原创短谜题。读三条记录找矛盾，或者看一张静物插画的局部猜物品。共 ${spot.length + corner.length} 题。`,
  bodyClass: 'home',
  main: `
  <section class="hero" aria-labelledby="headline">
    <div>
      <p class="eyebrow">两种玩法 · ${spot.length + corner.length} 道原创短题</p>
      <h1 id="headline">这题，<br><em>你看出来了吗？</em></h1>
      <p class="hero-description">在三条记录里发现破绽，或从一小块图里猜出桌上是什么。每题一分钟左右。</p>
      <div class="actions"><a class="button primary" href="${puzzleUrl('./', 'spot', spot[0])}">玩第一题 <span aria-hidden="true">↗</span></a><a class="plain-link" href="#games">挑个玩法 <span aria-hidden="true">↓</span></a></div>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="art-grid"></div>
      <div class="art-note">
        <span>09:05</span><b>18</b><small>张贴纸</small>
        <i></i><i></i>
      </div>
      <div class="art-photo"><img src="./assets/peg-2.webp" alt="" width="257" height="193"></div>
      <span class="art-star">✳</span>
      <span class="art-question">?</span>
    </div>
  </section>
  <section class="games" id="games" aria-labelledby="games-title">
    <div class="section-heading"><h2 id="games-title">挑一个，马上玩</h2><p>可从任意一题开始</p></div>
    <div class="cards">
      ${card('spot', 'blue', '≠', '一眼穿帮', '看三条记录，找出唯一一条与事实对不上的。')}
      ${card('corner', 'orange', '◩', '这是什么的一角', '先看局部，猜不出就多看一点，最后揭晓全图。')}
    </div>
  </section>
  `,
});

await writePage('about.html', {
  title: '关于题目与隐私 · 三分钟谜题社',
  description: '了解三分钟谜题社的原创题面、静物插画及本机游玩记录。',
  main: `
  <article class="about">
    <a class="plain-link" href="./index.html">← 返回首页</a>
    <h1>关于三分钟谜题社</h1>
    <section><h2>题目怎么做</h2><p>「一眼穿帮」的题面是为本站写的虚构小故事。每题给出判断依据和答案解析。「这是什么的一角」使用本站绘制的数字静物插画，两级局部都从同一张完整图裁切。</p></section>
    <section><h2>本机进度</h2><p>本站把已完成的题号和答案选项保存在当前浏览器，用于恢复进度。页面无需注册，作答记录只保存在本机。清理浏览器中该站点的数据可重置进度。分享链接只包含题目地址。</p></section>
  </article>`,
});

await writePage('404.html', {
  base: '/',
  title: '找不到这个页面 · 三分钟谜题社',
  description: '这个网址没有对应的页面。',
  main: `
  <div class="play-wrap">
    <h1>找不到这个页面</h1>
    <div class="actions"><a class="button primary" href="/">回到首页</a></div>
  </div>`,
});

const letters = ['A', 'B', 'C', 'D'];
function choices(items) {
  return `<fieldset class="choices">
      <legend>选一个答案</legend>
      ${items.map((value, index) => `<label class="choice">
        <input type="radio" name="answer" value="${index}" required>
        <span class="choice-letter">${letters[index]}</span>
        <span>${value}</span>
      </label>`).join('')}
    </fieldset>`;
}

function spotContent(puzzle) {
  const facts = [
    puzzle.rules && `<p>${e(puzzle.rules)}</p>`,
    puzzle.facts && evidenceList(puzzle.facts),
  ].filter(Boolean).join('\n      ');
  return `<div class="instruction"><b>已知事实</b>${facts}
    </div>
    ${choices(puzzle.clues.map(([time, label, text]) =>
      `<span class="clue-meta">${e(time)} <span aria-hidden="true">·</span> ${e(label)}</span><span class="clue-text">${e(text)}</span>`))}`;
}

function cornerContent(puzzle) {
  return `<figure class="picture">
      <img src="../assets/${puzzle.id}-1.webp" alt="${e(puzzle.clue)}" width="800" height="600"
        data-picture data-wider-src="../assets/${puzzle.id}-2.webp" data-wider-alt="${e(puzzle.wider)}">
      <figcaption><span data-picture-note aria-live="polite">${e(puzzle.clue)}</span><button type="button" class="hint" data-hint hidden>多看一点 <span aria-hidden="true">↘</span></button></figcaption>
    </figure>
    ${choices(puzzle.options.map(e))}`;
}

function evidenceList(items) {
  return `<dl class="evidence-list">
    ${items.map(([label, detail]) => `<div><dt>${e(label)}</dt><dd>${e(detail)}</dd></div>`).join('')}
  </dl>`;
}

function answerContent(game, puzzle) {
  if (game === 'corner') {
    return `<figure class="reveal"><img loading="lazy" src="../assets/${puzzle.id}-full.webp" alt="${e(puzzle.alt)}" width="800" height="600"></figure>
    <p><strong>${e(puzzle.options[puzzle.answer])}</strong>。 ${e(puzzle.explanation)}</p>`;
  }
  return [
    `<p><strong>${letters[puzzle.answer]} · ${e(puzzle.clues[puzzle.answer][1])}</strong>的说法对不上。</p>`,
    puzzle.proof && evidenceList(puzzle.proof),
    `<p>${e(puzzle.explanation)}</p>`,
  ].filter(Boolean).join('\n    ');
}

for (const [key, game] of Object.entries(games)) {
  const other = key === 'spot' ? 'corner' : 'spot';
  const base = '../';
  const catalogDescription = key === 'spot'
    ? '对照两条或三条线索，指出哪条说法对不上。答完可以查看证据。'
    : '先看静物的一小块。需要提示时可以扩大范围，最后揭晓整张插画。';

  await writePage(key + '.html', {
    active: key, bodyClass: 'catalog-page ' + key,
    title: '选题 · ' + game.name,
    description: catalogDescription,
    main: `
  <div class="play-wrap">
    <div class="play-path"><a href="./index.html#games">所有玩法</a></div>
    <h1>${game.name}</h1>
    <p class="play-intro">${catalogDescription}</p>
    <div class="catalog-heading"><h2>全部 ${game.puzzles.length} 题</h2><a class="plain-link" href="${catalogUrl('./', other)}">换个玩法 <span aria-hidden="true">↗</span></a></div>
    <ol class="question-list" aria-label="${game.name}题目">
      ${game.puzzles.map((puzzle, index) => `<li><a href="${puzzleUrl('./', key, puzzle)}" data-question="${progressId(key, puzzle)}">
        <span class="question-number">${String(index + 1).padStart(2, '0')}</span>
        <span class="question-title"><strong>${e(puzzle.title)}</strong>${puzzle.scene ? `<span>${e(puzzle.scene)}</span>` : ''}</span>
        <small data-done hidden>已答</small><span class="question-arrow" aria-hidden="true">→</span>
      </a></li>`).join('')}
    </ol>
  </div>`,
  });

  for (const [index, puzzle] of game.puzzles.entries()) {
    const number = index + 1;
    const last = number === game.puzzles.length;
    const review = answerContent(key, puzzle);
    const instruction = key === 'spot' ? puzzle.intro + ' 找出与事实不符的一条。' : '观察局部插画，猜猜它是什么。你也可以先多看一点。';
    await writePage('play/' + key + '-' + puzzle.id + '.html', {
      base, active: key, bodyClass: 'game-page ' + key,
      title: puzzle.title + ' · ' + game.name,
      description: instruction,
      main: `
  <div class="play-wrap">
    <div class="play-path"><a href="../index.html#games">所有玩法</a><span aria-hidden="true">/</span><span>${game.name}</span></div>
    <div class="play-meta"><span>${game.kind}${puzzle.scene ? ' · ' + e(puzzle.scene) : ''}</span><div>第 ${number} / ${game.puzzles.length} 题 <a href="${catalogUrl(base, key)}">选题</a></div></div>
    <h1>${e(puzzle.title)}</h1>
    <p class="play-intro">${e(instruction)}</p>
    <form data-puzzle data-key="${progressId(key, puzzle)}" data-answer="${puzzle.answer}" data-evidence="${(puzzle.evidence ?? []).join(',')}">
      ${key === 'spot' ? spotContent(puzzle) : cornerContent(puzzle)}
      <div class="actions"><button type="submit" class="button primary" data-submit hidden>确认答案</button></div>
    </form>
    <noscript><details class="answer"><summary>打开答案与解析</summary>${review}</details></noscript>
    <section class="answer" data-result hidden aria-labelledby="result-title">
      <h2 id="result-title" tabindex="-1" data-verdict>答案与解析</h2>
      ${review}
      <button class="hint" type="button" data-retry>重玩本题</button>
    </section>
    <div class="play-actions">
      <a class="button ${last ? '' : 'primary'}" href="${last ? catalogUrl(base, key) : puzzleUrl(base, key, game.puzzles[index + 1])}">${last ? '返回选题' : '再来一题'} <span aria-hidden="true">→</span></a>
      <a class="button" href="${puzzleUrl(base, other, games[other].puzzles[0])}">换个玩法</a>
      <button class="hint" type="button" data-share hidden>分享本题</button>
      <div class="share-panel" data-share-panel hidden><label for="share-url">复制链接发给朋友</label><input id="share-url" readonly><span role="status" data-share-status></span></div>
    </div>
  </div>`,
    });
  }
}

await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>\n`);
