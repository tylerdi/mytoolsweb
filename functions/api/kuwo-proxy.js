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
    const apiText = await apiRes.text();
    let playUrl;
    try {
      const apiData = JSON.parse(apiText);
      playUrl = apiData.url;
    } catch {
      // 有时候返回的不是JSON，直接当URL用
      playUrl = apiText.trim();
    }

    if (!playUrl || !playUrl.startsWith('http')) {
      return new Response('No play URL', { status: 404 });
    }

    // 代理音频流（支持 Range 请求，手机播放需要）
    const rangeHeader = context.request.headers.get('Range');
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    };
    if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

    const audioRes = await fetch(playUrl, { headers: fetchHeaders });

    // 直接构造新响应，保留原始状态和必要的头
    const respHeaders = new Headers(audioRes.headers);
    respHeaders.set('Access-Control-Allow-Origin', '*');
    respHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    respHeaders.set('Access-Control-Allow-Headers', 'Range');
    respHeaders.set('Cache-Control', 'public, max-age=3600');
    respHeaders.set('Content-Type', 'audio/mpeg');
    respHeaders.set('Accept-Ranges', 'bytes');

    return new Response(audioRes.body, {
      status: audioRes.status,
      headers: respHeaders,
    });
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 500 });
  }
}
