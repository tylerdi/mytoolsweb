// functions/api/stats.js
// 网站统计 API
import { db } from './_supabase.js';

// 记录页面访问 / 停留时间
export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { visitor_id, page, session_id, referrer, ua, duration, type } = body;

    if (!visitor_id) {
      return new Response(JSON.stringify({ error: 'visitor_id required' }), { status: 400 });
    }

    // 如果是停留时间上报
    if (type === 'duration' && duration) {
      // 更新最近一条该页面的访问记录的停留时间
      const today = new Date().toISOString().slice(0, 10);
      await db.insert('page_views', {
        visitor_id,
        page: page || 'unknown',
        duration,
        type: 'duration',
      });
      return new Response(JSON.stringify({ ok: true, type: 'duration' }));
    }

    // 普通页面访问
    if (!page) {
      return new Response(JSON.stringify({ error: 'page required' }), { status: 400 });
    }

    await db.insert('page_views', {
      visitor_id,
      page,
      session_id: session_id || '',
      referrer: referrer || '',
      ua: ua || '',
    });

    // 更新每日统计
    const today = new Date().toISOString().slice(0, 10);
    const todayViews = await db.get('page_views', {
      filters: { created_at: `gte.${today}T00:00:00`, type: 'is.null' },
      select: 'id',
    });

    const todayVisitors = await db.get('page_views', {
      filters: { created_at: `gte.${today}T00:00:00`, type: 'is.null' },
      select: 'visitor_id',
    });

    // 去重统计 UV
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

      // 获取今日签到人数
      const totalCheckins = await db.get('checkins', {
        filters: { checkin_date: `eq.${today}` },
        select: 'id',
      });

      // 获取今日心情数
      const todayMoods = await db.get('moods', {
        filters: { created_at: `gte.${today}T00:00:00` },
        select: 'id',
      });

      return new Response(JSON.stringify({
        ok: true,
        stats: {
          page_views: stats[0]?.page_views || 0,
          unique_visitors: stats[0]?.unique_visitors || 0,
          today_checkins: totalCheckins?.length || 0,
          today_moods: todayMoods?.length || 0,
        },
      }));
    }

    if (type === 'total') {
      const totalViews = await db.get('page_views', { select: 'id', filters: { type: 'is.null' } });
      const totalCheckins = await db.get('checkins', { select: 'id' });
      const totalMoods = await db.get('moods', { select: 'id' });
      const totalComments = await db.get('novel_comments', { select: 'id' });
      const totalCapsules = await db.get('capsules', { select: 'id' });

      return new Response(JSON.stringify({
        ok: true,
        total: {
          page_views: totalViews?.length || 0,
          checkins: totalCheckins?.length || 0,
          moods: totalMoods?.length || 0,
          comments: totalComments?.length || 0,
          capsules: totalCapsules?.length || 0,
        },
      }));
    }

    if (type === 'popular') {
      // 热门页面排行
      const today = new Date().toISOString().slice(0, 10);
      const views = await db.get('page_views', {
        filters: { created_at: `gte.${today}T00:00:00`, type: 'is.null' },
        select: 'page',
      });

      // 统计各页面访问量
      const pageCounts = {};
      (views || []).forEach(v => {
        pageCounts[v.page] = (pageCounts[v.page] || 0) + 1;
      });

      const popular = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([page, count]) => ({ page, count }));

      return new Response(JSON.stringify({ ok: true, popular }));
    }

    return new Response(JSON.stringify({ error: 'invalid type' }), { status: 400 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
