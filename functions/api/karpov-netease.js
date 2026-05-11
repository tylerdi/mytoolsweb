// Cloudflare Pages Function: Karpov Gateway - Netease Music Proxy
export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const path = pathname.replace('/api/karpov-netease', '');
  
  const KARPOV_BASE = 'https://syntax-tobago-scale-rid.trycloudflare.com';
  const KARPOV_KEY = 'mk_9wXQ7IgA9X_3vmnJzunsjG8bVQ_oGlSW';

  try {
    let url;
    const headers = {
      'X-API-Key': KARPOV_KEY,
      'Content-Type': 'application/json',
    };

    if (path === '/search') {
      const q = searchParams.get('q');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('page_size') || '10');

      if (!q) {
        return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
      }

      url = `${KARPOV_BASE}/v1/netease/search/songs?q=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`;
    } else if (path.startsWith('/song/') && path.endsWith('/url')) {
      const songId = path.split('/')[2];
      const level = searchParams.get('level') || 'exhigh';
      url = `${KARPOV_BASE}/v1/netease/songs/${songId}/url?level=${level}`;
    } else {
      return Response.json({ error: 'Unknown endpoint', path }, { status: 404 });
    }

    const resp = await fetch(url, { headers });
    const data = await resp.json();

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
