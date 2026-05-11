// Cloudflare Pages Function: NetEase Music Search via Karpov Gateway
// GET /api/karpov-netease/search?q=keyword&page=1&page_size=10

const KARPOV_BASE = 'https://extra-general-namespace-recently.trycloudflare.com';
const KARPOV_KEY = 'mk_9wXQ7IgA9X_3vmnJzunsjG8bVQ_oGlSW';

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '10');

  if (!q) {
    return Response.json({ error: 'Missing query parameter "q"' }, { status: 400 });
  }

  try {
    const url = `${KARPOV_BASE}/v1/netease/search/songs?q=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`;
    const resp = await fetch(url, {
      headers: { 'X-API-Key': KARPOV_KEY, 'Content-Type': 'application/json' },
    });
    const data = await resp.json();
    return Response.json(data, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=300' },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
