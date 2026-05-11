// Cloudflare Pages Function: NetEase Music Search (直连网易云API)
// GET /api/karpov-netease/search?q=keyword&page=1&page_size=10

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
    const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(q)}&type=1&offset=${offset}&limit=${pageSize}`;
    const resp = await fetch(url, {
      headers: {
        'Referer': 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const raw = await resp.json();

    const items = (raw.result?.songs || []).map(s => ({
      id: String(s.id),
      title: s.name,
      artist: (s.artists || []).map(a => a.name).join(' / '),
      artists: (s.artists || []).map(a => ({ id: String(a.id), name: a.name })),
      album: s.album ? { id: String(s.album.id), title: s.album.name, cover: s.album.picUrl ? s.album.picUrl + '?param=300y300' : '' } : null,
      durationSeconds: Math.round((s.duration || 0) / 1000),
      isVipOnly: (s.fee === 1),
      playable: true,
      provider: 'netease',
    }));

    return Response.json({
      code: 200,
      data: {
        items,
        hasMore: (raw.result?.songCount || 0) > offset + pageSize,
        page,
        pageSize,
        total: raw.result?.songCount || 0,
      }
    }, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
