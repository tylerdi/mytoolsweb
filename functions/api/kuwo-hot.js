// Cloudflare Pages Function: Kuwo Hot Songs (热歌榜)
// GET /api/kuwo-hot?pn=1&rn=30

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const pn = parseInt(searchParams.get('pn') || '1');
  const rn = parseInt(searchParams.get('rn') || '100');

  try {
    // 酷我热歌榜 (bangId=93)
    const url = `http://www.kuwo.cn/api/www/bang/bang/musicList?bangId=93&pn=${pn}&rn=${rn}&httpsStatus=1`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'http://www.kuwo.cn/',
        'Cookie': 'kw_token=',
        'csrf': '',
      },
    });

    const data = await resp.json();

    if (data.data && data.data.musicList) {
      const songs = data.data.musicList.map(item => ({
        id: item.rid,
        name: item.name,
        artist: item.artist,
        album: item.album || '',
        duration: item.duration || 0,
        rid: item.rid,
        artwork: item.pic ? `https://img1.kuwo.cn/star/albumcover/${item.pic.replace(/^\//, '')}` : (item.albumpic || ''),
        source: 'kuwo',
      }));
      return Response.json({ success: true, total: data.data.num || songs.length, songs });
    }

    // fallback: 用搜索接口拿热歌
    return await fallbackHot(rn);
  } catch (err) {
    return await fallbackHot(rn);
  }
}

async function fallbackHot(rn) {
  // 用热门关键词搜索作为后备
  const keywords = ['热歌', '流行', '华语经典', '抖音热歌'];
  const kw = keywords[Math.floor(Math.random() * keywords.length)];
  try {
    const url = `http://search.kuwo.cn/r.s?all=${encodeURIComponent(kw)}&ft=music&itemset=web_2013&client=kt&pn=0&rn=${rn}&rformat=json&encoding=utf8`;
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'http://www.kuwo.cn/',
      },
    });
    const raw = await resp.text();
    const jsonStr = raw.replace(/'/g, '"');
    const data = JSON.parse(jsonStr);
    const songs = (data.abslist || []).map(item => {
      const rid = (item.MUSICRID || '').replace('MUSIC_', '');
      return {
        id: rid,
        name: item.SONGNAME || item.NAME || '',
        artist: item.ARTIST || '',
        album: item.ALBUM || '',
        duration: parseInt(item.DURATION || '0'),
        rid,
        artwork: item.web_artistpic_short || '',
        source: 'kuwo',
      };
    });
    return Response.json({ success: true, total: songs.length, songs });
  } catch (e) {
    return Response.json({ success: false, error: e.message, songs: [] }, 500);
  }
}
