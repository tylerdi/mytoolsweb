export const SIZE = 5;
export const PRACTICE_COUNT = 8;
export const DIRECTIONS = ['up', 'right', 'down', 'left'];

const layouts = [
  { rocks: [0, 1, 11, 19, 24], goals: { a: 10, b: 18 } },
  { rocks: [1, 4, 16, 18, 19], goals: { a: 17, b: 24 } },
  { rocks: [0, 6, 11, 13, 24], goals: { a: 10, b: 15 } },
  { rocks: [3, 6, 13, 18, 22], goals: { a: 19, b: 14 } },
];

function nextCell(index, direction) {
  const row = Math.floor(index / SIZE);
  const column = index % SIZE;
  if (direction === 'up') return row ? index - SIZE : index;
  if (direction === 'down') return row < SIZE - 1 ? index + SIZE : index;
  if (direction === 'left') return column ? index - 1 : index;
  return column < SIZE - 1 ? index + 1 : index;
}

export function moveBoats(board, state, direction) {
  if (!DIRECTIONS.includes(direction)) return null;
  const move = (index) => {
    const target = nextCell(index, direction);
    return board.rocks.includes(target) ? index : target;
  };
  const a = move(state.a);
  const b = move(state.b);
  if (a === state.a && b === state.b) return null;
  if (a === b || (a === state.b && b === state.a)) return null;
  return { a, b };
}

export function isWon(board, state) {
  return state.a === board.goals.a && state.b === board.goals.b;
}

const stateKey = ({ a, b }) => a * SIZE * SIZE + b;
const decode = (key) => ({ a: Math.floor(key / (SIZE * SIZE)), b: key % (SIZE * SIZE) });

function analyzeLayout(layout) {
  const free = Array.from({ length: SIZE * SIZE }, (_, index) => index)
    .filter((index) => !layout.rocks.includes(index));
  const predecessors = new Map();
  for (const a of free) for (const b of free) {
    if (a === b) continue;
    const state = { a, b };
    for (const direction of DIRECTIONS) {
      const next = moveBoats(layout, state, direction);
      if (!next) continue;
      const key = stateKey(next);
      if (!predecessors.has(key)) predecessors.set(key, []);
      predecessors.get(key).push(stateKey(state));
    }
  }

  const distances = new Map([[stateKey(layout.goals), 0]]);
  const queue = [stateKey(layout.goals)];
  for (let index = 0; index < queue.length; index += 1) {
    const key = queue[index];
    for (const previous of predecessors.get(key) || []) {
      if (distances.has(previous)) continue;
      distances.set(previous, distances.get(key) + 1);
      queue.push(previous);
    }
  }
  return distances;
}

const distances = layouts.map(analyzeLayout);

function shortestRoute(layoutIndex, start) {
  const board = layouts[layoutIndex];
  const distance = distances[layoutIndex];
  const route = [];
  let state = start;
  while (!isWon(board, state)) {
    const remaining = distance.get(stateKey(state));
    if (!remaining) return null;
    const direction = DIRECTIONS.find((candidate) => {
      const next = moveBoats(board, state, candidate);
      return next && distance.get(stateKey(next)) === remaining - 1;
    });
    if (!direction) return null;
    route.push(direction);
    state = moveBoats(board, state, direction);
  }
  return route;
}

function candidatesFor(layoutIndex, min, max) {
  const layout = layouts[layoutIndex];
  const results = [];
  for (const [key, distance] of distances[layoutIndex]) {
    if (distance < min || distance > max) continue;
    const start = decode(key);
    if (start.a === layout.goals.a || start.b === layout.goals.b) continue;
    const route = shortestRoute(layoutIndex, start);
    let state = start;
    let splitMoves = 0;
    for (const direction of route) {
      const next = moveBoats(layout, state, direction);
      if ((next.a === state.a) !== (next.b === state.b)) splitMoves += 1;
      state = next;
    }
    if (splitMoves) results.push({ layoutIndex, start, reference: route, splitMoves });
  }
  return results;
}

const puzzles = layouts.flatMap((_, index) => candidatesFor(index, 5, 10));
const tutorials = layouts.flatMap((_, index) => candidatesFor(index, 3, 4));

function hash(text) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

export function dayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function boardFrom(puzzle, key, mode) {
  if (!puzzle) throw new Error('当前没有可用海图。');
  const layout = layouts[puzzle.layoutIndex];
  return {
    size: SIZE, key, mode, layoutIndex: puzzle.layoutIndex,
    rocks: [...layout.rocks], goals: { ...layout.goals }, start: { ...puzzle.start },
    reference: [...puzzle.reference], limit: puzzle.reference.length + (mode === 'tutorial' ? 0 : 2),
  };
}

export function tutorialBoard() {
  const puzzle = tutorials.find((entry) => entry.reference.length === 4 && new Set(entry.reference).size >= 3);
  return boardFrom(puzzle || tutorials[0], 'tutorial', 'tutorial');
}

export function dailyBoard(date = new Date()) {
  const key = dayKey(date);
  return boardFrom(puzzles[hash(`tide-twins:${key}`) % puzzles.length], key, 'daily');
}

export function practiceBoard(level) {
  if (!Number.isInteger(level) || level < 1 || level > PRACTICE_COUNT) throw new Error('练习关不存在。');
  const group = puzzles.filter((puzzle) => puzzle.reference.length === Math.min(9, 4 + level));
  const source = group.length ? group : puzzles;
  return boardFrom(source[hash(`tide-twins:practice:${level}`) % source.length], String(level), 'practice');
}

export function hintFor(board, state) {
  if (isWon(board, state)) return null;
  const distance = distances[board.layoutIndex];
  const remaining = distance.get(stateKey(state));
  if (!remaining) return null;
  return DIRECTIONS.find((direction) => {
    const next = moveBoats(board, state, direction);
    return next && distance.get(stateKey(next)) === remaining - 1;
  }) || null;
}

export function validateRoute(board, directions) {
  let state = { ...board.start };
  for (const direction of directions) {
    const next = moveBoats(board, state, direction);
    if (!next) return false;
    state = next;
  }
  return isWon(board, state) && directions.length <= board.limit;
}
