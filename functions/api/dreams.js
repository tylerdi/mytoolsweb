// functions/api/dreams.js
// Dream interpretations API
import { createDb } from './_supabase.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    const data = await db.get('dreams', {
      filters: { visitor_id: `eq.${visitor_id}` },
      order: 'created_at.desc',
      limit,
    });
    return json({ ok: true, data: data || [] });
  } catch (err) {
    if (err.message?.includes("404") || err.message?.includes("PGRST205")) return json({ ok: true, data: [], _note: "table not created yet" }); return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, dream_text, interpretation } = await context.request.json();
    if (!visitor_id || !dream_text) {
      return json({ ok: false, error: 'visitor_id and dream_text required' }, 400);
    }

    const result = await db.insert('dreams', {
      visitor_id, dream_text, interpretation: interpretation || null,
    });
    return json({ ok: true, data: result });
  } catch (err) {
    if (err.message?.includes("404") || err.message?.includes("PGRST205")) return json({ ok: true, data: [], _note: "table not created yet" }); return json({ ok: false, error: err.message }, 500);
  }
}
