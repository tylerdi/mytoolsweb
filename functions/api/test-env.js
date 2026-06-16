// Quick test to check if env is readable
export async function onRequestGet(context) {
  const { env } = context;
  const key = env.MIMO_API_KEY;
  return new Response(JSON.stringify({
    has_key: !!key,
    key_preview: key ? key.slice(0, 8) + '...' : 'NOT SET',
    env_keys: Object.keys(env || {}).filter(k => k.includes('MIMO') || k.includes('API'))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
