export function gone() {
  return new Response(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>内容已下线 | Tyler 工作台</title><body style="font:16px/1.7 system-ui,sans-serif;max-width:680px;margin:12vh auto;padding:0 20px;color:#183026"><h1>内容已下线</h1><p>此旧页面不再维护。请从当前工作台查找仍可使用的工具与指南。</p><p><a href="/">返回工作台</a> · <a href="/tools">开发工具</a> · <a href="/blog/">排错指南</a></p></body></html>`, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
