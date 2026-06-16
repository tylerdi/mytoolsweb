// Cloudflare Pages Function - AI 有声故事电台
// POST /api/story  { prompt, continue_from? }
// 返回故事文本段落

export async function onRequestPost(context) {
  const { request, env } = context;
  const MIMO_API_BASE = env.MIMO_API_BASE || 'https://fufu.iqach.top/v1';
  const MIMO_API_KEY = env.MIMO_API_KEY;

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
    const { prompt, paragraph = 1 } = body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return new Response(JSON.stringify({ error: '请提供故事开头' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const trimmed = prompt.trim().slice(0, 500);

    const systemPrompt = `你是一个富有想象力的故事大师。用户给了一个故事开头，请你续写这个故事。

故事开头："${trimmed}"

这是第 ${paragraph} 段（共 5 段）。

要求：
- 每段 80-150 字
- 语言生动，有画面感
- 适合朗读（节奏感好，句式优美）
- 如果是第 1 段，承接开头展开
- 如果是第 5 段，给出一个温暖或有趣的结尾
- 不要标注"第X段"前缀，直接输出故事内容
- 输出纯文本，不要 markdown`;

    const response = await fetch(`${MIMO_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MIMO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-flash',
        messages: [{ role: 'user', content: systemPrompt }],
        max_tokens: 400,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: '故事生成失败' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 为每段生成一个图片 prompt
    const imagePrompt = await generateImagePrompt(MIMO_API_BASE, MIMO_API_KEY, trimmed, content, paragraph);

    return new Response(JSON.stringify({
      text: content,
      imagePrompt,
      paragraph,
      total: 5,
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

async function generateImagePrompt(apiBase, apiKey, storyStart, currentText, paragraph) {
  try {
    const prompt = `根据以下故事片段，生成一个简短的英文图片描述（用于 AI 绘图），要求：
- 20 个词以内
- 描述画面场景
- 风格：童话插画风，柔和色彩
- 不要包含人物对话

故事开头：${storyStart}
当前段落：${currentText.slice(0, 200)}`;

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
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
