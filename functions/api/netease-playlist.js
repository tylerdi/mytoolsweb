// functions/api/netease-playlist.js
// 网易云歌单代理（解决 CORS 问题）

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');

    if (!id) return json({ ok: false, error: 'id parameter required' }, 400);

    const res = await fetch(
      `https://music.163.com/api/playlist/detail?id=${id}`,
      {
        headers: {
          'Referer': 'https://music.163.com',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
      }
    );

    if (!res.ok) throw new Error(`NetEase HTTP ${res.status}`);

    const data = await res.json();
    const tracks = data.result?.tracks || data.playlist?.tracks || [];

    const songs = tracks.slice(0, 50).map(t => ({
      id: `ne_${t.id}`,
      title: t.name,
      artist: t.artists?.[0]?.name || '未知',
      duration: Math.round((t.duration || 0) / 1000),
      artwork: t.album?.picUrl ? t.album.picUrl + '?param=300y300' : '',
      type: 'netease',
      neId: t.id,
      neName: t.name,
      neArtist: t.artists?.[0]?.name || '',
    }));

    return json({ ok: true, data: songs });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}
