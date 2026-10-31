import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, PRACTICE_COUNT, advance, dailyBoard, dayKey, findHint, makeBoard, practiceBoard, streak, tutorialBoard, validateRoute } from './game-core.mjs';

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
