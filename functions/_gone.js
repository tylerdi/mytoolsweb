export function gone() {
  return new Response(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>内容已下线 | 每日航线</title><link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png?v=2"><link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2"><link rel="stylesheet" href="/info.css"></head><body><header class="topbar"><div class="topbar-inner"><a class="brand" href="/"><span class="brand-mark" aria-hidden="true">↗</span>每日航线</a></div></header><main><p class="eyebrow">410 / 内容已下线</p><h1>这个旧页面不再维护</h1><p class="lead">网站已改为每日航线。旧页面保留在代码仓库供追溯，不再作为公开内容维护。</p><nav class="related" aria-label="当前页面入口"><a href="/">开始游戏</a><a href="/about">关于本站</a></nav></main></body></html>`, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
