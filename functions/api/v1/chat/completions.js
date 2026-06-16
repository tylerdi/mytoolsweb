// functions/api/v1/chat/completions.js
// MIMO API 中转站 — Chat Completions 代理
// POST /api/v1/chat/completions
// 兼容 OpenAI API 格式

import { validateApiKey, logUsage, deductBalance, corsHeaders, corsResponse, errorResponse } from '../metapi-auth.js';

// MIMO 模型白名单（只支持 v2.5 和 v2.5-pro）
const ALLOWED_MODELS = [
  'mimo-v2.5',
  'mimo-v2.5-pro',
];

// 兼容别名：用户传 GPT/Claude 模型名 → 映射到 MIMO
const MODEL_ALIAS = {
  'gpt-4o':            'mimo-v2.5-pro',
  'gpt-4o-mini':       'mimo-v2.5',
  'gpt-4':             'mimo-v2.5-pro',
  'gpt-3.5-turbo':     'mimo-v2.5',
  'claude-3.5-sonnet': 'mimo-v2.5-pro',
  'claude-3-haiku':    'mimo-v2.5',
  // 旧模型兼容
  'mimo-v2.5-free':     'mimo-v2.5',
  'mimo-v2-omni':      'mimo-v2.5',
  'mimo-v2-pro':       'mimo-v2.5-pro',
};

const getUpstreamUrl = (env) => (env.MIMO_API_BASE || '') + '/chat/completions';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // 1. 鉴权
    const auth = await validateApiKey(request, env);
    if (!auth.valid) {
      return errorResponse(auth.error, auth.status);
    }

    // 2. 解析请求体
    let body;
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { model = 'mimo-v2.5', messages, stream = false, max_tokens, temperature, top_p, ...rest } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return errorResponse('messages is required and must be a non-empty array', 400);
    }

    // 3. 模型校验（支持别名）
    const resolvedModel = ALLOWED_MODELS.includes(model)
      ? model
      : (MODEL_ALIAS[model] || 'mimo-v2.5');

    // 4. 构造上游请求
    const upstreamBody = {
      model: resolvedModel,
      messages: messages.slice(-50), // 限制上下文长度
      stream: !!stream,
      ...rest,
    };
    if (max_tokens) upstreamBody.max_tokens = max_tokens;
    if (temperature !== undefined) upstreamBody.temperature = temperature;
    if (top_p !== undefined) upstreamBody.top_p = top_p;

    // 5. 调用上游 MIMO API
    const upstreamRes = await fetch(getUpstreamUrl(env), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      console.error(`[METAPI] Upstream error: ${upstreamRes.status}`, errText.slice(0, 200));
      return errorResponse(`Upstream API error: ${upstreamRes.status}`, upstreamRes.status >= 500 ? 502 : upstreamRes.status);
    }

    // 6. 流式响应
    if (stream) {
      // 流式模式：直接透传，用量通过 chunk 解析计算（简化版：按请求计 1000 token）
      const totalTokens = max_tokens || 1000;
      logUsage({
        userId: auth.userId,
        keyId: auth.keyId,
        model: resolvedModel,
        endpoint: '/v1/chat/completions',
        promptTokens: 0,
        completionTokens: totalTokens,
        totalTokens,
        statusCode: 200,
      }, env).catch(() => {});
      deductBalance(auth.userId, totalTokens, env).catch(() => {});

      return new Response(upstreamRes.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    }

    // 7. 非流式响应
    const data = await upstreamRes.json();

    // 记录用量
    const usage = data.usage || {};
    const totalTokens = usage.total_tokens || (max_tokens || 500);
    logUsage({
      userId: auth.userId,
      keyId: auth.keyId,
      model: resolvedModel,
      endpoint: '/v1/chat/completions',
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens,
      statusCode: 200,
    }, env).catch(() => {});
    deductBalance(auth.userId, totalTokens, env).catch(() => {});

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err) {
    console.error('[METAPI] Error:', err.message);
    return errorResponse(err.message, 500);
  }
}

export async function onRequestOptions() {
  return corsResponse();
}
