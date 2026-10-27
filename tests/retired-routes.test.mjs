import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest as rootRoute } from '../functions/[legacy].js';
import { onRequest as toolsRoute } from '../functions/tools/[legacy].js';
import { onRequest as postsRoute } from '../functions/blog/posts/[legacy].js';
import { onRequest as blogRoute } from '../functions/blog/[legacy].js';

const next = () => new Response('kept', { status: 200 });

test('retired top-level pages return 410 and do not route through static assets', async () => {
  for (const name of ['gallery', 'gallery.html', 'daily-news', 'ai-models', 'agent-map', 'ai-chat', 'ai-image', 'ai-service', 'ai-tts', 'ai-voice-to-text']) {
    const response = rootRoute({ params: { legacy: name }, next });
    assert.equal(response.status, 410, name);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex');
  }
  const html = await rootRoute({ params: { legacy: 'gallery' }, next }).text();
  assert.match(html, /<title>内容已下线/);
  assert.match(html, /resource\/easyclaw\.png/);
});

test('active top-level tools page still reaches its static asset', () => {
  assert.equal(rootRoute({ params: { legacy: 'tools' }, next }).status, 200);
});

test('retired experiments and old blog posts return 410', () => {
  assert.equal(toolsRoute({ params: { legacy: 'ai-translation' }, next }).status, 410);
  assert.equal(toolsRoute({ params: { legacy: 'base64' }, next }).status, 200);
  assert.equal(postsRoute({ params: { legacy: 'ai-daily-2026-10-17.html' }, next }).status, 410);
  assert.equal(postsRoute({ params: { legacy: '2026-05-24-AI-Agent.html' }, next }).status, 410);
  assert.equal(blogRoute({ params: { legacy: 'blog-youtube-creators' }, next }).status, 410);
  assert.equal(blogRoute({ params: { legacy: 'api-cost-guide' }, next }).status, 200);
});
