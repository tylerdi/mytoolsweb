// Cloudflare Pages Function: NetEase Music Search via Karpov Gateway
// GET /api/karpov-netease/search?q=keyword&page=1&page_size=10

const KARPOV_GATEWAY = 'https://karpov.tylerzhang.xyz';
const KARPOV_API_KEY = 'mk_9wXQ7IgA9X_3vmnJzunsjG8bVQ_oGlSW';

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '10');

  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const offset = (page - 1) * pageSize;
    const url = `${KARPOV_GATEWAY}/v1/netease/search/songs?q=${encodeURIComponent(q)}&page=${page}&limit=${pageSize}`;
    const resp = await fetch(url, {
      headers: {
        'X-API-Key': KARPOV_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const raw = await resp.json();

    if (raw.code !== 200) {
      return Response.json({ error: raw.message || 'Search failed' }, { status: 500 });
    }

    const items = (raw.data?.items || []).map(s => ({
      id: String(s.id),
      title: s.title,
      artist: s.artist || s.artists?.map(a => a.name).join(' / ') || '',
      artists: s.artists || [],
      album: s.album || null,
      durationSeconds: s.durationSeconds || 0,
      isVipOnly: s.isVipOnly || false,
      playable: s.playable || false,
      provider: s.provider || 'netease',
    }));

    return Response.json({
      code: 200,
      message: 'success',
      data: {
        items,
        hasMore: raw.data?.hasMore || false,
        page,
        pageSize,
        total: raw.data?.total || 0,
      }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
