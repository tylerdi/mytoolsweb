import test from 'node:test';
import assert from 'node:assert/strict';
import { FEATURED_LEVELS, PRACTICE_COUNT, analyzeBoard, dailyBoard, dayKey, decodeCustomBoard, encodeCustomBoard, hintFor, isWon, moveBoats, practiceBoard, tutorialBoard, validateRoute } from './twins-core.mjs';

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
    assert.ok(board.reference.length >= 5 && board.reference.length <= 12);
    assert.equal(hintFor(board, board.start), board.reference[0]);
  }
  assert.notEqual(dayKey(new Date('2026-11-02T15:59:59Z')), dayKey(new Date('2026-11-02T16:00:00Z')));
});

test('published daily puzzles stay stable while later puzzles pass quality gates', () => {
  const legacy = dailyBoard(new Date('2026-11-03T12:00:00+08:00'));
  assert.equal(legacy.layoutIndex, 0);
  assert.deepEqual(legacy.start, { a: 5, b: 3 });
  for (let offset = 0; offset < 365; offset += 1) {
    const board = dailyBoard(new Date(Date.UTC(2026, 10, 6 + offset, 12)));
    const result = analyzeBoard(board);
    assert.ok(result.solved, board.key);
    assert.ok(result.splitMoves >= 2, board.key);
    assert.ok(result.turns >= 2, board.key);
    assert.ok(result.shortestCount <= 8, board.key);
  }
});

test('practice boards stay solvable and progress in shortest solution length', () => {
  const lengths = Array.from({ length: PRACTICE_COUNT }, (_, index) => {
    const board = practiceBoard(index + 1);
    assert.ok(validateRoute(board, board.reference));
    const result = analyzeBoard(board);
    assert.equal(result.shortest, board.reference.length);
    return result.shortest;
  });
  assert.deepEqual(lengths, [...lengths].sort((a, b) => a - b));
  assert.equal(FEATURED_LEVELS.length, 8);
  assert.equal(practiceBoard(15).title, '一解海峡');
  assert.equal(analyzeBoard(practiceBoard(15)).shortestCount, 1);
  assert.throws(() => practiceBoard(PRACTICE_COUNT + 1));
});

test('custom boards validate, solve and survive a share-link round trip', () => {
  const source = practiceBoard(9);
  const encoded = encodeCustomBoard(source);
  const decoded = decodeCustomBoard(encoded);
  assert.deepEqual(decoded.rocks, source.rocks);
  assert.deepEqual(decoded.start, source.start);
  assert.deepEqual(decoded.goals, source.goals);
  assert.equal(decoded.limit, source.limit);
  const result = analyzeBoard(decoded);
  assert.ok(result.solved);
  assert.ok(validateRoute(decoded, result.reference));
  assert.ok(result.shortestCount >= 1);
  assert.ok(result.branchChoices >= 1);
  assert.throws(() => decodeCustomBoard('not-base64!'));
  assert.match(analyzeBoard({ ...source, rocks: [...source.rocks, source.start.a] }).error, /礁石/);
  assert.match(analyzeBoard({ ...source, limit: 4 }).error, /预算/);
});

test('blocked boat stays, but two boats cannot occupy the same tile', () => {
  const board = tutorialBoard();
  const first = moveBoats(board, board.start, board.reference[0]);
  const second = moveBoats(board, first, board.reference[1]);
  assert.ok((second.a === first.a) !== (second.b === first.b));
  assert.equal(moveBoats({ rocks: [], goals: {} }, { a: 3, b: 4 }, 'right'), null);
  assert.equal(moveBoats(board, board.start, 'diagonal'), null);
});
