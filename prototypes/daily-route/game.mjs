import { PRACTICE_COUNT, SIZE, advance, dailyBoard, dayKey, findHint, practiceBoard, streak, tutorialBoard, validateRoute } from './game-core.mjs';
import { createGameTelemetry } from '../../assets/game-analytics.mjs';
import { createVoyage, createSeaMotion } from '../../assets/voyage.mjs';

const asset = {
  start: './assets/dock.svg', end: './assets/lighthouse.svg', beacon: './assets/beacon.svg',
  reef: './assets/reef.svg', boat: './assets/boat.svg',
};
const arrow = { up: '↑', right: '→', down: '↓', left: '←' };
const storageKey = 'daily-route-results:v1';
const tutorialKey = 'daily-route-tutorial:v1';
const track = createGameTelemetry('route');
const boardElement = document.querySelector('[data-board]');
boardElement.tabIndex = -1;
const feedback = document.querySelector('[data-feedback]');
const dialog = document.querySelector('[data-finish-dialog]');
const cells = [];
const motion = createSeaMotion(boardElement, dialog);
const voyage = createVoyage({ game: 'route', count: PRACTICE_COUNT, onSelect: (level) => loadBoard('practice', level), titleFor: (level) => `航线海图 ${level}`, onMapOpen: () => motion.cancelFinish() });

function loadRecords() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch { return {}; }
}

const records = loadRecords();
let mode = 'tutorial';
try { if (localStorage.getItem(tutorialKey) === 'done') mode = 'daily'; } catch { /* Playable without storage. */ }
const requestedUrl = new URL(location.href);
let practiceLevel = 1;
const requestedPractice = Number(requestedUrl.searchParams.get('practice'));
if (Number.isInteger(requestedPractice) && requestedPractice >= 1 && requestedPractice <= PRACTICE_COUNT) {
  mode = 'practice';
  practiceLevel = requestedPractice;
  requestedUrl.searchParams.delete('practice');
}
if (requestedUrl.searchParams.get('tutorial') === '1') {
  mode = 'tutorial';
  requestedUrl.searchParams.delete('tutorial');
}
if (requestedUrl.href !== location.href) history.replaceState(null, '', requestedUrl.pathname + requestedUrl.search + requestedUrl.hash);
let board = mode === 'tutorial' ? tutorialBoard() : mode === 'practice' ? practiceBoard(practiceLevel) : dailyBoard();
let path = [board.start];
let hints = 0;
let elapsed = 0;
let startedAt = null;
let clock = null;
let won = false;
let hintTarget = null;
let pointerDown = false;
let dragMoved = false;
let started = false;

function message(text, tone = 'info') {
  feedback.textContent = text;
  feedback.dataset.tone = tone;
}

function clockText(seconds) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function stopClock() {
  if (clock) clearInterval(clock);
  clock = null;
  startedAt = null;
}

function startClock() {
  if (startedAt !== null || won) return;
  startedAt = Date.now() - elapsed * 1000;
  clock = setInterval(() => {
    elapsed = Math.floor((Date.now() - startedAt) / 1000);
    document.querySelector('[data-time]').textContent = clockText(elapsed);
  }, 1000);
}

function labelFor(index) {
  const row = Math.floor(index / SIZE) + 1;
  const column = index % SIZE + 1;
  const kind = index === board.start ? '码头' : index === board.end ? '灯塔' : board.obstacles.includes(index) ? '礁石' : board.beacons.includes(index) ? '航标' : board.currents[index] ? `洋流向${{ up: '上', right: '右', down: '下', left: '左' }[board.currents[index]]}` : '海面';
  const position = path.indexOf(index);
  return `第 ${row} 行第 ${column} 列，${kind}${position >= 0 ? `，航线第 ${position + 1} 格` : ''}`;
}

function icon(name) {
  const image = document.createElement('img');
  image.src = asset[name];
  image.alt = '';
  image.draggable = false;
  if (name === 'boat') image.className = 'vessel';
  return image;
}

function tutorialInstruction() {
  if (won) return '教学完成，可以开始今日挑战。';
  const next = board.reference[path.length];
  if (path.length === 1) return '先点船右边发光的相邻格，让船前进。';
  if (board.currents[path.at(-1)]) return '船在蓝色洋流格里；下一步只能沿箭头方向走。';
  if (next === board.end) return '三个金色航标已收齐，点灯塔靠岸。';
  if (board.beacons.includes(next)) return '点发光的金色航标，收集它后继续前进。';
  if (board.currents[next]) return '点发光的蓝色箭头格，留意下一步方向。';
  return '继续点发光的相邻格，路线不能重复经过同一格。';
}

function render() {
  const visitedBeacons = board.beacons.filter((beacon) => path.includes(beacon)).length;
  const tutorial = mode === 'tutorial';
  document.querySelector('[data-steps]').textContent = `${path.length - 1} / ${board.limit}`;
  document.querySelector('[data-beacons]').textContent = `${visitedBeacons} / 3`;
  document.querySelector('[data-time]').textContent = clockText(elapsed);
  document.querySelector('[data-streak]').textContent = String(streak(records, dayKey()));
  document.querySelector('[data-mode-label]').textContent = tutorial ? '新手教学' : mode === 'daily' ? '每日挑战' : `闯关 ${practiceLevel}`;
  document.querySelector('[data-board-title]').textContent = tutorial ? '入门海图' : mode === 'daily' ? `${Number(board.key.slice(5, 7))} 月 ${Number(board.key.slice(8, 10))} 日 · 今日海图` : `第 ${practiceLevel} 关 · 航线海图`;
  document.querySelector('[data-board-subtitle]').textContent = tutorial ? '跟着发光的格子前进' : mode === 'daily' ? '今日完成后还能继续闯关' : `航程 ${practiceLevel} / ${PRACTICE_COUNT} · 随时选关`;
  const guide = document.querySelector('[data-tutorial-guide]');
  guide.hidden = !tutorial;
  if (tutorial) {
    document.querySelector('[data-tutorial-step]').textContent = won ? '教学完成' : `教学 · 第 ${path.length} / ${board.reference.length - 1} 步`;
    document.querySelector('[data-tutorial-text]').textContent = tutorialInstruction();
  }
  document.querySelector('[data-practice-controls]').hidden = mode !== 'practice';
  document.querySelector('[data-practice-title]').textContent = `第 ${practiceLevel} / ${PRACTICE_COUNT} 关`;
  document.querySelector('[data-prev]').disabled = practiceLevel <= 1;
  document.querySelector('[data-next]').disabled = practiceLevel >= PRACTICE_COUNT;
  document.querySelector('[data-undo]').disabled = path.length <= 1;
  document.querySelector('[data-hint]').disabled = tutorial || hints >= 3 || won;
  const shareButton = document.querySelector('[data-share]');
  shareButton.title = won && !tutorial ? '分享本局成绩' : '分享游戏链接';
  shareButton.setAttribute('aria-label', shareButton.title);
  document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  boardElement.setAttribute('aria-label', `${SIZE} 乘 ${SIZE} 航线棋盘，${tutorial ? '新手教学，' : ''}${visitedBeacons} 个航标已收集，已走 ${path.length - 1} 步`);

  for (const cell of cells) {
    const index = Number(cell.dataset.index);
    const position = path.indexOf(index);
    const isHead = position === path.length - 1;
    cell.className = 'tile';
    for (const [name, active] of [
      ['reef', board.obstacles.includes(index)], ['beacon', board.beacons.includes(index)],
      ['current', Boolean(board.currents[index])], ['goal', index === board.end],
      ['path', position >= 0], ['head', isHead], ['hint', hintTarget === index],
      ['tutorial-target', tutorial && !won && board.reference[path.length] === index],
    ]) if (active) cell.classList.add(name);
    cell.replaceChildren();
    if (isHead) cell.append(icon('boat'));
    else if (index === board.start) cell.append(icon('start'));
    else if (index === board.end) cell.append(icon('end'));
    else if (board.obstacles.includes(index)) cell.append(icon('reef'));
    else if (board.beacons.includes(index)) cell.append(icon('beacon'));
    else if (board.currents[index]) {
      const flow = document.createElement('span');
      flow.className = 'flow';
      flow.textContent = arrow[board.currents[index]];
      flow.setAttribute('aria-hidden', 'true');
      cell.append(flow);
    }
    if (position >= 0) {
      const step = document.createElement('span');
      step.className = 'step';
      step.textContent = String(position);
      step.setAttribute('aria-hidden', 'true');
      cell.append(step);
    }
    cell.setAttribute('aria-label', `${labelFor(index)}${tutorial && !won && board.reference[path.length] === index ? '，教学下一步' : ''}`);
    cell.setAttribute('aria-pressed', String(position >= 0));
  }
}

function storeWin() {
  if (mode !== 'daily') return;
  const current = { path, steps: path.length - 1, hints, elapsed };
  const prior = records[board.key];
  if (!prior || current.steps < prior.steps || current.steps === prior.steps && current.hints < prior.hints) records[board.key] = current;
  try { localStorage.setItem(storageKey, JSON.stringify(records)); } catch { /* Private browsing may disable storage. */ }
}

function finish() {
  won = true;
  stopClock();
  storeWin();
  if (mode === 'practice') voyage.win(practiceLevel, { steps: path.length - 1, hints });
  track(`${mode}_complete`);
  if (mode === 'tutorial') {
    try { localStorage.setItem(tutorialKey, 'done'); } catch { /* Playable without storage. */ }
  }
  document.querySelector('[data-finish-title]').textContent = mode === 'tutorial' ? '已学会航行' : '顺利靠岸';
  document.querySelector('[data-finish-score]').textContent = `${path.length - 1} / ${board.limit} 步`;
  document.querySelector('[data-finish-description]').textContent = mode === 'tutorial' ? '已经掌握航行规则，开启你的闯关航程吧。' : mode === 'daily' ? `${board.key} 每日挑战完成，还可以继续闯关。` : `第 ${practiceLevel} 关完成${practiceLevel < PRACTICE_COUNT ? '，下一片海等你探索。' : '，这段航程抵达终点！'}`;
  document.querySelector('[data-finish-detail]').textContent = `航标 3 / 3 · 提示 ${hints} / 3 · 用时 ${clockText(elapsed)}`;
  document.querySelector('[data-dialog-share]').textContent = mode === 'tutorial' ? '分享游戏' : '分享成绩';
  const replay = document.querySelector('[data-replay]');
  replay.hidden = mode === 'tutorial';
  if (mode !== 'tutorial') replay.href = mode === 'daily' ? `/replay/?game=route&date=${board.key}` : `/replay/?game=route&level=${practiceLevel}`;
  document.querySelector('[data-dialog-practice]').textContent = mode === 'practice' ? practiceLevel < PRACTICE_COUNT ? `下一关 · 第 ${practiceLevel + 1} 关 →` : '查看关卡地图' : `继续闯关 · 第 ${voyage.next()} 关 →`;
  message(mode === 'tutorial' ? '教学完成，现在可以独立规划今日航线。' : '航线完成，所有航标都已收齐。');
  render();
  motion.finish();
}

function move(target) {
  if (won) return;
  if (target === path.at(-1)) return;
  if (mode === 'tutorial' && target !== path.at(-2) && target !== board.reference[path.length]) {
    message(board.currents[path.at(-1)] ? '船在洋流格，必须沿蓝色箭头方向离开。' : board.obstacles.includes(target) ? '灰色礁石不能走，先点发光的格子。' : '先点发光的相邻格；也可以点上一格撤回。', 'warn');
    motion.invalid();
    return;
  }
  const result = advance(board, path, target);
  if (result.status === 'invalid') { message(result.message, 'warn'); motion.invalid(); return; }
  if (result.status === 'backtrack') {
    const previous = path.at(-1);
    path = result.path;
    won = false;
    hintTarget = null;
    message(mode === 'tutorial' ? tutorialInstruction() : '已撤回一步。');
    render();
    motion.sail(previous, path.at(-1));
    return;
  }
  if (result.status === 'solved' && won) return;
  const previous = path.at(-1);
  path = result.path;
  hintTarget = null;
  if (!started) { track(`${mode}_start`); started = true; }
  if (result.status === 'solved') { finish(); motion.sail(previous, target, '.vessel', true); return; }
  startClock();
  message(mode === 'tutorial' ? tutorialInstruction() : board.beacons.includes(target) ? '收集到航标，继续向灯塔前进。' : '航线已延伸。');
  render();
  motion.sail(previous, target, '.vessel', board.beacons.includes(target));
}

function loadBoard(nextMode = mode, level = practiceLevel) {
  motion.cancelFinish();
  stopClock();
  if (dialog.open) dialog.close();
  mode = nextMode;
  practiceLevel = level;
  board = mode === 'tutorial' ? tutorialBoard() : mode === 'daily' ? dailyBoard() : practiceBoard(practiceLevel);
  path = [board.start];
  hints = 0;
  elapsed = 0;
  won = false;
  hintTarget = null;
  started = false;
  if (mode === 'daily') {
    const saved = records[board.key];
    if (saved && Array.isArray(saved.path) && validateRoute(board, saved.path).status === 'solved') {
      path = saved.path;
      hints = saved.hints;
      elapsed = saved.elapsed;
      won = true;
      message('今日航线已完成。点击上方“开始闯关”，还有 12 张海图可玩。');
    } else message('从左侧码头出发，点击相邻格开始画线。');
  } else message(mode === 'tutorial' ? tutorialInstruction() : `第 ${practiceLevel} 关已载入。通关后可直接前往下一关。`);
  voyage.update(mode === 'practice' ? practiceLevel : null);
  render();
  motion.enter();
  if (arguments.length) boardElement.focus({ preventScroll: true });
}

function reset() {
  motion.cancelFinish();
  stopClock();
  if (dialog.open) dialog.close();
  path = [board.start];
  hints = 0;
  elapsed = 0;
  won = false;
  hintTarget = null;
  started = false;
  message(mode === 'tutorial' ? tutorialInstruction() : '本局已重置。每日历史成绩仍保存在本机。');
  render();
}

function undo() {
  if (path.length <= 1) return;
  motion.cancelFinish();
  if (dialog.open) dialog.close();
  const previous = path.at(-1);
  const result = advance(board, path, path[path.length - 2]);
  path = result.path;
  won = false;
  hintTarget = null;
  message(mode === 'tutorial' ? tutorialInstruction() : '已撤回一步。');
  render();
  motion.sail(previous, path.at(-1));
}

function hint() {
  if (mode === 'tutorial' || hints >= 3 || won) return;
  const next = findHint(board, path);
  if (next === null) { message('当前路线已无法在预算内完成，先撤回几步。', 'warn'); return; }
  hints += 1;
  hintTarget = next;
  message('下一步可行位置已在棋盘上标记。');
  render();
}

async function share() {
  const url = `https://tylerzhang.xyz/${mode === 'practice' ? `?practice=${practiceLevel}` : ''}`;
  const title = '每日航线';
  const text = won && mode !== 'tutorial'
    ? `${mode === 'daily' ? board.key : `练习 ${practiceLevel}`} · ${path.length - 1}/${board.limit} 步 · ${hints} 次提示`
    : '每天一张新海图，也可以连续闯关。来规划你的航线。';
  try {
    if (navigator.share) await navigator.share({ title, text, url });
    else await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    track('share');
    message(navigator.share ? '分享已完成。' : '链接已复制，可以发给朋友。');
    if (dialog.open) document.querySelector('[data-finish-detail]').textContent = '分享不包含地图答案。';
  } catch (error) {
    if (error?.name !== 'AbortError') message('分享失败，请检查浏览器的分享或剪贴板权限。', 'warn');
  }
}

for (let index = 0; index < SIZE * SIZE; index += 1) {
  const cell = document.createElement('button');
  cell.type = 'button';
  cell.className = 'tile';
  cell.dataset.index = String(index);
  cell.addEventListener('click', () => {
    if (dragMoved) { dragMoved = false; return; }
    move(index);
  });
  cells.push(cell);
  boardElement.append(cell);
}

boardElement.addEventListener('pointerdown', () => { pointerDown = true; dragMoved = false; });
document.addEventListener('pointermove', (event) => {
  if (!pointerDown) return;
  const cell = document.elementFromPoint(event.clientX, event.clientY)?.closest('.tile');
  if (!cell || !boardElement.contains(cell)) return;
  const target = Number(cell.dataset.index);
  if (target !== path.at(-1)) { dragMoved = true; move(target); }
});
document.addEventListener('pointerup', () => {
  pointerDown = false;
  setTimeout(() => { dragMoved = false; }, 0);
});
document.addEventListener('pointercancel', () => { pointerDown = false; dragMoved = false; });

document.addEventListener('keydown', (event) => {
  if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('button') && !boardElement.contains(event.target)) return;
  const offsets = { ArrowUp: -SIZE, ArrowRight: 1, ArrowDown: SIZE, ArrowLeft: -1 };
  if (!(event.key in offsets)) return;
  event.preventDefault();
  const current = path.at(-1);
  const candidate = current + offsets[event.key];
  if (candidate >= 0 && candidate < SIZE * SIZE) move(candidate);
});

document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => {
  if (mode === 'tutorial' && button.dataset.mode !== 'tutorial') {
    try { localStorage.setItem(tutorialKey, 'done'); } catch { /* Playable without storage. */ }
  }
  loadBoard(button.dataset.mode, button.dataset.mode === 'practice' ? voyage.next() : practiceLevel);
}));
document.querySelector('[data-prev]').addEventListener('click', () => loadBoard('practice', practiceLevel - 1));
document.querySelector('[data-next]').addEventListener('click', () => loadBoard('practice', practiceLevel + 1));
document.querySelector('[data-undo]').addEventListener('click', undo);
document.querySelector('[data-reset]').addEventListener('click', reset);
document.querySelector('[data-hint]').addEventListener('click', hint);
document.querySelector('[data-share]').addEventListener('click', share);
document.querySelector('[data-dialog-share]').addEventListener('click', share);
document.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
document.querySelector('[data-dialog-practice]').addEventListener('click', () => {
  if (mode === 'practice' && practiceLevel === PRACTICE_COUNT) { dialog.close(); voyage.showMap(); }
  else loadBoard('practice', mode === 'practice' ? practiceLevel + 1 : voyage.next());
});
setInterval(() => { if (mode === 'daily' && board.key !== dayKey()) loadBoard('daily'); }, 60000);
loadBoard();
