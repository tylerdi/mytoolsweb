// Cloudflare Pages Function - AI 辩论场
// POST /api/debate  { topic, round? }
// 返回正反双方的论据

export async function onRequestPost(context) {
  const { request, env } = context;
  const MIMO_API_BASE = (env.MIMO_API_BASE || '').replace(/\/chat\/completions\/?$/, '');
  const MIMO_API_KEY = env.MIMO_API_KEY;
  const MIMO_MODEL = env.MIMO_MODEL;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    if (!MIMO_API_KEY) {
      return new Response(JSON.stringify({ error: 'MIMO_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json();
    const { topic, round = 1 } = body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return new Response(JSON.stringify({ error: '请提供辩题' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const trimmedTopic = topic.trim().slice(0, 200);

    // 并行生成正反双方论据
    const [proResponse, conResponse] = await Promise.all([
      generateArgument(MIMO_API_BASE, MIMO_API_KEY, MIMO_MODEL, trimmedTopic, 'pro', round),
      generateArgument(MIMO_API_BASE, MIMO_API_KEY, MIMO_MODEL, trimmedTopic, 'con', round),
    ]);

    return new Response(JSON.stringify({
      topic: trimmedTopic,
      round,
      pro: proResponse,
      con: conResponse,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

async function generateArgument(apiBase, apiKey, model, topic, side, round) {
  const sideLabel = side === 'pro' ? '正方（支持）' : '反方（反对）';
  const sideDesc = side === 'pro'
    ? '你支持这个观点。用有力的论据、数据或类比来论证为什么这是正确的。'
    : '你反对这个观点。用有力的论据、数据或类比来论证为什么这是错误的。';

  const roundContext = round === 1
    ? '这是第一轮立论，请清晰陈述你的核心观点和主要论据。'
    : round === 2
    ? '这是第二轮驳论，请针对对方可能的论点进行预判和反驳，同时强化自己的立场。'
    : '这是第三轮总结，请总结你的核心论点，指出对方的逻辑漏洞，做最后的有力陈述。';

  const systemPrompt = `你是一个专业的辩论选手。辩题是："${topic}"
你的立场：${sideLabel}
${sideDesc}
${roundContext}

要求：
- 回复 150-250 字
- 论点清晰，逻辑严密
- 可以引用数据、案例、类比
- 语言有力但不攻击对方人格
- 不要标注"正方"或"反方"前缀，直接输出论据内容`;

  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: systemPrompt }],
      max_tokens: 600,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    return { content: '（论据生成失败，请重试）', error: true };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '（无内容）';
  return { content };
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
