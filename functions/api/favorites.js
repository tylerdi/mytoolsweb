// functions/api/favorites.js
// Music/Image favorites API
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
    const type = url.searchParams.get('type');
    if (!visitor_id) return json({ ok: false, error: 'visitor_id required' }, 400);

    const filters = { visitor_id: `eq.${visitor_id}` };
    if (type) filters.type = `eq.${type}`;

    const data = await db.get('favorites', { filters, order: 'created_at.desc' });
    return json({ ok: true, data: data || [] });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, type, item_id, data: itemData } = await context.request.json();
    if (!visitor_id || !type || !item_id) {
      return json({ ok: false, error: 'visitor_id, type, item_id required' }, 400);
    }

    const result = await db.insert('favorites', {
      visitor_id, type, item_id, data: itemData || {},
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
    const item_id = url.searchParams.get('item_id');
    if (!visitor_id || !item_id) {
      return json({ ok: false, error: 'visitor_id and item_id required' }, 400);
    }

    await db.delete('favorites', { visitor_id: `eq.${visitor_id}`, item_id: `eq.${item_id}` });
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}
