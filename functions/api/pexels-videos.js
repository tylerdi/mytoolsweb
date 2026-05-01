// Cloudflare Pages Function: Pexels Video Proxy (隐藏 API Key)
// GET /api/pexels-videos?query=nature&per_page=24&page=1

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const query = searchParams.get('query') || 'nature';
  const perPage = parseInt(searchParams.get('per_page') || '24');
  const page = parseInt(searchParams.get('page') || '1');
  const KEY = 'DqKEbBsmBik7vOSGk4HDJxsfKqK8aXvUJrXw0Sg25e0ZvJSn9c90YpcE';

  try {
    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    const resp = await fetch(url, {
      headers: { Authorization: KEY, 'User-Agent': 'FishPlayer/1.0' },
    });

    if (!resp.ok) {
      return Response.json({ success: false, error: `Pexels ${resp.status}` }, { status: resp.status });
    }

    const data = await resp.json();
    return Response.json({
      success: true,
      videos: data.videos || [],
      total_results: data.total_results || 0,
      page,
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
