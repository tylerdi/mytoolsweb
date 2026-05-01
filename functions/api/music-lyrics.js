// Cloudflare Pages Function: Get Kuwo Lyrics
// GET /api/music-lyrics?rid=154840539

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const rid = searchParams.get('rid');

  if (!rid) {
    return Response.json({ error: 'Missing parameter "rid"' }, { status: 400 });
  }

  try {
    const url = `https://m.kuwo.cn/newh5/singles/songinfoandlrc?musicId=${rid}`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    });

    const data = await resp.json();

    if (data.data && data.data.lrclist) {
      const lyrics = data.data.lrclist.map((item) => ({
        time: parseFloat(item.time),
        text: item.lineLyric || '',
      }));
      return Response.json({ success: true, lyrics });
    } else {
      return Response.json({ success: true, lyrics: [] });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
