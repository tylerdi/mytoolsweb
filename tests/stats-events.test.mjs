import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestGet, onRequestPost } from '../functions/api/stats.js';

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

test('game events store only an aggregate event name with no visitor data', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options });
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const response = await onRequestPost({
      env: { SUPABASE_ANON_KEY: 'test-key' },
      request: { json: async () => ({ type: 'game', game: 'route', event: 'daily_complete', visitor_id: 'PRIVATE', path: [1, 2], ua: 'PRIVATE' }) },
    });
    assert.equal(response.status, 200);
    assert.equal(calls.length, 1);
    assert.deepEqual(JSON.parse(calls[0].options.body), {
      visitor_id: 'anonymous-game', page: 'game:route:daily_complete', type: 'game',
    });
  } finally { globalThis.fetch = originalFetch; }
});

test('invalid game events are rejected before storage', async () => {
  for (const body of [
    { type: 'game', game: 'unknown', event: 'open' },
    { type: 'game', game: 'route', event: 'free_text' },
  ]) {
    const response = await onRequestPost({ env: {}, request: { json: async () => body } });
    assert.equal(response.status, 400);
  }
});

test('game report returns daily counts without visitor-level records', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify([
    { page: 'game:route:open', created_at: '2026-11-03T01:00:00Z' },
    { page: 'game:route:daily_complete', created_at: '2026-11-03T01:05:00Z' },
    { page: 'game:twins:open', created_at: '2026-11-03T01:06:00Z' },
  ]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const response = await onRequestGet({ env: { SUPABASE_ANON_KEY: 'test-key' }, request: { url: 'https://tylerzhang.xyz/api/stats?type=game&days=14' } });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.counts['2026-11-03:route'], { open: 1, daily_complete: 1 });
    assert.deepEqual(result.counts['2026-11-03:twins'], { open: 1 });
    assert.ok(!JSON.stringify(result).includes('visitor_id'));
  } finally { globalThis.fetch = originalFetch; }
});
