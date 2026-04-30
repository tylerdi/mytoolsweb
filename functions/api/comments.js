// functions/api/comments.js
// 小说评论 API
import { db } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const { visitor_id, chapter_id, nickname, content } = await context.request.json();
    if (!visitor_id || !chapter_id || !content) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
    }

    const result = await db.insert('novel_comments', {
      visitor_id, chapter_id,
      nickname: nickname || '匿名读者',
      content,
    });

    return new Response(JSON.stringify({ ok: true, comment: result[0] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const chapter_id = url.searchParams.get('chapter_id');
    if (!chapter_id) return new Response(JSON.stringify({ error: 'chapter_id required' }), { status: 400 });

    const comments = await db.get('novel_comments', {
      filters: { chapter_id: `eq.${chapter_id}` },
      order: 'created_at.desc',
      limit: 50,
    });

    return new Response(JSON.stringify({ ok: true, comments: comments || [] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
