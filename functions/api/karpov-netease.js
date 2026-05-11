// Cloudflare Pages Function: Karpov Gateway - Netease Music Proxy
// GET /api/karpov-netease/search?q=keyword&page=1&page_size=10
// GET /api/karpov-netease/song/:id/url
// GET /api/karpov-netease/song/:id/lyric

const KARPOV_BASE = 'http://localhost:18080';
const KARPOV_KEY = 'mk_9wXQ7IgA9X_3vmnJzunsjG8bVQ_oGlSW';

export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const path = pathname.replace('/api/karpov-netease', '');

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
    } else if (path.startsWith('/song/') && path.endsWith('/lyric')) {
      const songId = path.split('/')[2];
      url = `${KARPOV_BASE}/v1/netease/songs/${songId}/lyric`;
    } else {
      return Response.json({ error: 'Unknown endpoint' }, { status: 404 });
    }

    const resp = await fetch(url, { headers });
    const data = await resp.json();

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
