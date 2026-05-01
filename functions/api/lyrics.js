// functions/api/lyrics.js
// 歌词代理：网易云歌词（解决 CORS）

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
    const title = url.searchParams.get('title');
    const artist = url.searchParams.get('artist');

    // 方式1：通过网易云歌曲ID获取歌词
    if (id) {
      const lyrics = await fetchNeteaseLyrics(id);
      return json({ ok: true, data: lyrics });
    }

    // 方式2：先搜索歌曲ID，再获取歌词
    if (title) {
      const songId = await searchSongId(title, artist || '');
      if (songId) {
        const lyrics = await fetchNeteaseLyrics(songId);
        return json({ ok: true, data: lyrics, songId });
      }
      return json({ ok: true, data: [], note: '未找到匹配歌曲' });
    }

    return json({ ok: false, error: 'id or title parameter required' }, 400);
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

async function searchSongId(title, artist) {
  const q = artist ? `${title} ${artist}` : title;
  const res = await fetch(
    `https://music.163.com/api/search/get?s=${encodeURIComponent(q)}&type=1&limit=5`,
    {
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const songs = data.result?.songs || [];
  // 优先找标题完全匹配的
  const exact = songs.find(s => s.name === title);
  return (exact || songs[0])?.id || null;
}

async function fetchNeteaseLyrics(songId) {
  const res = await fetch(
    `https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1`,
    {
      headers: {
        'Referer': 'https://music.163.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }
  );
  if (!res.ok) return [];
  const data = await res.json();

  // 解析LRC格式歌词
  const lrc = data.lrc?.lyric || '';
  const tlyric = data.tlyric?.lyric || ''; // 翻译歌词

  if (!lrc) return [];

  const lines = parseLRC(lrc);
  const transLines = tlyric ? parseLRC(tlyric) : [];

  // 合并翻译
  const transMap = {};
  transLines.forEach(l => { transMap[l.time] = l.text; });

  return lines.map(l => ({
    time: l.time,
    text: l.text,
    trans: transMap[l.time] || '',
  }));
}

function parseLRC(lrc) {
  const lines = [];
  const regex = /\[(\d+):(\d+)\.(\d+)\]\s*(.*)/g;
  let match;
  while ((match = regex.exec(lrc)) !== null) {
    const min = parseInt(match[1]);
    const sec = parseInt(match[2]);
    const ms = parseInt(match[3]);
    const time = min * 60 + sec + ms / 100;
    const text = match[4].trim();
    if (text) lines.push({ time: Math.round(time * 100) / 100, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}
