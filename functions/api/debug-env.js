// Debug endpoint - check env vars
export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    has_key: !!env.MIMO_API_KEY,
    key_len: env.MIMO_API_KEY ? env.MIMO_API_KEY.length : 0,
    key_start: env.MIMO_API_KEY ? env.MIMO_API_KEY.slice(0, 8) : 'NONE',
    has_base: !!env.MIMO_API_BASE,
    base: env.MIMO_API_BASE || 'NOT SET',
    all_env_keys: Object.keys(env || {}).sort()
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' }
  });
}
