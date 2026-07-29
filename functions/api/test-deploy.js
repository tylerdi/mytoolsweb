export async function onRequestGet() {
  return new Response(JSON.stringify({
    deployed: true,
    timestamp: new Date().toISOString(),
    version: '3'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
