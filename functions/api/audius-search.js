// Cloudflare Pages Function: Audius Music Search + Stream Proxy
// GET /api/audius-search?q=jay+chou&limit=20
// GET /api/audius-stream?id=75098641

export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const APP = 'fishplayer';

  // 搜索
  if (pathname.endsWith('/audius-search')) {
    const q = searchParams.get('q');
    if (!q) return Response.json({ success: false, error: 'Missing q' }, { status: 400 });
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
      const url = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&app_name=${APP}&limit=${limit}`;
      const resp = await fetch(url, { headers: { 'User-Agent': 'FishPlayer/1.0' } });
      const data = await resp.json();

      const songs = (data.data || []).filter(t => t.is_streamable && t.stream?.url).map(t => ({
        id: t.track_id,
        name: t.title,
        artist: t.user?.name || 'Unknown',
        album: t.album_backlink?.playlist_name || '',
        duration: t.duration || 0,
        rid: `audius_${t.track_id}`,
        artwork: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
        streamUrl: t.stream.url,
        source: 'audius',
      }));

      return Response.json({ success: true, songs }, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
      });
    } catch (err) {
      return Response.json({ success: false, error: err.message, songs: [] }, { status: 500 });
    }
  }

  // 流代理
  if (pathname.endsWith('/audius-stream')) {
    const streamUrl = searchParams.get('url');
    if (!streamUrl) return Response.json({ success: false, error: 'Missing url' }, { status: 400 });

    try {
      const rangeHeader = context.request.headers.get('Range');
      const fetchHeaders = { 'User-Agent': 'FishPlayer/1.0' };
      if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

      const audioRes = await fetch(streamUrl, { headers: fetchHeaders });
      const headers = new Headers();
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Range');
      headers.set('Content-Type', 'audio/mpeg');
      headers.set('Accept-Ranges', 'bytes');
      headers.set('Cache-Control', 'public, max-age=3600');
      if (audioRes.headers.get('Content-Length')) headers.set('Content-Length', audioRes.headers.get('Content-Length'));
      if (audioRes.headers.get('Content-Range')) headers.set('Content-Range', audioRes.headers.get('Content-Range'));

      return new Response(audioRes.body, { status: audioRes.status, headers });
    } catch (err) {
      return new Response(err.message, { status: 502 });
    }
  }

  return new Response('Not found', { status: 404 });
}
