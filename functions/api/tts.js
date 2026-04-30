// Cloudflare Pages Function - MIMO TTS 代理
// POST /api/tts  { text, voice?, speed? }
// 返回 mp3 音频

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
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

    // 限制文本长度（避免滥用）
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
      return new Response(JSON.stringify({ error: `TTS API 错误: ${ttsResponse.status}` }), {
        status: ttsResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // 流式返回音频
    return new Response(ttsResponse.body, {
      headers: {
        'Content-Type': 'audio/wav',
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
