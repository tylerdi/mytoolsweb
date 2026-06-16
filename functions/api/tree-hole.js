// functions/api/tree-hole.js
// AI 树洞 API
import { createDb } from './_supabase.js';

// AI 回复（温暖语气）
async function getAiReply(content, mood, env) {
  try {
    const MIMO_API_BASE = env.MIMO_API_BASE;
    const MIMO_API_KEY = env.MIMO_API_KEY;
    if (!MIMO_API_KEY) throw new Error('MIMO_API_KEY not configured');
    const moodHint = mood && mood !== 'unknown' ? `（用户选择的心情：${mood}）` : '';
    const res = await fetch(`${MIMO_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Origin': 'https://tylerzhang.xyz',
        'Referer': 'https://tylerzhang.xyz/',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      body: JSON.stringify({
        model: 'mimo-v2.5',
        messages: [
          {
            role: 'system',
            content: `你是一个温暖的树洞，运行在 tylerzhang.xyz 网站上。
用户会匿名向你倾诉心事，你需要用温柔、理解、不评判的语气回应。
规则：
- 回复 50-120 字，简短但有温度
- 不要说"我理解你的感受"这种套话
- 可以用 emoji，但不要太多（1-2个）
- 不要给建议，除非用户明确要求
- 用"你"而不是"您"，亲切一点
- 如果用户心情不好，先共情，再给一点温暖
- 如果用户心情好，跟着开心就好`,
          },
          {
            role: 'user',
            content: `${moodHint}${content}`,
          },
        ],
        max_tokens: 200,
        stream: false,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '谢谢你愿意说出来 🤗';
  } catch {
    return '谢谢你愿意说出来 🤗';
  }
}

export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, content, mood } = await context.request.json();

    if (!visitor_id || !content) {
      return new Response(JSON.stringify({ error: 'visitor_id and content required' }), { status: 400 });
    }

    if (content.length > 1000) {
      return new Response(JSON.stringify({ error: '内容不能超过 1000 字' }), { status: 400 });
    }

    // 先存入数据库
    const result = await db.insert('tree_holes', {
      visitor_id,
      content: content.trim(),
      mood: mood || 'unknown',
    });

    const hole = result[0];

    // 异步获取 AI 回复并更新
    const aiReply = await getAiReply(content, mood, context.env);
    await db.update('tree_holes', { ai_reply: aiReply }, { id: `eq.${hole.id}` });

    return new Response(JSON.stringify({
      ok: true,
      hole: { ...hole, ai_reply: aiReply },
    }));
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

    const holes = await db.get('tree_holes', {
      order: 'created_at.desc',
      limit,
      offset,
    });

    // 隐藏 visitor_id
    const safe = (holes || []).map(h => ({
      id: h.id,
      content: h.content,
      mood: h.mood,
      ai_reply: h.ai_reply,
      hugs: h.hugs,
      created_at: h.created_at,
    }));

    return new Response(JSON.stringify({ ok: true, holes: safe }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 拥抱
export async function onRequestPatch(context) {
  try {
    const db = createDb(context.env);
    const { id, action } = await context.request.json();

    if (!id || action !== 'hug') {
      return new Response(JSON.stringify({ error: 'id and action=hug required' }), { status: 400 });
    }

    // 获取当前 hugs 数
    const existing = await db.get('tree_holes', {
      filters: { id: `eq.${id}` },
      select: 'hugs',
      limit: 1,
    });

    if (!existing || existing.length === 0) {
      return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
    }

    const newHugs = (existing[0].hugs || 0) + 1;
    await db.update('tree_holes', { hugs: newHugs }, { id: `eq.${id}` });

    return new Response(JSON.stringify({ ok: true, hugs: newHugs }));
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
