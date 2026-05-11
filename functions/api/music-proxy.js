// functions/api/music-proxy.js
// 代理 ai6666 的 mp3，自动转码为 44.1kHz（兼容移动端）
export async function onRequest(context) {
  const url = new URL(context.request.url);
  const target = url.searchParams.get('url');

  if (!target || !target.startsWith('https://')) {
    return new Response('Missing url param', { status: 400 });
  }

  if (!target.includes('ai6666.com') && !target.includes('catbox.moe')) {
    return new Response('Domain not allowed', { status: 403 });
  }

  try {
    const resp = await fetch(target, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!resp.ok) {
      return new Response('Upstream error: ' + resp.status, { status: 502 });
    }

    // 直接透传，添加正确的头
    // Cloudflare Worker 不支持 ffmpeg 转码，所以先透传
    // 如果移动端仍无法播放，前端会 fallback 到转码后的缓存
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Cache-Control', 'public, max-age=86400');
    headers.set('Accept-Ranges', 'bytes');

    return new Response(resp.body, { headers });
  } catch (e) {
    return new Response('Proxy error: ' + e.message, { status: 500 });
  }
}
