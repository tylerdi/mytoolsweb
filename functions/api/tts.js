// functions/api/tts.js
// TTS API - 代理小米 MIMO TTS（流式分段用）

export async function onRequestPost(context) {
  const { env } = context;
  const MIMO_API_BASE = env.MIMO_API_BASE || 'https://opencode.ai/zen/v1';
  const MIMO_API_KEY = env.MIMO_API_KEY;

  try {
    if (!MIMO_API_KEY) {
      return new Response(JSON.stringify({ error: 'MIMO_API_KEY not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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
    const audioData = await generateMimoTTS(MIMO_API_BASE, MIMO_API_KEY, truncated, speed || 1.0);

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

async function generateMimoTTS(baseUrl, apiKey, text, speed) {
  const res = await fetch(`${baseUrl}/audio/speech`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Origin': 'https://tylerzhang.xyz',
      'Referer': 'https://tylerzhang.xyz/'
    },
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
