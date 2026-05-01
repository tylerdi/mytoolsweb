// Cloudflare Pages Function: Get Kuwo Play URL
// GET /api/music-play?rid=154840539

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const rid = searchParams.get('rid');

  if (!rid) {
    return Response.json({ error: 'Missing parameter "rid"' }, { status: 400 });
  }

  try {
    const url = `http://antiserver.kuwo.cn/anti.s?type=convert_url3&rid=${rid}&format=mp3&response=url`;

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    const raw = await resp.text();
    const data = JSON.parse(raw);

    if (data.url) {
      return Response.json({
        success: true,
        url: data.url,
        rid,
      });
    } else {
      return Response.json({ error: 'No play URL found', raw: data }, { status: 404 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
