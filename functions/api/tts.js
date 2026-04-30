// Cloudflare Pages Function - MIMO TTS 代理
// POST /api/tts  { text, voice?, speed? }
// 返回 wav 音频

export async function onRequestPost(context) {
  const { request } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { text, voice = 'nova', speed = 1.0 } = body;

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: '文字不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const trimmed = text.slice(0, 2000);

    // 调用 MIMO TTS API
    const ttsResponse = await fetch('https://fufu.iqach.top/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-123456',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-tts',
        input: trimmed,
        voice: voice,
        speed: speed,
      }),
    });

    if (!ttsResponse.ok) {
      const errText = await ttsResponse.text();
      return new Response(JSON.stringify({ error: `TTS API 错误: ${ttsResponse.status}`, detail: errText }), {
        status: ttsResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 先读取完整响应到 ArrayBuffer，再返回（比流式更稳定）
    const audioBuffer = await ttsResponse.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=86400',
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
