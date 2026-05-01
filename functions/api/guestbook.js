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
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const messages = await db.get('guestbook', {
      order: 'created_at.desc',
      limit,
      offset,
    });

    return new Response(JSON.stringify({ ok: true, messages: messages || [] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 更新留言（如保存 AI 回复）
export async function onRequestPatch(context) {
  try {
    const db = createDb(context.env);
    const { id, ai_reply } = await context.request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'id required' }), { status: 400 });
    }

    await db.update('guestbook', { ai_reply }, { id: `eq.${id}` });
    return new Response(JSON.stringify({ ok: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
