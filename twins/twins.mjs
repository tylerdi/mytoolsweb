import { DIRECTIONS, PRACTICE_COUNT, SIZE, dailyBoard, dayKey, hintFor, isWon, moveBoats, practiceBoard, tutorialBoard, validateRoute } from './twins-core.mjs';
import { createGameTelemetry, shareURL } from '../assets/game-analytics.mjs';
import { createVoyage, createSeaMotion } from '../assets/voyage.mjs';

const track = createGameTelemetry('twins');
const recordsKey = 'tide-twins-results:v1';
const tutorialKey = 'tide-twins-tutorial:v1';
const boardElement = document.querySelector('[data-board]');
boardElement.tabIndex = -1;
const feedback = document.querySelector('[data-feedback]');
const dialog = document.querySelector('[data-finish-dialog]');
const cells = [];
const motion = createSeaMotion(boardElement, dialog);
const voyage = createVoyage({ game: 'twins', count: PRACTICE_COUNT, onSelect: (level) => loadBoard('practice', level), titleFor: (level) => practiceBoard(level).title || `双船海图 ${level}`, onMapOpen: () => motion.cancelFinish() });
const arrow = { up: '↑', right: '→', down: '↓', left: '←' };
const directionName = { up: '上', right: '右', down: '下', left: '左' };

function loadRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(recordsKey));
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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
let states = [{ ...board.start }];
let directions = [];
let hints = 0;
let hintDirection = null;
let elapsed = 0;
let startedAt = null;
let clock = null;
let started = false;
let won = false;

const currentState = () => states.at(-1);

function message(text, tone = 'info') {
  feedback.textContent = text;
  feedback.dataset.tone = tone;
}

function timeText(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
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
    document.querySelector('[data-time]').textContent = timeText(elapsed);
  }, 1000);
}

function streak() {
  let key = dayKey();
  if (!records[key]) key = new Date(Date.parse(`${key}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  let total = 0;
  while (records[key]) {
    total += 1;
    key = new Date(Date.parse(`${key}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
  }
  return total;
}

function tutorialInstruction() {
  if (won) return '两艘船都已靠岸，可以开始今日挑战。';
  const next = board.reference[directions.length];
  const instructions = [
    `点发光的 ${arrow[next]}，两艘船会同时向${directionName[next]}移动。`,
    '现在点向下：被礁石挡住的船会停下，另一艘继续走。',
    '点向左，调整两艘船之间的位置。',
    '最后点向下，让两艘船同时回到各自港口。',
  ];
  return instructions[directions.length] || `点发光的 ${arrow[next]} 继续前进。`;
}

function image(name) {
  const element = document.createElement('img');
  element.src = `./assets/${name}.svg`;
  element.alt = '';
  element.draggable = false;
  if (name.startsWith('boat-')) element.className = `vessel ${name}`;
  return element;
}

function render() {
  const state = currentState();
  const docked = Number(state.a === board.goals.a) + Number(state.b === board.goals.b);
  const tutorial = mode === 'tutorial';
  document.querySelector('[data-board-title]').textContent = tutorial ? '入门海图' : mode === 'daily' ? `${Number(board.key.slice(5, 7))} 月 ${Number(board.key.slice(8, 10))} 日 · 今日海图` : `第 ${practiceLevel} 关 · ${board.title || '双船海图'}`;
  document.querySelector('[data-board-subtitle]').textContent = tutorial ? '跟着航向指令前进' : mode === 'daily' ? `上海时间每日更新 · ${board.reference.length <= 7 ? '入门' : board.reference.length <= 10 ? '标准' : '进阶'}` : `${practiceLevel} / ${PRACTICE_COUNT} · 最短 ${board.reference.length} 步`;
  document.querySelector('[data-mode-label]').textContent = tutorial ? '新手教学' : mode === 'daily' ? '每日挑战' : `闯关 ${practiceLevel}`;
  document.querySelector('[data-steps]').textContent = `${directions.length} / ${board.limit}`;
  document.querySelector('[data-docked]').textContent = `${docked} / 2`;
  document.querySelector('[data-time]').textContent = timeText(elapsed);
  document.querySelector('[data-streak]').textContent = String(streak());
  document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  document.querySelector('[data-practice-controls]').hidden = mode !== 'practice';
  document.querySelector('[data-practice-title]').textContent = `第 ${practiceLevel} / ${PRACTICE_COUNT} 关`;
  document.querySelector('[data-prev]').disabled = practiceLevel <= 1;
  document.querySelector('[data-next]').disabled = practiceLevel >= PRACTICE_COUNT;
  document.querySelector('[data-undo]').disabled = directions.length === 0;
  document.querySelector('[data-hint]').disabled = tutorial || won || hints >= 3;
  document.querySelector('[data-share]').title = won && !tutorial ? '分享本局成绩' : '分享游戏链接';
  document.querySelector('[data-share]').setAttribute('aria-label', document.querySelector('[data-share]').title);
  const guide = document.querySelector('[data-tutorial-guide]');
  guide.hidden = !tutorial;
  if (tutorial) {
    document.querySelector('[data-tutorial-step]').textContent = won ? '教学完成' : `教学 · 第 ${directions.length + 1} / ${board.reference.length} 步`;
    document.querySelector('[data-tutorial-text]').textContent = tutorialInstruction();
  }
  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.disabled = won || directions.length >= board.limit;
    button.classList.toggle('tutorial-target', tutorial && !won && button.dataset.direction === board.reference[directions.length]);
    button.classList.toggle('hint', !tutorial && button.dataset.direction === hintDirection);
  });
  boardElement.setAttribute('aria-label', `${SIZE} 乘 ${SIZE} 双船海图，已走 ${directions.length} 步，${docked} 艘船已靠岸`);

  for (const cell of cells) {
    const index = Number(cell.dataset.index);
    const parts = [];
    cell.className = 'tile';
    cell.replaceChildren();
    if (board.rocks.includes(index)) {
      cell.classList.add('rock');
      cell.append(image('reef'));
      parts.push('礁石');
    }
    if (index === board.goals.a) { cell.classList.add('dock-a'); parts.push('珊瑚港'); }
    if (index === board.goals.b) { cell.classList.add('dock-b'); parts.push('金色港'); }
    if (index === state.a) { cell.append(image('boat-coral')); parts.push('珊瑚船'); }
    if (index === state.b) { cell.append(image('boat-gold')); parts.push('金色船'); }
    cell.classList.toggle('docked', index === state.a && state.a === board.goals.a || index === state.b && state.b === board.goals.b);
    cell.setAttribute('aria-label', `第 ${Math.floor(index / SIZE) + 1} 行第 ${index % SIZE + 1} 列，${parts.join('，') || '海面'}`);
  }
}

function saveWin() {
  if (mode !== 'daily') return;
  const current = { directions, steps: directions.length, hints, elapsed };
  const previous = records[board.key];
  if (!previous || current.steps < previous.steps || current.steps === previous.steps && current.hints < previous.hints) records[board.key] = current;
  try { localStorage.setItem(recordsKey, JSON.stringify(records)); } catch { /* Private browsing may disable storage. */ }
}

function finish() {
  won = true;
  stopClock();
  saveWin();
  if (mode === 'practice') voyage.win(practiceLevel, { steps: directions.length, hints });
  track(`${mode}_complete`);
  if (mode === 'tutorial') {
    try { localStorage.setItem(tutorialKey, 'done'); } catch { /* Playable without storage. */ }
  }
  document.querySelector('[data-finish-title]').textContent = mode === 'tutorial' ? '已学会双船航行' : '双船顺利靠岸';
  document.querySelector('[data-finish-description]').textContent = mode === 'tutorial' ? '已经掌握双船协同，开启你的闯关航程吧。' : mode === 'daily' ? `${board.key} 每日挑战完成，还可以继续闯关。` : `第 ${practiceLevel} 关完成${practiceLevel < PRACTICE_COUNT ? '，下一片海等你探索。' : '，这段航程抵达终点！'}`;
  document.querySelector('[data-finish-score]').textContent = `${directions.length} / ${board.limit} 步`;
  document.querySelector('[data-finish-detail]').textContent = `提示 ${hints} / 3 · 用时 ${timeText(elapsed)}`;
  document.querySelector('[data-dialog-share]').textContent = mode === 'tutorial' ? '分享游戏' : '分享成绩';
  const replay = document.querySelector('[data-replay]');
  replay.hidden = mode === 'tutorial';
  if (mode !== 'tutorial') replay.href = mode === 'daily' ? `/replay/?game=twins&date=${board.key}` : `/replay/?game=twins&level=${practiceLevel}`;
  document.querySelector('[data-dialog-next]').textContent = mode === 'practice' ? practiceLevel < PRACTICE_COUNT ? `下一关 · 第 ${practiceLevel + 1} 关 →` : '查看关卡地图' : `继续闯关 · 第 ${voyage.next()} 关 →`;
  message('两艘船都已靠岸。');
  render();
  motion.finish();
}

function animateBoats(before, after) {
  motion.sail(before.a, after.a, '.boat-coral', after.a === board.goals.a);
  motion.sail(before.b, after.b, '.boat-gold', after.b === board.goals.b);
}

function move(direction) {
  if (won || directions.length >= board.limit) return;
  if (mode === 'tutorial' && direction !== board.reference[directions.length]) {
    message(`先点发光的 ${arrow[board.reference[directions.length]]}，跟着教学前进。`, 'warn');
    motion.invalid();
    return;
  }
  const before = currentState();
  const next = moveBoats(board, before, direction);
  if (!next) { message('这一步无法移动：两艘船不能重叠，也不能穿过礁石。', 'warn'); motion.invalid(); return; }
  states.push(next);
  directions.push(direction);
  hintDirection = null;
  track('move');
  if (!started) { track(`${mode}_start`); started = true; }
  if (isWon(board, next)) { finish(); animateBoats(before, next); return; }
  startClock();
  if (directions.length >= board.limit) message('步数已用完，可以撤回或重置再试。', 'warn');
  else if (mode === 'tutorial') message(tutorialInstruction());
  else if ((before.a === next.a) !== (before.b === next.b)) message('一艘船被挡住，另一艘仍在前进。');
  else message('两艘船一起向前移动。');
  render();
  animateBoats(before, next);
}

function loadBoard(nextMode = mode, level = practiceLevel) {
  motion.cancelFinish();
  stopClock();
  if (dialog.open) dialog.close();
  mode = nextMode;
  practiceLevel = level;
  board = mode === 'tutorial' ? tutorialBoard() : mode === 'daily' ? dailyBoard() : practiceBoard(level);
  states = [{ ...board.start }];
  directions = [];
  hints = 0;
  hintDirection = null;
  elapsed = 0;
  started = false;
  won = false;
  if (mode === 'daily') {
    const saved = records[board.key];
    if (saved && Array.isArray(saved.directions) && validateRoute(board, saved.directions)) {
      for (const direction of saved.directions) states.push(moveBoats(board, currentState(), direction));
      directions = [...saved.directions];
      hints = saved.hints || 0;
      elapsed = saved.elapsed || 0;
      won = true;
      message('今日双船已靠岸。点击上方“开始闯关”，还有 16 张海图可玩。');
    } else message('点下方方向箭头，同时指挥两艘船前进。');
  } else message(mode === 'tutorial' ? tutorialInstruction() : `第 ${practiceLevel} 关已载入。通关后可直接前往下一关。`);
  voyage.update(mode === 'practice' ? practiceLevel : null);
  render();
  motion.enter();
  if (arguments.length) boardElement.focus({ preventScroll: true });
}

function reset() {
  motion.cancelFinish();
  motion.clear();
  stopClock();
  if (dialog.open) dialog.close();
  states = [{ ...board.start }];
  directions = [];
  hints = 0;
  hintDirection = null;
  elapsed = 0;
  started = false;
  won = false;
  message(mode === 'tutorial' ? tutorialInstruction() : '本局已重置；每日历史成绩仍在本机。');
  render();
}

function undo() {
  if (!directions.length) return;
  motion.cancelFinish();
  if (dialog.open) dialog.close();
  const previous = currentState();
  directions.pop();
  states.pop();
  won = false;
  hintDirection = null;
  message(mode === 'tutorial' ? tutorialInstruction() : '已撤回一步。');
  render();
  animateBoats(previous, currentState());
}

function hint() {
  if (mode === 'tutorial' || won || hints >= 3) return;
  hintDirection = hintFor(board, currentState());
  if (!hintDirection) { message('当前局面无法靠岸，先撤回几步。', 'warn'); return; }
  hints += 1;
  message('下一步方向已标记在箭头按钮上。');
  render();
}

async function share() {
  const url = shareURL(`https://tylerzhang.xyz/twins/${mode === 'practice' ? `?practice=${practiceLevel}` : ''}`);
  const title = '潮汐双船';
  const text = won && mode !== 'tutorial'
    ? `${mode === 'daily' ? board.key : `练习 ${practiceLevel}`} · ${directions.length}/${board.limit} 步 · ${hints} 次提示`
    : '一条指令同时移动两艘船，每日海图与连续闯关都能玩。';
  try {
    if (navigator.share) await navigator.share({ title, text, url });
    else await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    track('share');
    message(navigator.share ? '分享已完成。' : '链接已复制，可以发给朋友。');
  } catch (error) {
    if (error?.name !== 'AbortError') message('分享失败，请检查浏览器的分享或剪贴板权限。', 'warn');
  }
}

for (let index = 0; index < SIZE * SIZE; index += 1) {
  const cell = document.createElement('div');
  cell.className = 'tile';
  cell.dataset.index = String(index);
  cell.setAttribute('role', 'gridcell');
  cells.push(cell);
  boardElement.append(cell);
}

document.querySelectorAll('[data-direction]').forEach((button) => button.addEventListener('click', () => move(button.dataset.direction)));
document.addEventListener('keydown', (event) => {
  if (document.querySelector('dialog[open]') || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('button') && !event.target.closest('.direction-controls')) return;
  const selected = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' }[event.key];
  if (!selected) return;
  event.preventDefault();
  move(selected);
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
document.querySelector('[data-dialog-next]').addEventListener('click', () => {
  if (mode === 'practice' && practiceLevel === PRACTICE_COUNT) { dialog.close(); voyage.showMap(); }
  else loadBoard('practice', mode === 'practice' ? practiceLevel + 1 : voyage.next());
});
setInterval(() => { if (mode === 'daily' && board.key !== dayKey()) loadBoard('daily'); }, 60000);
loadBoard();
