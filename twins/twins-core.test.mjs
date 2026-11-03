import test from 'node:test';
import assert from 'node:assert/strict';
import { dailyBoard, dayKey, hintFor, isWon, moveBoats, practiceBoard, tutorialBoard, validateRoute } from './twins-core.mjs';

test('tutorial teaches a valid four-command route with a split move', () => {
  const board = tutorialBoard();
  assert.equal(board.reference.length, 4);
  assert.ok(validateRoute(board, board.reference));
  let state = board.start;
  let split = false;
  for (const direction of board.reference) {
    const next = moveBoats(board, state, direction);
    if ((next.a === state.a) !== (next.b === state.b)) split = true;
    state = next;
  }
  assert.ok(split);
  assert.ok(isWon(board, state));
});

test('a year of daily boards is deterministic and solvable', () => {
  for (let index = 0; index < 365; index += 1) {
    const date = new Date(Date.UTC(2026, 0, index + 1, 12));
    const board = dailyBoard(date);
    assert.deepEqual(board, dailyBoard(date));
    assert.ok(validateRoute(board, board.reference), board.key);
    assert.ok(board.reference.length >= 5 && board.reference.length <= 10);
    assert.equal(hintFor(board, board.start), board.reference[0]);
  }
  assert.notEqual(dayKey(new Date('2026-11-02T15:59:59Z')), dayKey(new Date('2026-11-02T16:00:00Z')));
});

test('practice boards stay solvable and progress in shortest solution length', () => {
  const lengths = Array.from({ length: 8 }, (_, index) => {
    const board = practiceBoard(index + 1);
    assert.ok(validateRoute(board, board.reference));
    return board.reference.length;
  });
  assert.deepEqual(lengths, [...lengths].sort((a, b) => a - b));
  assert.throws(() => practiceBoard(9));
});

test('blocked boat stays, but two boats cannot occupy the same tile', () => {
  const board = tutorialBoard();
  const first = moveBoats(board, board.start, board.reference[0]);
  const second = moveBoats(board, first, board.reference[1]);
  assert.ok((second.a === first.a) !== (second.b === first.b));
  assert.equal(moveBoats({ rocks: [], goals: {} }, { a: 3, b: 4 }, 'right'), null);
  assert.equal(moveBoats(board, board.start, 'diagonal'), null);
});
