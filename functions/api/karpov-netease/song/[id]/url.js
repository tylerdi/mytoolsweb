// Cloudflare Pages Function: Get NetEase song play URL via Karpov Gateway
// GET /api/karpov-netease/song/:id/url

const KARPOV_GATEWAY = 'https://karpov.tylerzhang.xyz';
const KARPOV_API_KEY = 'mk_9wXQ7IgA9X_3vmnJzunsjG8bVQ_oGlSW';

export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const parts = pathname.split('/');
  const songId = parts[parts.length - 2];

  if (!songId || !/^\d+$/.test(songId)) {
    return Response.json({ error: 'Invalid song id' }, { status: 400 });
  }

  const level = searchParams.get('level') || 'exhigh';

  try {
    const url = `${KARPOV_GATEWAY}/v1/netease/song/url?id=${songId}&level=${level}`;
    const resp = await fetch(url, {
      headers: {
        'X-API-Key': KARPOV_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });
    const raw = await resp.json();

    if (raw.code === 200 && raw.data?.url) {
      return Response.json({
        code: 200,
        message: 'success',
        data: {
          audio: { url: raw.data.url },
          br: raw.data.br || 128000,
          size: raw.data.size || 0,
          type: raw.data.type || 'mp3',
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
