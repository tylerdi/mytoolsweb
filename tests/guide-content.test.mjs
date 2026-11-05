import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { practiceBoard as routePractice } from '../prototypes/daily-route/game-core.mjs';
import { analyzeBoard, practiceBoard as twinPractice } from '../twins/twins-core.mjs';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const names = { up: '上', right: '右', down: '下', left: '左' };

function routeDirections(board) {
  return board.reference.slice(1).map((cell, index) => {
    const difference = cell - board.reference[index];
    return names[difference === 1 ? 'right' : difference === -1 ? 'left' : difference === 7 ? 'down' : 'up'];
  });
}

test('each published move sequence matches its actual playable practice board', () => {
  for (const [file, game, level] of [
    ['route-currents', 'route', 2], ['route-beacons', 'route', 8],
    ['twins-boundary', 'twins', 9], ['twins-one-solution', 'twins', 15],
  ]) {
    const html = read(`guides/${file}.html`);
    const sequence = html.match(/<p class="move-sequence">([^<]+)<\/p>/)?.[1].split(' → ');
    const board = game === 'route' ? routePractice(level) : twinPractice(level);
    const expected = game === 'route' ? routeDirections(board) : board.reference.map((direction) => names[direction]);
    assert.deepEqual(sequence, expected, file);
    assert.match(html, new RegExp(`practice=${level}`));
    assert.match(html, new RegExp(`game=${game}&level=${level}`));
    assert.match(html, new RegExp(`assets/${game}-${level}\\.svg`));
    assert.ok(read(`guides/assets/${game}-${level}.svg`).startsWith('<svg'));
  }
  assert.equal(analyzeBoard(twinPractice(15)).shortestCount, 1);
});

test('editor, guide index and replay are linked with appropriate indexing', () => {
  const editor = read('twins/create/index.html');
  const index = read('guides/index.html');
  const replay = read('replay/index.html');
  const sitemap = read('sitemap.xml');
  assert.match(editor, /data-editor-board/);
  assert.match(index, /route-currents|twins-one-solution/);
  assert.match(replay, /noindex,nofollow/);
  for (const path of ['/twins/create/', '/guides/', '/guides/route-currents', '/guides/route-beacons', '/guides/twins-boundary', '/guides/twins-one-solution']) {
    assert.ok(sitemap.includes(`https://tylerzhang.xyz${path}</loc>`));
  }
  assert.doesNotMatch(sitemap, /\/replay\//);
});
