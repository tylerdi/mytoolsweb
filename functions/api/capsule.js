// functions/api/capsule.js
// 时间胶囊 API
import { db } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const { visitor_id, content, open_date } = await context.request.json();
    if (!visitor_id || !content || !open_date) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
    }

    const result = await db.insert('capsules', {
      visitor_id, content, open_date,
    });

    return new Response(JSON.stringify({ ok: true, capsule: result[0] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const visitor_id = url.searchParams.get('visitor_id');
    if (!visitor_id) return new Response(JSON.stringify({ error: 'visitor_id required' }), { status: 400 });

    const today = new Date().toISOString().slice(0, 10);

    // 获取所有胶囊
    const capsules = await db.get('capsules', {
      filters: { visitor_id: `eq.${visitor_id}` },
      order: 'created_at.desc',
    });

    // 自动开启到期的
    for (const c of capsules || []) {
      if (!c.is_opened && c.open_date <= today) {
        await db.update('capsules', { is_opened: true }, { id: `eq.${c.id}` });
        c.is_opened = true;
      }
    }

    return new Response(JSON.stringify({ ok: true, capsules: capsules || [] }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
