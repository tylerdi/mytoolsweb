export async function onRequestGet(context) {
  const { env } = context;
  return new Response(JSON.stringify({
    MIMO_API_BASE: env.MIMO_API_BASE || '(empty)',
    MIMO_API_KEY: env.MIMO_API_KEY ? '(set)' : '(empty)',
    MIMO_MODEL: env.MIMO_MODEL || '(empty)',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
