export const SIZE = 7;
export const PRACTICE_COUNT = 12;

const indexOf = (x, y) => y * SIZE + x;
const pointOf = (index) => ({ x: index % SIZE, y: Math.floor(index / SIZE) });

function random(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text) {
  let value = 2166136261;
  for (const character of text) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function direction(from, to) {
  const a = pointOf(from);
  const b = pointOf(to);
  if (b.x === a.x + 1 && b.y === a.y) return 'right';
  if (b.x === a.x - 1 && b.y === a.y) return 'left';
  if (b.y === a.y + 1 && b.x === a.x) return 'down';
  if (b.y === a.y - 1 && b.x === a.x) return 'up';
  return null;
}

export function neighbors(index) {
  const { x, y } = pointOf(index);
  return [
    y > 0 ? indexOf(x, y - 1) : null,
    x < SIZE - 1 ? indexOf(x + 1, y) : null,
    y < SIZE - 1 ? indexOf(x, y + 1) : null,
    x > 0 ? indexOf(x - 1, y) : null,
  ].filter((value) => value !== null);
}

function addLine(path, x, y) {
  let current = pointOf(path[path.length - 1]);
  while (current.x !== x || current.y !== y) {
    current = {
      x: current.x + Math.sign(x - current.x),
      y: current.y + Math.sign(y - current.y),
    };
    path.push(indexOf(current.x, current.y));
  }
}

function shuffled(values, rng) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const other = Math.floor(rng() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export function makeBoard(seed) {
  const rng = random(seed);
  const firstX = 1 + Math.floor(rng() * 3);
  const secondX = firstX + 1 + Math.floor(rng() * (5 - firstX));
  const topFirst = rng() < .5;
  const firstY = topFirst ? Math.floor(rng() * 3) : 4 + Math.floor(rng() * 3);
  const secondY = topFirst ? 4 + Math.floor(rng() * 3) : Math.floor(rng() * 3);
  const reference = [indexOf(0, 3)];
  for (const [x, y] of [[firstX, 3], [firstX, firstY], [secondX, firstY], [secondX, secondY], [6, secondY], [6, 3]]) addLine(reference, x, y);

  const turnPositions = [];
  for (let position = 1; position < reference.length - 1; position += 1) {
    if (direction(reference[position - 1], reference[position]) !== direction(reference[position], reference[position + 1])) turnPositions.push(position);
  }
  const selectedTurns = shuffled(turnPositions, rng).slice(0, 2);
  const currents = {};
  for (const position of selectedTurns) currents[reference[position]] = direction(reference[position], reference[position + 1]);

  const availableBeaconPositions = reference.map((_, position) => position).filter((position) => position > 1 && position < reference.length - 2 && !selectedTurns.includes(position));
  const beacons = [];
  for (const fraction of [.25, .5, .75]) {
    const target = Math.round(fraction * (reference.length - 1));
    const position = availableBeaconPositions.reduce((best, candidate) => Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best);
    beacons.push(reference[position]);
    availableBeaconPositions.splice(availableBeaconPositions.indexOf(position), 1);
  }

  const route = new Set(reference);
  const open = Array.from({ length: SIZE * SIZE }, (_, index) => index).filter((index) => !route.has(index));
  const obstacles = shuffled(open, rng).slice(0, 11);
  return {
    size: SIZE, seed, start: reference[0], end: reference[reference.length - 1],
    beacons, obstacles, currents, limit: reference.length, reference,
  };
}

export function dayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function dailyBoard(date = new Date()) {
  const key = dayKey(date);
  return { ...makeBoard(hash(`daily-route:${key}`)), key, mode: 'daily' };
}

export function practiceBoard(level) {
  if (!Number.isInteger(level) || level < 1 || level > PRACTICE_COUNT) throw new Error('练习关卡不存在。');
  return { ...makeBoard(hash(`practice-route:${level}`)), key: String(level), mode: 'practice' };
}

export function tutorialBoard() {
  return {
    size: SIZE, key: 'tutorial', mode: 'tutorial', start: 21, end: 27,
    beacons: [23, 17, 20], obstacles: [15, 24, 25, 29, 32, 33, 43],
    currents: { 19: 'right' }, limit: 8,
    reference: [21, 22, 23, 16, 17, 18, 19, 20, 27],
  };
}

export function advance(board, path, target) {
  const current = path[path.length - 1];
  if (target === path[path.length - 2]) return { path: path.slice(0, -1), status: 'backtrack' };
  if (path.at(-1) === board.end) return { path, status: 'solved' };
  if (!direction(current, target)) return { path, status: 'invalid', message: '只能走上下左右相邻格。' };
  if (board.obstacles.includes(target)) return { path, status: 'invalid', message: '礁石不可通行。' };
  if (path.includes(target)) return { path, status: 'invalid', message: '航线不能重复经过同一格。' };
  if (board.currents[current] && board.currents[current] !== direction(current, target)) return { path, status: 'invalid', message: '必须沿洋流箭头的方向离开。' };
  if (path.length >= board.limit + 1) return { path, status: 'invalid', message: '已超过本局步数预算。' };
  const next = [...path, target];
  if (target === board.end && !board.beacons.every((beacon) => next.includes(beacon))) return { path, status: 'invalid', message: '先收齐所有航标，再进入灯塔。' };
  return { path: next, status: target === board.end ? 'solved' : 'moved' };
}

export function validateRoute(board, route) {
  if (!Array.isArray(route) || route[0] !== board.start) return { path: [board.start], status: 'invalid' };
  let path = [board.start];
  for (const target of route.slice(1)) {
    const result = advance(board, path, target);
    if (result.status === 'invalid') return result;
    path = result.path;
  }
  return { path, status: path.at(-1) === board.end ? 'solved' : 'incomplete' };
}

export function findHint(board, path) {
  if (path.at(-1) === board.end) return null;
  if (path.every((index, position) => board.reference[position] === index)) return board.reference[path.length];
  const seen = new Set(path);
  let attempts = 0;
  function search(route) {
    if (++attempts > 30000) return null;
    const current = route.at(-1);
    if (current === board.end) return board.beacons.every((beacon) => route.includes(beacon)) ? route : null;
    if (route.length > board.limit) return null;
    const target = board.beacons.find((beacon) => !seen.has(beacon)) ?? board.end;
    const goal = pointOf(target);
    const choices = neighbors(current).sort((a, b) => {
      const one = pointOf(a);
      const two = pointOf(b);
      return Math.abs(one.x - goal.x) + Math.abs(one.y - goal.y) - Math.abs(two.x - goal.x) - Math.abs(two.y - goal.y);
    });
    for (const candidate of choices) {
      if (seen.has(candidate)) continue;
      const next = advance(board, route, candidate);
      if (next.status === 'invalid') continue;
      seen.add(candidate);
      const result = search(next.path);
      seen.delete(candidate);
      if (result) return result;
    }
    return null;
  }
  const result = search(path);
  return result?.[path.length] ?? null;
}

export function streak(records, today) {
  let current = today;
  if (!records[current]) current = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  let days = 0;
  while (records[current]) {
    days += 1;
    current = new Date(Date.parse(`${current}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  }
  return days;
}
