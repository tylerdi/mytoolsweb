import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, PRACTICE_COUNT, advance, analyzeRouteBoard, dailyBoard, dayKey, findHint, makeBoard, practiceBoard, streak, tutorialBoard, validateRoute } from './game-core.mjs';

test('daily generation is deterministic and every day in a year has a legal solution', () => {
  for (let offset = 0; offset < 365; offset += 1) {
    const date = new Date(Date.UTC(2026, 0, 1 + offset, 10));
    const board = dailyBoard(date);
    assert.deepEqual(board, dailyBoard(date));
    assert.equal(board.size, SIZE);
    assert.equal(board.beacons.length, 3);
    assert.equal(new Set(board.reference).size, board.reference.length);
    assert.equal(board.obstacles.some((cell) => board.reference.includes(cell)), false);
    assert.equal(validateRoute(board, board.reference).status, 'solved', board.key);
  }
});

test('daily key changes at midnight in Shanghai, not at UTC midnight', () => {
  assert.equal(dayKey(new Date('2026-10-29T15:59:59Z')), '2026-10-29');
  assert.equal(dayKey(new Date('2026-10-29T16:00:00Z')), '2026-10-30');
});

test('practice levels are stable and bounded', () => {
  for (let level = 1; level <= PRACTICE_COUNT; level += 1) assert.equal(validateRoute(practiceBoard(level), practiceBoard(level).reference).status, 'solved');
  assert.throws(() => practiceBoard(0), /不存在/);
  assert.throws(() => practiceBoard(PRACTICE_COUNT + 1), /不存在/);
  assert.deepEqual(makeBoard(42), makeBoard(42));
});

test('campaign difficulty increases in route length, precision and budget pressure', () => {
  let previousLength = 0;
  let previousCount = Infinity;
  let previousSlack = Infinity;
  const stats = [];
  for (let level = 1; level <= PRACTICE_COUNT; level += 1) {
    const board = practiceBoard(level);
    const result = analyzeRouteBoard(board);
    assert.equal(result.truncated, false, `level ${level} must be completely evaluated`);
    assert.equal(board.reference.length - 1, result.shortest, `level ${level} reference must be shortest`);
    assert.equal(validateRoute(board, result.reference).status, 'solved');
    assert.deepEqual(board.analysis, { shortest: result.shortest, solutionCount: result.solutionCount, misleadingBranches: result.misleadingBranches });
    assert.ok(result.shortest >= previousLength, `level ${level} route must not get shorter`);
    assert.ok(result.solutionCount < previousCount, `level ${level} must require greater route precision`);
    assert.ok(board.limit - result.shortest <= previousSlack, `level ${level} must not add detour allowance`);
    assert.equal(board.difficulty, level <= 4 ? '简单' : level <= 8 ? '标准' : '困难');
    if (level >= 9) {
      assert.equal(board.limit, result.shortest);
      assert.ok(result.misleadingBranches >= 9, 'hard maps need continuable wrong turns, not just long corridors');
    }
    previousLength = result.shortest;
    previousCount = result.solutionCount;
    previousSlack = board.limit - result.shortest;
    stats.push(result);
  }
  assert.equal(stats[0].shortest, 6);
  assert.equal(stats.at(-1).shortest, 28);
  assert.equal(stats.at(-1).solutionCount, 1);
});

test('route solver counts alternatives and refuses exact claims on an incomplete search', () => {
  const board = { size: 7, start: 0, end: 8, beacons: [], obstacles: Array.from({ length: 49 }, (_, i) => i).filter(i => ![0, 1, 7, 8].includes(i)), currents: {}, limit: 4 };
  const open = analyzeRouteBoard(board);
  assert.equal(open.shortest, 2);
  assert.equal(open.shortestCount, 2);
  assert.equal(open.solutionCount, 2);
  const withBeacon = analyzeRouteBoard({ ...board, beacons: [1] });
  assert.equal(withBeacon.solutionCount, 1);
  assert.deepEqual(withBeacon.reference, [0, 1, 8]);
  assert.equal(analyzeRouteBoard({ ...board, limit: 1 }).solutionCount, 0);
  const truncated = analyzeRouteBoard(board, { maxNodes: 1 });
  assert.equal(truncated.truncated, true);
  assert.equal(truncated.solutionCount, null);
  assert.equal(truncated.shortest, null);
  assert.equal(truncated.misleadingBranches, null);
});

test('hints can recover an allowed early detour and mutable boards do not change saved layouts', () => {
  const board = practiceBoard(1);
  let path = [21, 14];
  for (let i = 0; i < board.limit && path.at(-1) !== board.end; i += 1) {
    const next = findHint(board, path);
    assert.notEqual(next, null);
    const result = advance(board, path, next);
    assert.notEqual(result.status, 'invalid');
    path = result.path;
  }
  assert.equal(validateRoute(board, path).status, 'solved');
  board.obstacles.push(board.start);
  board.reference.length = 0;
  assert.equal(validateRoute(practiceBoard(1), practiceBoard(1).reference).status, 'solved');
});

test('the short tutorial demonstrates each rule with a valid eight-step route', () => {
  const board = tutorialBoard();
  assert.equal(board.reference.length - 1, 8);
  assert.equal(board.limit, 8);
  assert.equal(board.beacons.length, 3);
  assert.equal(Object.keys(board.currents).length, 1);
  assert.equal(validateRoute(board, board.reference).status, 'solved');
  assert.equal(findHint(board, [board.start]), board.reference[1]);
});

test('movement rejects invalid cells and supports backtracking', () => {
  const board = { start: 0, end: 2, beacons: [1], obstacles: [7], currents: { 1: 'right' }, limit: 4 };
  assert.match(advance(board, [0], 2).message, /相邻/);
  assert.match(advance(board, [0], 7).message, /礁石/);
  assert.equal(advance(board, [0], 1).status, 'moved');
  assert.match(advance(board, [0, 1], 8).message, /洋流/);
  assert.deepEqual(advance(board, [0, 1], 0).path, [0]);
  assert.equal(advance(board, [0, 1], 2).status, 'solved');
  assert.match(advance({ ...board, beacons: [8] }, [0, 1], 2).message, /航标/);
  assert.match(advance({ ...board, limit: 1 }, [0, 1], 2).message, /预算/);
  assert.equal(validateRoute(board, [7, 1, 2]).status, 'invalid');
});

test('hint follows a valid generated route and streak counts consecutive days', () => {
  const board = practiceBoard(1);
  assert.equal(findHint(board, [board.start]), board.reference[1]);
  assert.equal(streak({ '2026-10-28': true, '2026-10-29': true }, '2026-10-30'), 2);
  assert.equal(streak({ '2026-10-28': true, '2026-10-30': true }, '2026-10-30'), 1);
});
