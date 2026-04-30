// functions/api/guestbook.js
// 访客留言 API
import { createDb } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, nickname, content } = await context.request.json();
    if (!visitor_id || !content) {
      return new Response(JSON.stringify({ error: 'visitor_id and content required' }), { status: 400 });
    }

    const result = await db.insert('guestbook', {
      visitor_id,
      nickname: nickname || '匿名访客',
      content,
    });

    return new Response(JSON.stringify({ ok: true, message: result[0] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const messages = await db.get('guestbook', {
      order: 'created_at.desc',
      limit,
    });

    return new Response(JSON.stringify({ ok: true, messages: messages || [] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
