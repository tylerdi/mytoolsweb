// Cloudflare Pages Function: Kuwo Audio Proxy (解决 CORS)
// GET /api/kuwo-proxy?rid=148755

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const rid = searchParams.get('rid');

  if (!rid) {
    return new Response('Missing rid', { status: 400 });
  }

  try {
    // 先拿播放链接
    const apiUrl = `http://antiserver.kuwo.cn/anti.s?type=convert_url3&rid=${rid}&format=mp3&response=url`;
    const apiRes = await fetch(apiUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    const apiData = await apiRes.json();

    if (!apiData.url) {
      return new Response('No play URL', { status: 404 });
    }

    // 代理音频流
    const audioRes = await fetch(apiData.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });

    const headers = new Headers(audioRes.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(audioRes.body, {
      status: audioRes.status,
      headers,
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}
