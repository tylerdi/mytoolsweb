export function gone() {
  return new Response(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>内容已下线 | Tyler 工作台</title><link rel="icon" type="image/png" href="/resource/easyclaw.png"><link rel="stylesheet" href="/style.css?v=4"><link rel="stylesheet" href="/editorial.css?v=5"></head><body><main class="editorial-shell article-shell"><header class="page-intro"><p class="eyebrow">410 / 内容已下线</p><h1>这个旧页面不再维护</h1><p>当前网站专注 AI 应用开发工具与可复现的排错案例。</p></header><nav class="article-body" aria-label="当前页面入口"><div class="guide-list"><a href="/"><strong>返回工作台</strong><span>JSON 输出检查</span></a><a href="/tools"><strong>开发工具</strong><span>编码、时间和正则</span></a><a href="/blog/"><strong>排错指南</strong><span>当前维护的案例</span></a></div></nav></main></body></html>`, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
