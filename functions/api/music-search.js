// functions/api/music-search.js
// 音乐搜索代理：网易云 + QQ音乐（解决 CORS 问题）

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
    const q = url.searchParams.get('q');
    const source = url.searchParams.get('source') || 'all'; // all, netease, qq
    const limit = parseInt(url.searchParams.get('limit') || '20');

    if (!q) return json({ ok: false, error: 'q parameter required' }, 400);

    const results = { netease: [], qq: [] };

    // 并行搜索
    const tasks = [];

    if (source === 'all' || source === 'netease') {
      tasks.push(
        searchNetease(q, limit).then(r => { results.netease = r; }).catch(() => {})
      );
    }

    if (source === 'all' || source === 'qq') {
      tasks.push(
        searchQQ(q, limit).then(r => { results.qq = r; }).catch(() => {})
      );
    }

    await Promise.all(tasks);

    return json({ ok: true, data: results });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

async function searchNetease(q, limit) {
  const res = await fetch(
    `https://music.163.com/api/search/get?s=${encodeURIComponent(q)}&type=1&limit=${limit}&offset=0`,
    {
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }
  );

  if (!res.ok) throw new Error(`NetEase HTTP ${res.status}`);

  const data = await res.json();
  const songs = data.result?.songs || [];

  return songs.map(s => ({
    id: `ne_${s.id}`,
    title: s.name,
    artist: s.artists?.[0]?.name || '未知',
    duration: Math.round((s.duration || 0) / 1000),
    artwork: s.album?.picUrl ? s.album.picUrl + '?param=300y300' : '',
    type: 'netease',
    neId: s.id,
    neName: s.name,
    neArtist: s.artists?.[0]?.name || '',
  }));
}

async function searchQQ(q, limit) {
  const res = await fetch(
    `https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(q)}&format=json&limit=${limit}`
  );

  if (!res.ok) throw new Error(`QQ Music HTTP ${res.status}`);

  const data = await res.json();
  const songs = data.data?.song?.list || [];

  return songs.map(s => ({
    id: `qq_${s.songid}`,
    title: s.songname,
    artist: s.singer?.[0]?.name || '未知',
    duration: s.interval || 0,
    artwork: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '',
    type: 'qq',
    qqName: s.songname,
    qqArtist: s.singer?.[0]?.name || '',
  }));
}
