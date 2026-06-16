// functions/api/mystery-box.js
// AI 盲盒 API - 随机生成各种有趣内容

const PROMPTS = [
  {
    type: '冷知识',
    emoji: '🧊',
    prompt: '说一个大多数人不知道的冷知识，要有趣、有冲击力。只说内容，不要加"你知道吗"之类的开头，50字以内。',
  },
  {
    type: '毒鸡汤',
    emoji: '🍵',
    prompt: '说一句扎心的毒鸡汤，要犀利、好笑、有道理。只说内容，50字以内。',
  },
  {
    type: '今日运势',
    emoji: '🔮',
    prompt: '用玄学的语气给一个随机星座/生肖算今日运势，要具体、有趣，带一个幸运数字和幸运颜色。50字以内。',
  },
  {
    type: '笑话',
    emoji: '😂',
    prompt: '讲一个短笑话，要好笑、不尬。只讲笑话本身，50字以内。',
  },
  {
    type: '诗词',
    emoji: '📜',
    prompt: '用古诗的风格写一首关于"摸鱼"的五言绝句，要有意境。只写诗，不要标题和解释。',
  },
  {
    type: '奇怪事实',
    emoji: '🤯',
    prompt: '说一个真实存在的、听起来很离谱的事实。只说内容，50字以内。',
  },
  {
    type: '彩虹屁',
    emoji: '🌈',
    prompt: '用最真诚、最有文采的方式夸一个人，要具体、不油腻。只说内容，50字以内。',
  },
  {
    type: '人生建议',
    emoji: '💡',
    prompt: '给一条反直觉的人生建议，要犀利、有洞察。只说内容，50字以内。',
  },
  {
    type: '脑筋急转弯',
    emoji: '🧠',
    prompt: '出一个脑筋急转弯，格式是"问题？答：答案"。要有趣，不要太老套。',
  },
  {
    type: '表白文案',
    emoji: '💌',
    prompt: '写一句高级的表白文案，要有文艺感、不肉麻。只写文案，30字以内。',
  },
];

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { exclude } = await context.request.json().catch(() => ({}));

    // 随机选一个类型（排除上次的类型）
    let available = PROMPTS;
    if (exclude) {
      available = PROMPTS.filter(p => p.type !== exclude);
      if (available.length === 0) available = PROMPTS;
    }
    const chosen = available[Math.floor(Math.random() * available.length)];

    // 调 AI 生成
    const MIMO_API_BASE = context.env.MIMO_API_BASE || 'https://opencode.ai/zen/v1';
    const MIMO_API_KEY = context.env.MIMO_API_KEY;
    if (!MIMO_API_KEY) {
      return new Response(JSON.stringify({ error: 'MIMO_API_KEY not configured' }), {
        status: 500,
        headers: corsHeaders,
      });
    }
    const res = await fetch(`${MIMO_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MIMO_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Origin': 'https://tylerzhang.xyz',
        'Referer': 'https://tylerzhang.xyz/',
      },
      body: JSON.stringify({
        model: 'mimo-v2.5',
        messages: [
          { role: 'system', content: '你是一个有趣的内容生成器。严格按要求输出，不要加任何多余的话。' },
          { role: 'user', content: chosen.prompt },
        ],
        max_tokens: 150,
        stream: false,
      }),
    });

    if (!res.ok) {
      // AI 挂了就用预设内容
      return new Response(JSON.stringify({
        ok: true,
        type: chosen.type,
        emoji: chosen.emoji,
        content: '今天的盲盒坏掉了，明天再来试试吧 🎁',
      }), { headers: corsHeaders });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '🎁 盲盒空了…';

    return new Response(JSON.stringify({
      ok: true,
      type: chosen.type,
      emoji: chosen.emoji,
      content,
    }), { headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
