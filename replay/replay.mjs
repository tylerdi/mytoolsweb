import { SIZE as ROUTE_SIZE, dailyBoard as routeDaily, dayKey as routeDayKey, practiceBoard as routePractice } from '../prototypes/daily-route/game-core.mjs';
import { SIZE as TWIN_SIZE, analyzeBoard, dailyBoard as twinDaily, dayKey as twinDayKey, decodeCustomBoard, moveBoats, practiceBoard as twinPractice } from '../twins/twins-core.mjs';

const params = new URL(location.href).searchParams;
const type = params.get('game');
const element = document.querySelector('[data-board]');
let board;
let positions = [];
let step = 0;
let clock = null;

function parseDate(value, keyOf) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('日期格式无效。');
  const date = new Date(`${value}T12:00:00+08:00`);
  if (Number.isNaN(date.getTime()) || keyOf(date) !== value) throw new Error('日期不存在。');
  return date;
}

try {
  const level = params.get('level');
  if (type === 'route') {
    if (level && /^\d+$/.test(level)) board = routePractice(Number(level));
    else board = routeDaily(parseDate(params.get('date'), routeDayKey));
  } else if (type === 'twins') {
    if (params.has('p')) {
      board = decodeCustomBoard(params.get('p'));
      const result = analyzeBoard(board);
      if (!result.solved) throw new Error(result.error);
      board.reference = result.reference;
    } else if (level && /^\d+$/.test(level)) board = twinPractice(Number(level));
    else board = twinDaily(parseDate(params.get('date'), twinDayKey));
    positions = [{ ...board.start }];
    for (const direction of board.reference) positions.push(moveBoats(board, positions.at(-1), direction));
  } else throw new Error('游戏类型无效。');

  const total = type === 'route' ? board.reference.length - 1 : board.reference.length;
  document.querySelector('[data-title]').textContent = type === 'route' ? '每日航线 · 解法回放' : '潮汐双船 · 解法回放';
  document.querySelector('[data-description]').textContent = board.mode === 'custom' ? '自制海图的一种最短解。' : board.mode === 'practice' ? `练习 ${board.key} 的一种可行解。` : `${board.key} 每日海图的一种可行解。`;
  document.querySelector('[data-board-title]').textContent = board.title || (board.mode === 'practice' ? `练习 ${board.key}` : board.mode === 'custom' ? '自制海图' : board.key);
  document.querySelector('[data-total]').textContent = String(total);
  document.querySelector('[data-slider]').max = String(total);
  document.querySelector('[data-replay-content]').hidden = false;
  document.querySelector('[data-puzzle-link]').href = board.mode === 'custom' ? `/twins/create/?p=${params.get('p')}` : type === 'route' ? board.mode === 'practice' ? `/?practice=${board.key}` : '/' : board.mode === 'practice' ? `/twins/?practice=${board.key}` : '/twins/';
  render();
} catch (error) {
  document.querySelector('[data-title]').textContent = '回放链接无效';
  document.querySelector('[data-description]').textContent = '请从游戏通关页面或精选关卡打开回放。';
  document.querySelector('[data-error]').textContent = error.message;
  document.querySelector('[data-error]').hidden = false;
}

function icon(path) {
  const img = document.createElement('img');
  img.src = path;
  img.alt = '';
  img.draggable = false;
  return img;
}

function routeStepText() {
  if (step === 0) return '从码头出发。先观察三个航标与洋流的位置。';
  const current = board.reference[step];
  const previous = board.reference[step - 1];
  if (current === board.end) return '三个航标已经收齐，最后一步抵达灯塔。';
  if (board.beacons.includes(current)) return `第 ${step} 步收集航标；已获得 ${board.beacons.filter((cell) => board.reference.slice(0, step + 1).includes(cell)).length} / 3。`;
  if (board.currents[current]) return `第 ${step} 步进入洋流；下一步要沿箭头向${{ up: '上', right: '右', down: '下', left: '左' }[board.currents[current]]}离开。`;
  if (board.currents[previous]) return `第 ${step} 步顺着洋流离开，路线继续延伸。`;
  return `第 ${step} 步选择相邻海面，避开礁石且不重复经过旧格。`;
}

function twinStepText() {
  if (step === 0) return '两艘船从不同位置出发；每个方向会同时作用于它们。';
  const before = positions[step - 1];
  const after = positions[step];
  const direction = board.reference[step - 1];
  const name = { up: '上', right: '右', down: '下', left: '左' }[direction];
  if (step === board.reference.length) return `第 ${step} 步向${name}移动，两艘船分别到达对应港口。`;
  if (before.a === after.a) return `第 ${step} 步向${name}：珊瑚船被挡住，金色船单独前进。`;
  if (before.b === after.b) return `第 ${step} 步向${name}：金色船被挡住，珊瑚船单独前进。`;
  return `第 ${step} 步向${name}，两艘船一起前进。`;
}

function render() {
  if (!board) return;
  const size = type === 'route' ? ROUTE_SIZE : TWIN_SIZE;
  element.className = `board replay-board ${type === 'route' ? 'route' : 'twins'}`;
  element.style.gridTemplateColumns = `repeat(${size}, minmax(0,1fr))`;
  element.style.gridTemplateRows = `repeat(${size}, minmax(0,1fr))`;
  element.replaceChildren();
  for (let index = 0; index < size * size; index += 1) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.setAttribute('role', 'gridcell');
    if (type === 'route') {
      const position = board.reference.slice(0, step + 1).indexOf(index);
      if (board.obstacles.includes(index)) { tile.classList.add('rock'); tile.append(icon('/prototypes/daily-route/assets/reef.svg')); }
      else if (position === step) { tile.classList.add('head'); tile.append(icon('/prototypes/daily-route/assets/boat.svg')); }
      else if (index === board.start) tile.append(icon('/prototypes/daily-route/assets/dock.svg'));
      else if (index === board.end) { tile.classList.add('goal'); tile.append(icon('/prototypes/daily-route/assets/lighthouse.svg')); }
      else if (board.beacons.includes(index)) { tile.classList.add('beacon'); tile.append(icon('/prototypes/daily-route/assets/beacon.svg')); }
      else if (board.currents[index]) { tile.classList.add('current'); const flow = document.createElement('span'); flow.className = 'flow'; flow.textContent = { up: '↑', right: '→', down: '↓', left: '←' }[board.currents[index]]; tile.append(flow); }
      if (position >= 0) {
        tile.classList.add('path');
        const number = document.createElement('span'); number.className = 'number'; number.textContent = String(position); tile.append(number);
      }
      tile.setAttribute('aria-label', `第 ${Math.floor(index / size) + 1} 行第 ${index % size + 1} 列${position >= 0 ? `，航线第 ${position} 步` : ''}`);
    } else {
      const state = positions[step];
      const labels = [];
      if (board.rocks.includes(index)) { tile.classList.add('rock'); tile.append(icon('/twins/assets/reef.svg')); }
      if (board.rocks.includes(index)) labels.push('礁石');
      if (index === board.goals.a) { tile.classList.add('dock-a'); labels.push('珊瑚港'); }
      if (index === board.goals.b) { tile.classList.add('dock-b'); labels.push('金色港'); }
      if (index === state.a) { tile.append(icon('/twins/assets/boat-coral.svg')); labels.push('珊瑚船'); }
      if (index === state.b) { tile.append(icon('/twins/assets/boat-gold.svg')); labels.push('金色船'); }
      tile.setAttribute('aria-label', `第 ${Math.floor(index / size) + 1} 行第 ${index % size + 1} 列，${labels.join('，') || '海面'}`);
    }
    element.append(tile);
  }
  document.querySelector('[data-explanation]').textContent = type === 'route' ? routeStepText() : twinStepText();
  document.querySelector('[data-step-count]').textContent = `${step} / ${type === 'route' ? board.reference.length - 1 : board.reference.length}`;
  document.querySelector('[data-position]').textContent = String(step);
  document.querySelector('[data-slider]').value = String(step);
  document.querySelector('[data-prev]').disabled = step === 0;
  document.querySelector('[data-next]').disabled = step >= Number(document.querySelector('[data-slider]').max);
}

function stop() {
  if (clock) clearInterval(clock);
  clock = null;
  document.querySelector('[data-play]').textContent = '▶';
  document.querySelector('[data-play]').setAttribute('aria-label', '播放回放');
}

document.querySelector('[data-prev]').addEventListener('click', () => { stop(); step = Math.max(0, step - 1); render(); });
document.querySelector('[data-next]').addEventListener('click', () => { stop(); step = Math.min(Number(document.querySelector('[data-slider]').max), step + 1); render(); });
document.querySelector('[data-slider]').addEventListener('input', (event) => { stop(); step = Number(event.target.value); render(); });
document.querySelector('[data-play]').addEventListener('click', () => {
  if (clock) { stop(); return; }
  if (step >= Number(document.querySelector('[data-slider]').max)) step = 0;
  document.querySelector('[data-play]').textContent = 'Ⅱ';
  document.querySelector('[data-play]').setAttribute('aria-label', '暂停回放');
  render();
  clock = setInterval(() => {
    step += 1;
    render();
    if (step >= Number(document.querySelector('[data-slider]').max)) stop();
  }, 850);
});
