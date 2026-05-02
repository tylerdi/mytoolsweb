// functions/api/tts.js
// TTS API - 代理小米 MIMO TTS（流式分段用）

export async function onRequestPost(context) {
  try {
    const { text, speed } = await context.request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 限制文本长度
    const truncated = text.slice(0, 500);

    // 调用小米 MIMO TTS API（不传 voice，用默认）
    const audioData = await generateMimoTTS(truncated, speed || 1.0);

    return new Response(audioData, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[TTS] Error:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function generateMimoTTS(text, speed) {
  const res = await fetch('https://fufu.iqach.top/v1/audio/speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'mimo-v2-tts',
      input: text,
      voice: '',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`MIMO TTS failed: ${res.status} ${errText.slice(0, 100)}`);
  }

  return await res.arrayBuffer();
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
