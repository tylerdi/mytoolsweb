// Cloudflare Pages Function: Get song play URL via Karpov Gateway
// GET /api/karpov-netease/song/:id/url?level=exhigh

const KARPOV_BASE = 'https://women-weekends-instructions-amendment.trycloudflare.com';
const KARPOV_KEY = 'mk_9wXQ7IgA9X_3vmnJzunsjG8bVQ_oGlSW';

export async function onRequestGet(context) {
  const { searchParams, pathname } = new URL(context.request.url);
  const parts = pathname.split('/');
  const songId = parts[parts.length - 2]; // 'url' 前面那个

  if (!songId || !/^\d+$/.test(songId)) {
    return Response.json({ error: 'Invalid song id' }, { status: 400 });
  }

  try {
    const level = searchParams.get('level') || 'exhigh';
    const url = `${KARPOV_BASE}/v1/netease/songs/${songId}/url?level=${level}`;
    const resp = await fetch(url, {
      headers: { 'X-API-Key': KARPOV_KEY, 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    return Response.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=600' },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
