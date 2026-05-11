// functions/api/gallery.js
// 图床 API —— gpt-image-2 高质量图片画廊
import { createDb } from './_supabase.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

// GET /api/gallery?page=1&limit=20&tag=carbon-circle
export async function onRequestGet(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50);
    const tag = url.searchParams.get('tag');
    const offset = (page - 1) * limit;

    const filters = {};
    if (tag) filters.tag = `eq.${tag}`;

    const data = await db.get('gallery', {
      filters,
      order: 'created_at.desc',
      limit,
      offset,
    });

    // 获取总数
    const countData = await db.get('gallery', {
      select: 'count',
      filters,
    });
    const total = countData?.[0]?.count || data?.length || 0;

    return json({ ok: true, data: data || [], total, page, limit });
  } catch (err) {
    if (err.message?.includes('404') || err.message?.includes('PGRST205')) {
      return json({ ok: true, data: [], total: 0, _note: 'table not created yet' });
    }
    return json({ ok: false, error: err.message }, 500);
  }
}

// POST /api/gallery  { prompt, url, tag, source }
export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const body = await context.request.json();
    const { prompt, url: imgUrl, tag, source, width, height } = body;

    if (!prompt || !imgUrl) {
      return json({ ok: false, error: 'prompt and url required' }, 400);
    }

    const result = await db.insert('gallery', {
      prompt,
      url: imgUrl,
      tag: tag || 'general',
      source: source || 'gpt-image-2',
      width: width || 1024,
      height: height || 1024,
    });

    return json({ ok: true, data: result });
  } catch (err) {
    if (err.message?.includes('404') || err.message?.includes('PGRST205')) {
      return json({ ok: true, data: [], _note: 'table not created yet' });
    }
    return json({ ok: false, error: err.message }, 500);
  }
}

// DELETE /api/gallery?id=xxx
export async function onRequestDelete(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const id = url.searchParams.get('id');
    if (!id) return json({ ok: false, error: 'id required' }, 400);

    await db.delete('gallery', { id: `eq.${id}` });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}
