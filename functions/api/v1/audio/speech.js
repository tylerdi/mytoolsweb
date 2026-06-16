// functions/api/v1/audio/speech.js
// MIMO API 中转站 — TTS 语音合成代理
// POST /api/v1/audio/speech
// 兼容 OpenAI TTS API 格式

import { validateApiKey, logUsage, deductBalance, corsHeaders, corsResponse, errorResponse } from '../metapi-auth.js';

const UPSTREAM_URL = 'https://opencode.ai/zen/v1/audio/speech';

// MIMO TTS 模型
const TTS_MODELS = ['mimo-v2-tts', 'mimo-v2.5-tts', 'mimo-v2.5-tts-voicedesign', 'mimo-v2.5-tts-voiceclone'];

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

    const { model = 'mimo-v2-tts', input, voice, speed, response_format = 'mp3' } = body;

    if (!input || typeof input !== 'string') {
      return errorResponse('input is required', 400);
    }

    if (input.length > 5000) {
      return errorResponse('input exceeds maximum length of 5000 characters', 400);
    }

    // 3. 模型校验
    const resolvedModel = TTS_MODELS.includes(model) ? model : 'mimo-v2-tts';

    // 4. 构造上游请求（MIMO TTS 不传 voice 字段）
    const upstreamBody = {
      model: resolvedModel,
      input: input,
    };
    if (speed) upstreamBody.speed = speed;

    // 5. 调用上游
    const upstreamRes = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upstreamBody),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      console.error(`[METAPI TTS] Upstream error: ${upstreamRes.status}`, errText.slice(0, 200));
      return errorResponse(`TTS API error: ${upstreamRes.status}`, upstreamRes.status >= 500 ? 502 : upstreamRes.status);
    }

    // 6. 记录用量（按字符数计费）
    const charCount = input.length;
    logUsage({
      userId: auth.userId,
      keyId: auth.keyId,
      model: resolvedModel,
      endpoint: '/v1/audio/speech',
      promptTokens: charCount,
      completionTokens: 0,
      totalTokens: charCount,
      statusCode: 200,
    }, env).catch(() => {});
    deductBalance(auth.userId, Math.ceil(charCount / 10), env).catch(() => {}); // 每10字符扣1 token

    // 7. 返回音频流
    const contentType = response_format === 'wav' ? 'audio/wav' : 'audio/mpeg';

    return new Response(upstreamRes.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        ...corsHeaders,
      },
    });

  } catch (err) {
    console.error('[METAPI TTS] Error:', err.message);
    return errorResponse(err.message, 500);
  }
}

export async function onRequestOptions() {
  return corsResponse();
}
