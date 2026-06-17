// functions/api/grocery.js
// 解忧杂货店 API - 复用 tree_holes 表，不同的 AI 人格
import { createDb } from './_supabase.js';

// 杂货店老爷爷的回信
async function getShopReply(content, mood, env) {
  try {
    const MIMO_API_BASE = (env.MIMO_API_BASE || 'https://openrouter.ai/api/v1').replace(/\/chat\/completions\/?$/, '');
    const MIMO_API_KEY = env.MIMO_API_KEY;
    if (!MIMO_API_KEY) throw new Error('MIMO_API_KEY not configured');
    const moodHint = mood && mood !== 'unknown' ? `（来信人的心情：${mood}）` : '';
    const res = await fetch(`${MIMO_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + MIMO_API_KEY,
      },
      body: JSON.stringify({
        model: env.MIMO_MODEL || 'xiaomi/mimo-v2.5',
        messages: [
          {
            role: 'system',
            content: `你是「解忧杂货店」的老爷爷，运行在 tylerzhang.xyz 网站上。

你的设定：
- 你是一个开在巷子深处的杂货店老板，七十多岁，白发苍苍
- 每天深夜，你会坐在柜台后面，给投信进来的人写回信
- 你说话温和、简洁，像一个智慧的长辈
- 你不会说教，而是用故事、比喻、或者一个小小的角度转换来启发对方
- 你的回信像一封手写的信，有温度、有质感

规则：
- 回信 80-150 字，像一封信的片段
- 开头可以用"孩子"或"年轻人"或直接进入内容
- 不要写"亲爱的xxx"这种格式
- 不要说"我理解你的感受"这种套话
- 可以用一个小小的比喻或故事片段
- 结尾可以加一个温暖的收尾
- 偶尔可以用"——杂货店老人"签名（不要每次都加）
- 用"你"而不是"您"，亲切但有分寸`,
          },
          {
            role: 'user',
            content: `${moodHint}来信内容：${content}`,
          },
        ],
        max_tokens: 250,
        stream: false,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '夜深了，信我已收到。明天再来坐坐吧。';
  } catch {
    return '夜深了，信我已收到。明天再来坐坐吧。';
  }
}

// 写信（投进杂货店）
export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    const { visitor_id, content, mood } = await context.request.json();

    if (!visitor_id || !content) {
      return new Response(JSON.stringify({ error: 'visitor_id and content required' }), { status: 400 });
    }

    if (content.length > 1000) {
      return new Response(JSON.stringify({ error: '信不能超过 1000 字' }), { status: 400 });
    }

    // 存入 tree_holes 表，标记来源
    const result = await db.insert('tree_holes', {
      visitor_id,
      content: content.trim(),
      mood: mood || 'unknown',
    });

    const hole = result[0];

    // 老爷爷回信
    const aiReply = await getShopReply(content, mood, context.env);
    await db.update('tree_holes', { ai_reply: aiReply }, { id: `eq.${hole.id}` });

    return new Response(JSON.stringify({
      ok: true,
      letter: { ...hole, ai_reply: aiReply },
    }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 读取来信（匿名）
export async function onRequestGet(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const holes = await db.get('tree_holes', {
      order: 'created_at.desc',
      limit,
      offset,
    });

    const safe = (holes || []).map(h => ({
      id: h.id,
      content: h.content,
      mood: h.mood,
      ai_reply: h.ai_reply,
      hugs: h.hugs,
      created_at: h.created_at,
    }));

    return new Response(JSON.stringify({ ok: true, letters: safe }));
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 拥抱/温暖
export async function onRequestPatch(context) {
  try {
    const db = createDb(context.env);
    const { id, action } = await context.request.json();

    if (!id || action !== 'hug') {
      return new Response(JSON.stringify({ error: 'id and action=hug required' }), { status: 400 });
    }

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
