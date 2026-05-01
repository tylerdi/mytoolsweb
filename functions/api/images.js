// functions/api/images.js
// AI image history API
import { createDb } from './_supabase.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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

export async function onRequestGet(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const visitor_id = url.searchParams.get('visitor_id');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    if (!visitor_id) return json({ ok: false, error: 'visitor_id required' }, 400);

    const data = await db.get('images', {
      filters: { visitor_id: `eq.${visitor_id}` },
      order: 'created_at.desc',
      limit,
    });
    return json({ ok: true, data: data || [] });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, prompt, style, url: imgUrl, seed } = await context.request.json();
    if (!visitor_id || !prompt) {
      return json({ ok: false, error: 'visitor_id and prompt required' }, 400);
    }

    const result = await db.insert('images', {
      visitor_id, prompt, style: style || null, url: imgUrl || null, seed: seed || null,
    });
    return json({ ok: true, data: result });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestDelete(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const visitor_id = url.searchParams.get('visitor_id');
    const id = url.searchParams.get('id');
    if (!visitor_id || !id) {
      return json({ ok: false, error: 'visitor_id and id required' }, 400);
    }

    await db.delete('images', { visitor_id: `eq.${visitor_id}`, id: `eq.${id}` });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}
