import { DIRECTIONS, SIZE, analyzeBoard, decodeCustomBoard, encodeCustomBoard, hintFor, isWon, moveBoats, practiceBoard, validateCustomBoard } from '../twins-core.mjs';

const draftKey = 'tide-twins-editor:v1';
const boardElement = document.querySelector('[data-editor-board]');
const feedback = document.querySelector('[data-feedback]');
const cells = [];
const arrow = { up: '↑', right: '→', down: '↓', left: '←' };
const initial = practiceBoard(9);

function cleanBoard(source) {
  return {
    size: SIZE, mode: 'custom', key: 'custom',
    rocks: [...source.rocks], start: { ...source.start }, goals: { ...source.goals }, limit: source.limit,
  };
}

let board = cleanBoard(initial);
let view = 'edit';
let selectedTool = 'rock';
let editHistory = [];
let playStates = [{ ...board.start }];
let playDirections = [];
let hintDirection = null;
let loadingMessage = '';

const shared = new URL(location.href).searchParams.get('p');
if (shared) {
  try {
    board = cleanBoard(decodeCustomBoard(shared));
    view = 'play';
    playStates = [{ ...board.start }];
    loadingMessage = '分享海图已载入。';
  } catch (error) { loadingMessage = error.message; }
} else {
  try {
    const draft = JSON.parse(localStorage.getItem(draftKey));
    if (!validateCustomBoard(draft)) board = cleanBoard(draft);
    playStates = [{ ...board.start }];
  } catch { /* Use the starter board. */ }
}

function message(text, tone = 'info') {
  feedback.textContent = text;
  feedback.dataset.tone = tone;
}

function saveDraft() {
  try { localStorage.setItem(draftKey, JSON.stringify(cleanBoard(board))); } catch { /* Editor still works without storage. */ }
}

function image(name) {
  const element = document.createElement('img');
  element.src = `../assets/${name}.svg`;
  element.alt = '';
  element.draggable = false;
  return element;
}

function renderBoard() {
  const state = view === 'play' ? playStates.at(-1) : board.start;
  boardElement.dataset.view = view;
  boardElement.setAttribute('aria-label', `${SIZE} 乘 ${SIZE} 双船海图，${view === 'edit' ? '可编辑' : '试玩中'}`);
  for (const cell of cells) {
    const index = Number(cell.dataset.index);
    const labels = [];
    cell.className = 'tile';
    cell.replaceChildren();
    cell.tabIndex = view === 'edit' ? 0 : -1;
    if (board.rocks.includes(index)) {
      cell.classList.add('rock');
      cell.append(image('reef'));
      labels.push('礁石');
    }
    if (index === board.goals.a) { cell.classList.add('dock-a'); labels.push('珊瑚港'); }
    if (index === board.goals.b) { cell.classList.add('dock-b'); labels.push('金色港'); }
    if (index === state.a) { cell.append(image('boat-coral')); labels.push('珊瑚船'); }
    if (index === state.b) { cell.append(image('boat-gold')); labels.push('金色船'); }
    cell.setAttribute('aria-label', `第 ${Math.floor(index / SIZE) + 1} 行第 ${index % SIZE + 1} 列，${labels.join('，') || '海面'}`);
  }
}

function render() {
  const result = analyzeBoard(board);
  const good = result.solved && result.shortest >= 3 && result.splitMoves >= 1;
  document.querySelectorAll('button[data-view]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.view === view));
    if (button.dataset.view === 'play') button.disabled = !result.solved;
  });
  document.querySelector('[data-design-tools]').hidden = view !== 'edit';
  document.querySelector('[data-play-tools]').hidden = view !== 'play';
  document.querySelectorAll('[data-tool]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.tool === selectedTool)));
  document.querySelector('[data-limit]').value = String(board.limit);
  document.querySelector('[data-edit-undo]').disabled = !editHistory.length;
  document.querySelector('[data-play-undo]').disabled = !playDirections.length;
  document.querySelector('[data-play-hint]').disabled = view !== 'play' || isWon(board, playStates.at(-1));
  document.querySelector('[data-play-steps]').textContent = `${playDirections.length} / ${board.limit} 步`;
  document.querySelector('[data-board-caption]').textContent = view === 'play' ? '分享关卡 · 试玩' : '五乘五海图';
  document.querySelector('[data-shortest]').textContent = result.shortest === undefined ? '—' : `${result.shortest} 步`;
  document.querySelector('[data-solutions]').textContent = result.shortestCount === undefined ? '—' : result.shortestCount >= 1000 ? '1000+' : String(result.shortestCount);
  document.querySelector('[data-branches]').textContent = result.branchChoices === undefined ? '—' : String(result.branchChoices);
  document.querySelector('[data-splits]').textContent = result.splitMoves === undefined ? '—' : String(result.splitMoves);
  const status = document.querySelector('[data-analysis-status]');
  status.textContent = result.error || (good ? `可分享 · 最短 ${result.shortest} 步` : '可解，但至少需要三步和一次分船动作才能分享。');
  status.dataset.tone = good ? 'info' : 'warn';
  document.querySelector('[data-share]').disabled = !good;
  const solution = document.querySelector('[data-solution]');
  solution.hidden = !result.solved;
  if (result.solved) solution.href = `/replay/?game=twins&p=${encodeCustomBoard(board)}`;
  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.disabled = view !== 'play' || isWon(board, playStates.at(-1)) || playDirections.length >= board.limit;
    button.classList.toggle('hint', view === 'play' && button.dataset.direction === hintDirection);
  });
  renderBoard();
}

function edit(index) {
  if (view !== 'edit') return;
  const before = cleanBoard(board);
  const occupiedByBoat = index === board.start.a || index === board.start.b;
  const occupiedByDock = index === board.goals.a || index === board.goals.b;
  if (selectedTool === 'rock') {
    if (occupiedByBoat || occupiedByDock) { message('礁石不能放在船或港口上。', 'warn'); return; }
    if (board.rocks.includes(index)) board.rocks = board.rocks.filter((cell) => cell !== index);
    else if (board.rocks.length < 8) board.rocks.push(index);
    else { message('一张海图最多放八处礁石。', 'warn'); return; }
    board.rocks.sort((a, b) => a - b);
  } else if (selectedTool === 'erase') {
    if (!board.rocks.includes(index)) { message('这格没有礁石；船和港口可用对应工具移动。'); return; }
    board.rocks = board.rocks.filter((cell) => cell !== index);
  } else {
    if (board.rocks.includes(index)) { message('先擦除礁石，才能放置船或港口。', 'warn'); return; }
    const target = selectedTool.startsWith('boat') ? board.start : board.goals;
    const other = selectedTool.endsWith('a') ? 'b' : 'a';
    const side = selectedTool.endsWith('a') ? 'a' : 'b';
    if (target[other] === index) { message('两艘船或两个港口不能重叠。', 'warn'); return; }
    if (target[side] === index) return;
    target[side] = index;
  }
  editHistory.push(before);
  if (editHistory.length > 30) editHistory.shift();
  playStates = [{ ...board.start }];
  playDirections = [];
  hintDirection = null;
  history.replaceState(null, '', location.pathname);
  if (!validateCustomBoard(board)) saveDraft();
  message('海图已更新。');
  render();
}

function setView(next) {
  if (next === 'play' && !analyzeBoard(board).solved) { message('先调整海图或步数预算，让它有解。', 'warn'); return; }
  view = next;
  if (next === 'play') {
    playStates = [{ ...board.start }];
    playDirections = [];
    hintDirection = null;
    message('选择一个方向，同时移动两艘船。');
  } else message('选择工具，再点海图上的格子。');
  render();
}

function playMove(direction) {
  if (view !== 'play' || !DIRECTIONS.includes(direction) || playDirections.length >= board.limit || isWon(board, playStates.at(-1))) return;
  const next = moveBoats(board, playStates.at(-1), direction);
  if (!next) { message('这一步两艘船都无法合法移动。', 'warn'); return; }
  playStates.push(next);
  playDirections.push(direction);
  hintDirection = null;
  if (isWon(board, next)) message(`双船靠岸 · ${playDirections.length} / ${board.limit} 步。`);
  else if (playDirections.length === board.limit) message('步数用尽，撤回或重玩再试。', 'warn');
  else message(`向${{ up: '上', right: '右', down: '下', left: '左' }[direction]}前进。`);
  render();
}

async function share() {
  const result = analyzeBoard(board);
  if (!result.solved || result.shortest < 3 || result.splitMoves < 1) return;
  const url = new URL('/twins/create/', 'https://tylerzhang.xyz');
  url.searchParams.set('p', encodeCustomBoard(board));
  try {
    if (navigator.share) await navigator.share({ title: '潮汐双船 · 自制海图', url: url.href });
    else await navigator.clipboard.writeText(url.href);
    message(navigator.share ? '分享已完成。' : '关卡链接已复制。');
  } catch (error) {
    if (error?.name !== 'AbortError') message('分享失败，请检查浏览器权限。', 'warn');
  }
}

for (let index = 0; index < SIZE * SIZE; index += 1) {
  const cell = document.createElement('div');
  cell.className = 'tile';
  cell.dataset.index = String(index);
  cell.setAttribute('role', 'gridcell');
  cell.addEventListener('click', () => edit(index));
  cell.addEventListener('keydown', (event) => {
    if (view === 'edit' && ['Enter', ' '].includes(event.key)) { event.preventDefault(); edit(index); }
  });
  cells.push(cell);
  boardElement.append(cell);
}

document.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => {
  selectedTool = button.dataset.tool;
  message(`已选择${button.textContent.trim()}。`);
  render();
}));
document.querySelectorAll('button[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
document.querySelector('[data-limit]').addEventListener('change', (event) => {
  const next = Number(event.target.value);
  if (!Number.isInteger(next) || next < 4 || next > 20) { message('步数预算应为 4–20。', 'warn'); render(); return; }
  if (next === board.limit) return;
  editHistory.push(cleanBoard(board));
  board.limit = next;
  history.replaceState(null, '', location.pathname);
  saveDraft();
  message('步数预算已更新。');
  render();
});
document.querySelector('[data-edit-undo]').addEventListener('click', () => {
  if (!editHistory.length) return;
  board = editHistory.pop();
  playStates = [{ ...board.start }];
  playDirections = [];
  saveDraft();
  message('已撤回上一次编辑。');
  render();
});
document.querySelector('[data-example]').addEventListener('click', () => {
  editHistory.push(cleanBoard(board));
  board = cleanBoard(initial);
  playStates = [{ ...board.start }];
  playDirections = [];
  history.replaceState(null, '', location.pathname);
  saveDraft();
  message('示例海图已恢复。');
  render();
});
document.querySelectorAll('[data-direction]').forEach((button) => button.addEventListener('click', () => playMove(button.dataset.direction)));
document.querySelector('[data-play-undo]').addEventListener('click', () => {
  if (!playDirections.length) return;
  playDirections.pop();
  playStates.pop();
  hintDirection = null;
  message('已撤回一步。');
  render();
});
document.querySelector('[data-play-reset]').addEventListener('click', () => setView('play'));
document.querySelector('[data-play-hint]').addEventListener('click', () => {
  const remaining = board.limit - playDirections.length;
  const analysis = analyzeBoard({ ...board, start: playStates.at(-1), limit: 20 });
  hintDirection = analysis.solved && analysis.shortest <= remaining ? hintFor(board, playStates.at(-1)) : null;
  message(hintDirection ? `下一步可尝试 ${arrow[hintDirection]}。` : '当前路线已无法在预算内靠岸，先撤回。', hintDirection ? 'info' : 'warn');
  render();
});
document.querySelector('[data-share]').addEventListener('click', share);
document.addEventListener('keydown', (event) => {
  if (view !== 'play' || event.target instanceof HTMLInputElement || event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.target instanceof HTMLElement && event.target.closest('button') && !event.target.closest('.direction-controls')) return;
  const direction = { ArrowUp: 'up', ArrowRight: 'right', ArrowDown: 'down', ArrowLeft: 'left' }[event.key];
  if (!direction) return;
  event.preventDefault();
  playMove(direction);
});

render();
message(loadingMessage || (view === 'play' ? '选择一个方向，同时移动两艘船。' : '选择工具，再点海图上的格子。'), shared && view !== 'play' ? 'warn' : 'info');
