// Cloudflare Pages Function: NetEase Music Search (直连网易云API，不走Karpov)
// GET /api/karpov-netease/search?q=keyword&page=1&page_size=10
// GET /api/karpov-netease/song/:id/url?level=exhigh

export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const path = pathname.replace('/api/karpov-netease', '');

  try {
    if (path === '/search') {
      const q = searchParams.get('q');
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('page_size') || '10');

      if (!q) {
        return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
      }

      const offset = (page - 1) * pageSize;
      // 网易云搜索 API
      const url = `https://music.163.com/api/search/get?s=${encodeURIComponent(q)}&type=1&offset=${offset}&limit=${pageSize}`;
      const resp = await fetch(url, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      });
      const raw = await resp.json();

      if (!raw.result || !raw.result.songs) {
        return Response.json({ code: 200, data: { items: [], hasMore: false, page, pageSize, total: 0 } });
      }

      const items = raw.result.songs.map(s => ({
        id: String(s.id),
        title: s.name,
        artist: (s.artists || []).map(a => a.name).join(' / '),
        artists: (s.artists || []).map(a => ({ id: String(a.id), name: a.name })),
        album: s.album ? { id: String(s.album.id), title: s.album.name, cover: s.album.picUrl ? s.album.picUrl + '?param=300y300' : '' } : null,
        durationSeconds: Math.round((s.duration || 0) / 1000),
        isVipOnly: (s.fee === 1),
        playable: true,
        provider: 'netease',
        publishDate: '',
      }));

      return Response.json({
        code: 200,
        data: {
          items,
          hasMore: raw.result.songCount > offset + pageSize,
          page,
          pageSize,
          total: raw.result.songCount || 0,
        }
      }, {
        headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
      });
    }

    // /song/:id/url — 获取歌曲播放地址
    if (path.match(/^\/song\/\d+\/url$/)) {
      const songId = path.split('/')[2];
      const level = searchParams.get('level') || 'exhigh';

      // 尝试通过网易云外链获取播放地址
      const url = `https://music.163.com/api/song/enhance/player/url?id=${songId}&ids=[${songId}]&br=320000`;
      const resp = await fetch(url, {
        headers: {
          'Referer': 'https://music.163.com/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Cookie': 'os=pc; appver=2.10.15;',
        },
      });
      const raw = await resp.json();

      const song = raw.data?.[0];
      if (song && song.url) {
        return Response.json({
          code: 200,
          data: {
            audio: { url: song.url },
            br: song.br || 128000,
            size: song.size || 0,
            type: song.type || 'mp3',
          }
        }, {
          headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=600' },
        });
      }

      return Response.json({ code: 404, message: 'Song not available' }, { status: 404 });
    }

    return Response.json({ error: 'Unknown endpoint', path }, { status: 404 });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
