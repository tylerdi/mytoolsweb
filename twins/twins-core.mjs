export const SIZE = 5;
export const PRACTICE_COUNT = 16;
export const DIRECTIONS = ['up', 'right', 'down', 'left'];

const layouts = [
  { rocks: [0, 1, 11, 19, 24], goals: { a: 10, b: 18 } },
  { rocks: [1, 4, 16, 18, 19], goals: { a: 17, b: 24 } },
  { rocks: [0, 6, 11, 13, 24], goals: { a: 10, b: 15 } },
  { rocks: [3, 6, 13, 18, 22], goals: { a: 19, b: 14 } },
  { rocks: [6, 7, 10, 11, 14], goals: { a: 1, b: 2 } },
  { rocks: [2, 5, 15, 17, 23], goals: { a: 1, b: 0 } },
  { rocks: [3, 10, 12, 20, 22], goals: { a: 23, b: 19 } },
  { rocks: [0, 4, 12, 19, 22], goals: { a: 15, b: 21 } },
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

function validCell(index) {
  return Number.isInteger(index) && index >= 0 && index < SIZE * SIZE;
}

export function validateCustomBoard(board) {
  if (!board || !Array.isArray(board.rocks) || board.rocks.length > 8 ||
    !board.start || !board.goals || !Number.isInteger(board.limit) || board.limit < 4 || board.limit > 20) {
    return '海图需要两艘船、两个港口、最多八处礁石和 4–20 步预算。';
  }
  const boats = [board.start.a, board.start.b];
  const ports = [board.goals.a, board.goals.b];
  const occupied = [...boats, ...ports, ...board.rocks];
  if (occupied.some((cell) => !validCell(cell)) ||
    boats[0] === boats[1] || ports[0] === ports[1] ||
    new Set(board.rocks).size !== board.rocks.length ||
    board.rocks.some((cell) => boats.includes(cell) || ports.includes(cell))) {
    return '两艘船和两个港口各自不能重叠，礁石不能占据船或港口。';
  }
  return null;
}

export function analyzeBoard(board) {
  const error = validateCustomBoard(board);
  if (error) return { solved: false, error };
  const distance = distanceMap(board);
  const startDistance = distance.get(stateKey(board.start));
  if (!startDistance) return { solved: false, error: '这张海图没有可到达双港的路线。' };

  const ways = new Map([[stateKey(board.goals), 1]]);
  function countShortest(state) {
    const key = stateKey(state);
    if (ways.has(key)) return ways.get(key);
    const remaining = distance.get(key);
    let count = 0;
    for (const direction of DIRECTIONS) {
      const next = moveBoats(board, state, direction);
      if (next && distance.get(stateKey(next)) === remaining - 1) {
        count = Math.min(1000, count + countShortest(next));
      }
    }
    ways.set(key, count);
    return count;
  }

  const reference = [];
  let state = { ...board.start };
  let splitMoves = 0;
  let branchChoices = 0;
  while (!isWon(board, state)) {
    const remaining = distance.get(stateKey(state));
    const viable = DIRECTIONS.filter((direction) => {
      const next = moveBoats(board, state, direction);
      const nextDistance = next && distance.get(stateKey(next));
      return nextDistance !== undefined && reference.length + 1 + nextDistance <= board.limit;
    });
    branchChoices += Math.max(0, viable.length - 1);
    const direction = DIRECTIONS.find((candidate) => {
      const next = moveBoats(board, state, candidate);
      return next && distance.get(stateKey(next)) === remaining - 1;
    });
    if (!direction) return { solved: false, error: '求解器无法重建路线。' };
    const next = moveBoats(board, state, direction);
    if ((next.a === state.a) !== (next.b === state.b)) splitMoves += 1;
    reference.push(direction);
    state = next;
  }
  const turns = reference.slice(1).filter((direction, index) => direction !== reference[index]).length;
  return {
    solved: reference.length <= board.limit, reference, shortest: reference.length,
    shortestCount: countShortest(board.start), branchChoices, splitMoves, turns,
    error: reference.length <= board.limit ? null : '当前步数预算小于最短解。',
  };
}

export function encodeCustomBoard(board) {
  const error = validateCustomBoard(board);
  if (error) throw new Error(error);
  const data = {
    v: 1, r: [...board.rocks].sort((a, b) => a - b),
    a: board.start.a, b: board.start.b, c: board.goals.a, d: board.goals.b, l: board.limit,
  };
  return btoa(JSON.stringify(data)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeCustomBoard(encoded) {
  if (typeof encoded !== 'string' || encoded.length > 256 || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error('分享链接的海图数据无效。');
  }
  let data;
  try {
    data = JSON.parse(atob(encoded.replaceAll('-', '+').replaceAll('_', '/')));
  } catch { throw new Error('分享链接无法解析。'); }
  if (data?.v !== 1) throw new Error('不支持这个海图版本。');
  const board = {
    size: SIZE, mode: 'custom', key: 'custom', rocks: data.r,
    start: { a: data.a, b: data.b }, goals: { a: data.c, b: data.d }, limit: data.l,
  };
  const error = validateCustomBoard(board);
  if (error) throw new Error(error);
  return board;
}

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

const legacyPuzzles = layouts.slice(0, 4).flatMap((_, index) => candidatesFor(index, 5, 10));
const puzzles = layouts.flatMap((_, index) => candidatesFor(index, 5, 12));
const qualityPuzzles = puzzles.filter((puzzle) => {
  const layout = layouts[puzzle.layoutIndex];
  const analysis = analyzeBoard({ ...layout, layoutIndex: puzzle.layoutIndex, start: puzzle.start, limit: puzzle.reference.length + 2 });
  return analysis.solved && analysis.splitMoves >= 2 && analysis.turns >= 2 && analysis.shortestCount <= 8;
});

export const FEATURED_LEVELS = [
  { layoutIndex: 0, start: { a: 14, b: 15 }, title: '靠边分流', lesson: '先让一艘船贴边停下，再调整另一艘的横向位置。' },
  { layoutIndex: 5, start: { a: 7, b: 19 }, title: '借礁转向', lesson: '礁石可以暂时固定一艘船，为另一艘创造转弯空间。' },
  { layoutIndex: 4, start: { a: 9, b: 20 }, title: '错位接力', lesson: '连续利用不同的阻挡点，让两艘船逐步拉开距离。' },
  { layoutIndex: 3, start: { a: 5, b: 0 }, title: '双船换位', lesson: '观察两艘船在同一指令下的不同去向。' },
  { layoutIndex: 5, start: { a: 10, b: 24 }, title: '分船长航', lesson: '长路线中先安排受阻的一艘，再修正另一艘的位置。' },
  { layoutIndex: 7, start: { a: 23, b: 11 }, title: '逆向调整', lesson: '向目标反方向移动，有时是靠岸前必需的一步。' },
  { layoutIndex: 7, start: { a: 24, b: 1 }, title: '一解海峡', lesson: '最短解唯一，注意别在最后几步改变船的相对位置。' },
  { layoutIndex: 4, start: { a: 0, b: 5 }, title: '终点前的回头', lesson: '利用往返调整船距，最后分别进入对应港口。' },
];
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
    title: puzzle.title || null,
  };
}

export function tutorialBoard() {
  const puzzle = tutorials.find((entry) => entry.reference.length === 4 && new Set(entry.reference).size >= 3);
  return boardFrom(puzzle || tutorials[0], 'tutorial', 'tutorial');
}

export function dailyBoard(date = new Date()) {
  const key = dayKey(date);
  if (key < '2026-11-06') return boardFrom(legacyPuzzles[hash(`tide-twins:${key}`) % legacyPuzzles.length], key, 'daily');
  const layoutIndex = Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000) % layouts.length;
  const source = qualityPuzzles.filter((puzzle) => puzzle.layoutIndex === layoutIndex);
  return boardFrom(source[hash(`tide-twins:v2:${key}`) % source.length], key, 'daily');
}

export function practiceBoard(level) {
  if (!Number.isInteger(level) || level < 1 || level > PRACTICE_COUNT) throw new Error('练习关不存在。');
  if (level > 8) {
    const featured = FEATURED_LEVELS[level - 9];
    return boardFrom({ ...featured, reference: shortestRoute(featured.layoutIndex, featured.start) }, String(level), 'practice');
  }
  const target = Math.min(9, 4 + level);
  const group = legacyPuzzles.filter((puzzle) => puzzle.reference.length === target);
  const source = group.length ? group : legacyPuzzles;
  return boardFrom(source[hash(`tide-twins:practice:${level}`) % source.length], String(level), 'practice');
}

export function hintFor(board, state) {
  if (isWon(board, state)) return null;
  const distance = distanceMap(board);
  const remaining = distance.get(stateKey(state));
  if (!remaining) return null;
  return DIRECTIONS.find((direction) => {
    const next = moveBoats(board, state, direction);
    return next && distance.get(stateKey(next)) === remaining - 1;
  }) || null;
}

function distanceMap(board) {
  const preset = layouts[board.layoutIndex];
  return preset && preset.goals.a === board.goals.a && preset.goals.b === board.goals.b &&
    preset.rocks.length === board.rocks.length && preset.rocks.every((cell, index) => cell === board.rocks[index])
    ? distances[board.layoutIndex] : analyzeLayout(board);
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
