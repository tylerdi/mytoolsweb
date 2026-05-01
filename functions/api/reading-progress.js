// functions/api/reading-progress.js
// Novel reading progress API
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
    if (!visitor_id) return json({ ok: false, error: 'visitor_id required' }, 400);

    const data = await db.get('reading_progress', {
      filters: { visitor_id: `eq.${visitor_id}` },
      order: 'last_read.desc',
    });
    return json({ ok: true, data: data || [] });
  } catch (err) {
    if (err.message?.includes("404") || err.message?.includes("PGRST205")) return json({ ok: true, data: [], _note: "table not created yet" }); return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, chapter_id, scroll_pct, last_read } = await context.request.json();
    if (!visitor_id || !chapter_id) {
      return json({ ok: false, error: 'visitor_id and chapter_id required' }, 400);
    }

    // Upsert: update if exists, insert if not (unique constraint on visitor_id + chapter_id)
    const result = await db.upsert('reading_progress', {
      visitor_id, chapter_id, scroll_pct: scroll_pct || 0, last_read: last_read || new Date().toISOString(),
    });
    return json({ ok: true, data: result });
  } catch (err) {
    if (err.message?.includes("404") || err.message?.includes("PGRST205")) return json({ ok: true, data: [], _note: "table not created yet" }); return json({ ok: false, error: err.message }, 500);
  }
}
