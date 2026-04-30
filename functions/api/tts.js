// functions/api/tts.js
// TTS API - 调用 edge-tts 生成语音

export async function onRequestPost(context) {
  try {
    const { text, voice, speed } = await context.request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), { status: 400 });
    }

    // 使用 edge-tts 生成音频
    const ttsVoice = voice || 'zh-CN-XiaoxiaoNeural';
    const ttsRate = speed ? `${Math.round((speed - 1) * 100)}%` : '+0%';

    // 调用本地 edge-tts（Cloudflare Pages 环境需要用外部 API）
    // 这里我们使用一个简单的方案：返回音频数据
    const audioData = await generateTTS(text, ttsVoice, ttsRate);

    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function generateTTS(text, voice, rate) {
  // 在 Cloudflare Pages 环境中，我们无法直接调用 edge-tts
  // 方案1: 使用外部 TTS API
  // 方案2: 预生成音频存储在 CDN
  // 方案3: 使用 Web Speech API（客户端）

  // 这里使用一个免费的 TTS API 作为示例
  // 实际部署时可以替换为任何 TTS 服务

  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(text)}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  });

  if (!res.ok) {
    throw new Error(`TTS generation failed: ${res.status}`);
  }

  return await res.arrayBuffer();
}
