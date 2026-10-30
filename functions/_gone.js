export function gone() {
  return new Response(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>内容已下线 | Tyler 表格修复台</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/sheet.css?v=1"></head><body><header class="site-header"><div class="header-inner"><a class="brand" href="/"><span class="brand-mark">T</span><span>Tyler <small>/ 表格修复台</small></span></a></div></header><main class="shell"><header class="intro"><div><p class="eyebrow">410 / 内容已下线</p><h1>这个旧页面不再维护</h1><p>本站现专注 CSV 导入问题诊断与数据修复。旧页面仅留在代码仓库供追溯。</p></div></header><nav class="related" aria-label="当前页面入口"><a href="/">打开 CSV 体检台</a><a href="/blog/">阅读处理指南</a><a href="/about">了解改版</a></nav></main></body></html>`, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
