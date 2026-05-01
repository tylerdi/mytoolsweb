// Cloudflare Pages Function: Kuwo Hot Songs (热歌榜)
// GET /api/kuwo-hot?pn=1&rn=30

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const pn = parseInt(searchParams.get('pn') || '1');
  const rn = parseInt(searchParams.get('rn') || '100');

  // 酷我搜索接口（稳定）
  const keywords = ['热歌', '流行', '华语经典', '抖音热歌', '粤语经典', '民谣', '电子', '说唱'];
  const kw = keywords[Math.floor(Math.random() * keywords.length)];

  try {
    const url = `http://search.kuwo.cn/r.s?all=${encodeURIComponent(kw)}&ft=music&itemset=web_2013&client=kt&pn=${(pn - 1) * rn}&rn=${rn}&rformat=json&encoding=utf8`;
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
      const art = item.web_artistpic_short || item.web_albumpic_short || '';
      return {
        id: rid,
        name: (item.SONGNAME || item.NAME || '').replace(/&nbsp;/g, ' '),
        artist: (item.ARTIST || '').replace(/&nbsp;/g, ' '),
        album: (item.ALBUM || '').replace(/&nbsp;/g, ' '),
        duration: parseInt(item.DURATION || '0'),
        rid,
        artwork: art ? `https://img2.kuwo.cn/star/artistpic/${art}` : '',
        source: 'kuwo',
      };
    });
    return Response.json({ success: true, total: parseInt(data.TOTAL || '0'), songs, keyword: kw });
  } catch (e) {
    return Response.json({ success: false, error: e.message, songs: [] }, 500);
  }
}
