// Cloudflare Pages Function: Kuwo Music Search
// GET /api/music-search?q=keyword&pn=1&rn=10

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const q = searchParams.get('q');
  const pn = parseInt(searchParams.get('pn') || '1');
  const rn = parseInt(searchParams.get('rn') || '10');

  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const offset = (pn - 1) * rn;
    const url = `http://search.kuwo.cn/r.s?all=${encodeURIComponent(q)}&ft=music&itemset=web_2013&client=kt&pn=${offset}&rn=${rn}&rformat=json&encoding=utf8`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'http://www.kuwo.cn/',
      },
    });

    const raw = await resp.text();

    // Kuwo returns JS object literal with single quotes, not valid JSON.
    // Strategy: wrap keys/values in proper JSON by replacing single quotes
    // Only replace quotes that are object delimiters (not inside values)
    let jsonStr = '';
    let inString = false;
    let quoteChar = '';
    let i = 0;

    // Simple approach: replace single quotes with double quotes, handling escapes
    // Since Kuwo values don't contain unescaped single quotes, this is safe
    jsonStr = raw.replace(/'/g, '"');

    const data = JSON.parse(jsonStr);

    const songs = (data.abslist || []).map((item) => {
      const rid = (item.MUSICRID || '').replace('MUSIC_', '');
      return {
        id: rid,
        name: item.SONGNAME || item.NAME || '',
        artist: item.ARTIST || '',
        album: item.ALBUM || '',
        duration: parseInt(item.DURATION || '0'),
        rid: rid,
        source: 'kuwo',
      };
    });

    return Response.json({
      success: true,
      total: parseInt(data.TOTAL || '0'),
      songs,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
