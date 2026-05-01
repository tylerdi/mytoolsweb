// functions/api/tts.js
// TTS API - 代理小米 MIMO TTS

export async function onRequestPost(context) {
  try {
    const { text, voice, speed } = await context.request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 限制文本长度（MIMO TTS 有长度限制）
    const truncated = text.slice(0, 2000);

    // 调用小米 MIMO TTS API
    const ttsVoice = voice || 'zh-CN-XiaoxiaoNeural';
    const ttsSpeed = speed || 1.0;

    const audioData = await generateMimoTTS(truncated, ttsVoice, ttsSpeed);

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

async function generateMimoTTS(text, voice, speed) {
  // 小米 MIMO TTS API
  const apiUrl = 'https://fufu.iqach.top/v1/audio/speech';

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mimo-v2-tts',
      input: text,
      voice: voice,
      speed: speed,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`MIMO TTS failed: ${res.status} ${errText.slice(0, 100)}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('audio') && !contentType.includes('octet-stream')) {
    // 可能返回了错误 JSON
    const errText = await res.text().catch(() => '');
    throw new Error(`MIMO TTS returned non-audio: ${contentType} ${errText.slice(0, 100)}`);
  }

  return await res.arrayBuffer();
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
