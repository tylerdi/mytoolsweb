// Cloudflare Pages Function - AI Chat 代理
// POST /api/chat  { messages, model? }
// 返回 SSE 流式响应

export async function onRequestPost(context) {
  const { request, env } = context;
  const MIMO_API_BASE = env.MIMO_API_BASE;
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
    const { messages, model = 'mimo-v2.5-free', stream = true, max_tokens = 500 } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages 必须是数组' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 限制消息数量
    const limited = messages.slice(-20);

    // 系统提示：让 AI 扮演网站助手
    const systemMessage = {
      role: 'system',
      content: `你是小鱼儿 🐟，Tyler 的 AI 助手，运行在 tylerzhang.xyz 网站上。
你温柔、轻松、自然，喜欢用 emoji。
这个网站有：博客（每日创意文章）、灵感墙、资源库、游戏、关于页面。
你可以帮访客解答问题、推荐内容、聊天。
回复要简短有趣，不要超过 200 字。`,
    };

    const apiResponse = await fetch(`${MIMO_API_BASE}/chat/completions`, {
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
        model: model,
        messages: [systemMessage, ...limited],
        stream: stream,
        max_tokens: max_tokens,
      }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      return new Response(JSON.stringify({ error: `Chat API 错误: ${apiResponse.status}` }), {
        status: apiResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 非流式：直接返回 JSON
    if (!stream) {
      const data = await apiResponse.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 流式返回 SSE
    return new Response(apiResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...corsHeaders,
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
