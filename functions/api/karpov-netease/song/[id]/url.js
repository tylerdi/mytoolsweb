// Cloudflare Pages Function: Get NetEase song play URL
// GET /api/karpov-netease/song/:id/url
// 直连网易云公共 API

export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const parts = pathname.split('/');
  const songId = parts[parts.length - 2];

  if (!songId || !/^\d+$/.test(songId)) {
    return Response.json({ error: 'Invalid song id' }, { status: 400 });
  }

  try {
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
        message: 'success',
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
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
