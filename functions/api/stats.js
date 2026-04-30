// functions/api/stats.js
// 网站统计 API
import { db } from './_supabase.js';

// 记录页面访问
export async function onRequestPost(context) {
  try {
    const { visitor_id, page } = await context.request.json();
    if (!visitor_id || !page) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400 });
    }

    await db.insert('page_views', { visitor_id, page });

    // 更新每日统计
    const today = new Date().toISOString().slice(0, 10);
    const todayViews = await db.get('page_views', {
      filters: { created_at: `gte.${today}T00:00:00` },
      select: 'id',
    });

    const todayVisitors = await db.get('page_views', {
      filters: { created_at: `gte.${today}T00:00:00` },
      select: 'visitor_id',
    });

    // 去重统计
    const uniqueVisitors = new Set((todayVisitors || []).map(v => v.visitor_id)).size;

    // Upsert 今日统计
    const existing = await db.get('site_stats', {
      filters: { stat_date: `eq.${today}` },
    });

    if (existing && existing.length > 0) {
      await db.update('site_stats', {
        page_views: todayViews?.length || 0,
        unique_visitors: uniqueVisitors,
      }, { stat_date: `eq.${today}` });
    } else {
      await db.insert('site_stats', {
        stat_date: today,
        page_views: todayViews?.length || 0,
        unique_visitors: uniqueVisitors,
      });
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 获取统计数据
export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'today';

    if (type === 'today') {
      const today = new Date().toISOString().slice(0, 10);
      const stats = await db.get('site_stats', {
        filters: { stat_date: `eq.${today}` },
      });

      // 获取总签到人数
      const totalCheckins = await db.get('checkins', {
        filters: { checkin_date: `eq.${today}` },
        select: 'id',
      });

      return new Response(JSON.stringify({
        ok: true,
        stats: {
          page_views: stats[0]?.page_views || 0,
          unique_visitors: stats[0]?.unique_visitors || 0,
          today_checkins: totalCheckins?.length || 0,
        },
      }));
    }

    if (type === 'total') {
      const totalViews = await db.get('page_views', { select: 'id' });
      const totalCheckins = await db.get('checkins', { select: 'id' });
      const totalMoods = await db.get('moods', { select: 'id' });
      const totalComments = await db.get('novel_comments', { select: 'id' });

      return new Response(JSON.stringify({
        ok: true,
        total: {
          page_views: totalViews?.length || 0,
          checkins: totalCheckins?.length || 0,
          moods: totalMoods?.length || 0,
          comments: totalComments?.length || 0,
        },
      }));
    }

    return new Response(JSON.stringify({ error: 'invalid type' }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
