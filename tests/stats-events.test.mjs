import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/stats.js';

test('tool event stores only its action name and does not update page-view totals', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await onRequestPost({
      env: { SUPABASE_ANON_KEY: 'test-key' },
      request: { json: async () => ({
        visitor_id: 'visitor-1', page: 'home', type: 'event', event: 'json_check_success', input: 'PRIVATE_CONTENT',
      }) },
    });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/page_views$/);
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      visitor_id: 'visitor-1', page: 'home::json_check_success', type: 'event',
    });
    assert.ok(!calls[0].options.body.includes('PRIVATE_CONTENT'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('invalid event names are rejected before database access', async () => {
  const response = await onRequestPost({
    env: {},
    request: { json: async () => ({ visitor_id: 'visitor-1', page: 'home', type: 'event', event: 'contains a space' }) },
  });
  assert.equal(response.status, 400);
});
