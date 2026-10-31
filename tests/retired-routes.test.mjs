import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest as rootRoute } from '../functions/[legacy].js';
import { onRequest as toolsRoute } from '../functions/tools/[legacy].js';
import { onRequest as postsRoute } from '../functions/blog/posts/[legacy].js';
import { onRequest as blogRoute } from '../functions/blog/[legacy].js';
import { onRequest as blogIndex } from '../functions/blog/index.js';

const next = () => new Response('kept', { status: 200 });

test('retired top-level pages return 410 and do not route through static assets', async () => {
  for (const name of ['gallery', 'gallery.html', 'daily-news', 'ai-models', 'agent-map', 'ai-chat', 'ai-image', 'ai-service', 'ai-tts', 'ai-voice-to-text']) {
    const response = rootRoute({ params: { legacy: name }, next });
    assert.equal(response.status, 410, name);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  }
  for (const name of ['json-output', 'json-diff', 'log-redactor', 'ai-cost', 'schema-check', 'tools']) {
    assert.equal(rootRoute({ params: { legacy: name }, next }).status, 410, name);
  }
  const html = await rootRoute({ params: { legacy: 'gallery' }, next }).text();
  assert.match(html, /<title>内容已下线/);
  assert.match(html, /favicon\.svg/);
});

test('unrelated top-level pages still reach their static asset', () => {
  assert.equal(rootRoute({ params: { legacy: 'about' }, next }).status, 200);
});

test('retired experiments and old blog posts return 410', () => {
  assert.equal(toolsRoute({ params: { legacy: 'ai-translation' }, next }).status, 410);
  assert.equal(toolsRoute({ params: { legacy: 'base64' }, next }).status, 200);
  assert.equal(postsRoute({ params: { legacy: 'ai-daily-2026-10-17.html' }, next }).status, 410);
  assert.equal(postsRoute({ params: { legacy: '2026-05-24-AI-Agent.html' }, next }).status, 410);
  assert.equal(blogRoute({ params: { legacy: 'blog-youtube-creators' }, next }).status, 410);
  assert.equal(blogRoute({ params: { legacy: 'api-cost-guide' }, next }).status, 410);
  assert.equal(blogRoute({ params: { legacy: 'csv-encoding' }, next }).status, 410);
  assert.equal(blogRoute({ params: { legacy: 'csv-duplicates.html' }, next }).status, 410);
  assert.equal(blogIndex().status, 410);
});
