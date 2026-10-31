import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('public home is the playable, indexable game and has no CSV navigation', () => {
  const html = read('index.html');
  assert.match(html, /<h1>每日航线<\/h1>/);
  assert.match(html, /data-board/);
  assert.match(html, /data-mode="daily"/);
  assert.match(html, /google-adsense-account/);
  assert.doesNotMatch(html, /<meta name="robots" content="noindex/);
  assert.doesNotMatch(html, /CSV 体检|处理指南/);
  assert.doesNotMatch(html, /\.\/assets\/(dock|beacon|reef|boat|lighthouse)\.svg/);
});

test('sitemap lists only maintained game pages', () => {
  const sitemap = read('sitemap.xml');
  for (const path of ['/', '/about', '/privacy', '/contact']) {
    assert.ok(sitemap.includes(`https://tylerzhang.xyz${path}</loc>`));
  }
  assert.doesNotMatch(sitemap, /\/blog\/|csv-/);
});
