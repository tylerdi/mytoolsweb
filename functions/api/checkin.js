// functions/api/checkin.js
// 签到 API
import { db } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const { visitor_id } = await context.request.json();
    if (!visitor_id) return new Response(JSON.stringify({ error: 'visitor_id required' }), { status: 400 });

    const today = new Date().toISOString().slice(0, 10);

    // 检查今天是否已签到
    const existing = await db.get('checkins', {
      filters: { visitor_id: `eq.${visitor_id}`, checkin_date: `eq.${today}` },
    });

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ ok: true, already: true, streak: existing[0].streak }));
    }

    // 获取昨天的签到记录
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const lastCheckin = await db.get('checkins', {
      filters: { visitor_id: `eq.${visitor_id}`, checkin_date: `eq.${yesterday}` },
    });

    const streak = (lastCheckin && lastCheckin.length > 0) ? lastCheckin[0].streak + 1 : 1;

    // 插入今天的签到
    const result = await db.insert('checkins', {
      visitor_id,
      checkin_date: today,
      streak,
    });

    return new Response(JSON.stringify({ ok: true, streak, total: result[0]?.id || 0 }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestGet(context) {
  try {
    const visitor_id = context.request.url.split('visitor_id=')[1];
    if (!visitor_id) return new Response(JSON.stringify({ error: 'visitor_id required' }), { status: 400 });

    // 获取连续签到天数
    const today = new Date().toISOString().slice(0, 10);
    const todayCheckin = await db.get('checkins', {
      filters: { visitor_id: `eq.${visitor_id}`, checkin_date: `eq.${today}` },
    });

    // 获取总签到次数
    const allCheckins = await db.get('checkins', {
      filters: { visitor_id: `eq.${visitor_id}` },
      select: 'id',
    });

    return new Response(JSON.stringify({
      checked_today: todayCheckin && todayCheckin.length > 0,
      streak: todayCheckin[0]?.streak || 0,
      total: allCheckins?.length || 0,
    }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
