// functions/api/mood.js
// 心情日记 API
import { db } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const { visitor_id, mood, note, ai_reply } = await context.request.json();
    if (!visitor_id || !mood) {
      return new Response(JSON.stringify({ error: 'visitor_id and mood required' }), { status: 400 });
    }

    const result = await db.insert('moods', {
      visitor_id, mood, note: note || '', ai_reply: ai_reply || '',
    });

    return new Response(JSON.stringify({ ok: true, mood: result[0] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const visitor_id = url.searchParams.get('visitor_id');
    if (!visitor_id) return new Response(JSON.stringify({ error: 'visitor_id required' }), { status: 400 });

    const moods = await db.get('moods', {
      filters: { visitor_id: `eq.${visitor_id}` },
      order: 'created_at.desc',
      limit: 30,
    });

    return new Response(JSON.stringify({ ok: true, moods: moods || [] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
