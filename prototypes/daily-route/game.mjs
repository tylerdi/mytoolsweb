import { PRACTICE_COUNT, SIZE, ROUTE_JOURNEY, tutorialStage, entryMode, contextRule, guidedMoveAllowed, inspectRoute, advance, dailyBoard, dayKey, findHint, practiceBoard, signalState, streak, tutorialBoard, validateRoute } from './game-core.mjs';
import { createGameTelemetry, createRouteTelemetry, invalidReason, shareURL, showGameShare } from '../../assets/game-analytics.mjs';
import { createVoyage, createSeaMotion } from '../../assets/voyage.mjs';

const asset = {
  start: './assets/dock.svg', end: './assets/lighthouse.svg', beacon: './assets/beacon.svg',
  reef: './assets/reef.svg', boat: './assets/boat.svg',
};
const arrow = { up: '↑', right: '→', down: '↓', left: '←' };
const storageKey = 'daily-route-results:v1';
const tutorialKey = 'daily-route-tutorial:v1';
const entryKey='daily-route-entry:v1';
const track = createGameTelemetry('route');
const diagnostics=createRouteTelemetry('route');
const boardElement = document.querySelector('[data-board]');
boardElement.tabIndex = -1;
const feedback = document.querySelector('[data-feedback]');
const dialog = document.querySelector('[data-finish-dialog]');
const cells = [];
const motion = createSeaMotion(boardElement, dialog);
const voyage = createVoyage({ game: 'route', count: PRACTICE_COUNT, sequence: ROUTE_JOURNEY, version: 'v3', previousVersion:'v2', preserveThrough:8, onSelect: (level) => loadBoard('practice', level), titleFor: (level) => practiceBoard(level).title, detailFor: (level) => level>=9?`困难 · ${level<=10?'航闸':'潮桥'}`:practiceBoard(level).difficulty, onMapOpen: () => motion.cancelFinish() });

function loadRecords() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
  } catch { return {}; }
}

const records = loadRecords();
let mode = 'tutorial';
try { mode=entryMode(localStorage.getItem(entryKey),localStorage.getItem(tutorialKey)==='done'); } catch { /* Playable without storage. */ }
const requestedUrl = new URL(location.href);
let practiceLevel = voyage.next();
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
  const signal=signalState(board,index,path);
  const extra=signal?`${signal.beacon+1} 号${signal.type==='gate'?'航闸':'潮桥'}，${signal.open?'已开启':'已关闭'}`:board.signals&&Object.keys(board.signals).length&&board.beacons.includes(index)?`${board.beacons.indexOf(index)+1} 号航标`:kind;
  return `第 ${row} 行第 ${column} 列，${extra}${position >= 0 ? `，航线第 ${position + 1} 格` : ''}`;
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
  if (won) return '试航完成。接下来独立挑战一张有岔路的海图。';
  if(tutorialStage(path)==='independent'){
    if(board.currents[path.at(-1)])return '船到了洋流格：沿箭头方向离开。找回灯塔的路由你决定。';
    const left=board.beacons.filter(cell=>!path.includes(cell)).length;
    return left?`现在自己来：再收集 ${left} 个航标，再用剩余 ${board.limit-path.length+1} 步靠岸。走错可以撤回。`:'航标收齐了。自己规划最后一段，进入灯塔靠岸。';
  }
  const next = board.reference[path.length];
  if (path.length === 1) return '先点船右边发光的相邻格，让船前进。';
  if (board.currents[path.at(-1)]) return '船在蓝色洋流格里；下一步只能沿箭头方向走。';
  if (next === board.end) return '三个金色航标已收齐，点灯塔靠岸。';
  if (board.beacons.includes(next)) return '点发光的金色航标，收集它后继续前进。';
  if (board.currents[next]) return '点发光的蓝色箭头格，留意下一步方向。';
  return '继续点发光的相邻格，路线不能重复经过同一格。';
}

function render() {
  const inspectionNote=document.querySelector('[data-inspect-note]');
  if(inspectionNote.dataset.path!==path.join(',')){
    inspectionNote.dataset.path=path.join(',');
    inspectionNote.textContent='不显示路线；确定结果记一次辅助，搜索未完成不扣次数。';
  }
  document.querySelector('[data-inspect]').disabled=mode==='tutorial'||hints>=3||won;
  const visitedBeacons = board.beacons.filter((beacon) => path.includes(beacon)).length;
  const tutorial = mode === 'tutorial';
  document.querySelector('[data-steps]').textContent = `${path.length - 1} / ${board.limit}`;
  document.querySelector('[data-beacons]').textContent = `${visitedBeacons} / 3`;
  document.querySelector('[data-time]').textContent = clockText(elapsed);
  document.querySelector('[data-streak]').textContent = String(streak(records, dayKey()));
  document.querySelector('[data-mode-label]').textContent = tutorial ? '入门试航' : mode === 'daily' ? '每日挑战' : `闯关 ${practiceLevel}`;
  document.querySelector('[data-board-title]').textContent = tutorial ? '入门海图' : mode === 'daily' ? `${Number(board.key.slice(5, 7))} 月 ${Number(board.key.slice(8, 10))} 日 · 今日海图` : `第 ${practiceLevel} 关 · ${board.title}`;
  document.querySelector('[data-board-subtitle]').textContent = tutorial ? (tutorialStage(path)==='guided'?'前四步示范':'后半程自己决定') : mode === 'daily' ? (board.difficulty?`${board.difficulty} · ${board.family}`:'今日完成后还能继续闯关') : `${board.difficulty} · ${board.chapter}`;
  const brief = document.querySelector('[data-level-brief]');
  brief.hidden = mode === 'tutorial'||!board.analysis;
  if (mode !== 'tutorial'&&board.analysis) {
    brief.querySelector('strong').textContent = board.limit > board.analysis.shortest ? `预算余量 ${board.limit - board.analysis.shortest} 步` : '预算无余量';
    brief.querySelector('span').textContent = board.focus;
  }
  const signalGuide=document.querySelector('[data-signal-guide]');
  const cue=mode==='tutorial'?'':contextRule(board,path);
  signalGuide.hidden=!cue;signalGuide.textContent=cue;
  const guide = document.querySelector('[data-tutorial-guide]');
  guide.hidden = !tutorial;guide.dataset.phase=tutorialStage(path);
  if (tutorial) {
    document.querySelector('[data-tutorial-step]').textContent = won ? '试航完成' : tutorialStage(path)==='guided'?`跟我试四步 · ${path.length} / 4`:'轮到你独立靠岸';
    document.querySelector('[data-tutorial-text]').textContent = tutorialInstruction();
  }
  document.querySelector('[data-practice-controls]').hidden = mode !== 'practice';
  const station=ROUTE_JOURNEY.indexOf(practiceLevel);
  document.querySelector('[data-practice-title]').textContent = station>=0?`精选 ${station+1} / 6 · 海图 ${practiceLevel}`:`补练海图 ${practiceLevel} / 12`;
  document.querySelector('[data-prev]').disabled = station>=0?station===0:practiceLevel<=1;
  document.querySelector('[data-next]').disabled = station>=0?station===ROUTE_JOURNEY.length-1:practiceLevel>=PRACTICE_COUNT;
  document.querySelector('[data-undo]').disabled = path.length <= 1;
  document.querySelector('[data-hint]').disabled = tutorial || hints >= 3 || won;
  const shareButton = document.querySelector('[data-share]');
  shareButton.title = won && !tutorial ? '分享本局成绩' : '分享游戏链接';
  shareButton.setAttribute('aria-label', shareButton.title);
  document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));

  boardElement.setAttribute('aria-label', `${SIZE} 乘 ${SIZE} 航线棋盘，${tutorial ? '入门试航，' : ''}${visitedBeacons} 个航标已收集，已走 ${path.length - 1} 步`);

  for (const cell of cells) {
    const index = Number(cell.dataset.index);
    const position = path.indexOf(index);
    const isHead = position === path.length - 1;
    cell.className = 'tile';
    for (const [name, active] of [
      ['reef', board.obstacles.includes(index)], ['beacon', board.beacons.includes(index)],
      ['current', Boolean(board.currents[index])], ['goal', index === board.end],
      ['path', position >= 0], ['head', isHead], ['hint', hintTarget === index],
      ['tutorial-target', tutorial && tutorialStage(path)==='guided' && !won && board.reference[path.length] === index],
    ]) if (active) cell.classList.add(name);
    cell.replaceChildren();
    if (isHead) cell.append(icon('boat'));
    else if (index === board.start) cell.append(icon('start'));
    else if (index === board.end) cell.append(icon('end'));
    else if (board.obstacles.includes(index)) cell.append(icon('reef'));
    else if (board.beacons.includes(index)) cell.append(icon('beacon'));
    if (board.currents[index]) {
      const flow = document.createElement('span');
      flow.className = 'flow'+(isHead||board.beacons.includes(index)||board.signals?.[index]?' flow-overlay':'');
      flow.textContent = arrow[board.currents[index]];
      flow.setAttribute('aria-hidden', 'true');
      cell.append(flow);
    }
    const signal=signalState(board,index,path);
    if(signal){
      cell.classList.add('signal-tile',signal.type,signal.open?'signal-open':'signal-closed');
      if(!isHead){const sign=document.createElement('span');sign.className='signal-symbol';sign.textContent=`${signal.type==='gate'?'闸':'桥'} ${signal.beacon+1}`;sign.setAttribute('aria-hidden','true');cell.append(sign);}
    }
    if(Object.keys(board.signals||{}).length&&board.beacons.includes(index)&&!isHead){
      const badge=document.createElement('span');badge.className='beacon-number';badge.textContent=String(board.beacons.indexOf(index)+1);badge.setAttribute('aria-hidden','true');cell.append(badge);
    }
    if (position >= 0) {
      const step = document.createElement('span');
      step.className = 'step';
      step.textContent = String(position);
      step.setAttribute('aria-hidden', 'true');
      cell.append(step);
    }
    cell.setAttribute('aria-label', `${labelFor(index)}${board.currents[index]?`，洋流出口向${{up:"上",right:"右",down:"下",left:"左"}[board.currents[index]]}`:""}${tutorial && tutorialStage(path)==='guided' && !won && board.reference[path.length] === index ? '，教学下一步' : ''}`);
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
  track(`${mode}_complete`);diagnostics.send('complete');
  if (mode === 'tutorial') {
    try { localStorage.setItem(tutorialKey, 'done'); } catch { /* Playable without storage. */ }
  }
  document.querySelector('[data-finish-title]').textContent = mode === 'tutorial' ? '首次试航完成' : '顺利靠岸';
  document.querySelector('[data-finish-score]').textContent = `${path.length - 1} / ${board.limit} 步`;
  document.querySelector('[data-finish-description]').textContent = mode === 'tutorial' ? '后半程已经顺利靠岸。下一张海图不再标答案，试试自己选择洋流的入口。' : mode === 'daily' ? `${board.key} 每日挑战完成，还可以继续闯关。` : `第 ${practiceLevel} 关完成${voyage.nextAfter(practiceLevel)!==null ? `，下一站：${practiceBoard(voyage.nextAfter(practiceLevel)).focus}` : '，这段航程抵达终点！'}`;
  document.querySelector('[data-finish-detail]').textContent = `航标 3 / 3 · 辅助 ${hints} / 3 · 用时 ${clockText(elapsed)}${mode === 'practice' ? `。本关最短 ${board.analysis.shortest} 步，预算内共 ${board.analysis.solutionCount} 条可行航线。` : ''}`;
  document.querySelector('[data-dialog-share]').textContent = mode === 'tutorial' ? '分享游戏' : '分享成绩';
  const replay = document.querySelector('[data-replay]');
  replay.hidden = mode === 'tutorial';
  if (mode !== 'tutorial') replay.href = mode === 'daily' ? `/replay/?game=route&date=${board.key}` : `/replay/?game=route&level=${practiceLevel}`;
  const lesson=document.querySelector('[data-next-lesson]');
  const lessons={2:['route-currents','复盘洋流出口'],8:['route-beacons','复盘回程规划'],11:['signals','复盘潮桥时机']};
  const topic=mode==='practice'?lessons[practiceLevel]:null;
  lesson.href=topic?`/guides/${topic[0]}`:'/guides/';lesson.textContent=topic?topic[1]:'练五个规划方法';
  document.querySelector('[data-dialog-practice]').textContent = mode === 'practice' ? voyage.nextAfter(practiceLevel)!==null ? `下一站 · ${practiceBoard(voyage.nextAfter(practiceLevel)).title} →` : '精选航程完成 · 查看全部海图' : `独立挑战 · ${practiceBoard(voyage.next()).title} →`;
  message(mode === 'tutorial' ? '试航完成，接下来挑战精选首站。' : '航线完成，所有航标都已收齐。');
  render();
  motion.finish();
}

function move(target) {
  if (won) return;
  if (target === path.at(-1)) return;
  if (mode === 'tutorial' && !guidedMoveAllowed(board,path,target)) {
    message(board.currents[path.at(-1)] ? '船在洋流格，必须沿蓝色箭头方向离开。' : board.obstacles.includes(target) ? '灰色礁石不能走，先点发光的格子。' : '先点发光的相邻格；也可以点上一格撤回。', 'warn');
    motion.invalid();
    return;
  }
  const result = advance(board, path, target);
  if (result.status === 'invalid') { diagnostics.send('invalid',invalidReason(result.message));message(result.message, 'warn'); motion.invalid(); return; }
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
  track('move');
  if(mode==='tutorial'){if(path.length===5)diagnostics.send('guided_complete');if(path.length>5)diagnostics.send('independent_start');}
  if (!started) { track(`${mode}_start`);diagnostics.send('start'); started = true; }
  if (result.status === 'solved') { finish(); motion.sail(previous, target, '.vessel', true); return; }
  startClock();
  message(mode === 'tutorial' ? tutorialInstruction() : board.beacons.includes(target) ? `已收集 ${board.beacons.filter(cell=>path.includes(cell)).length} / 3 航标。${Object.values(board.signals||{}).filter(signal=>signal.beacon===board.beacons.indexOf(target)).map(signal=>signal.type==='gate'?'对应航闸已开启。':'对应潮桥已关闭。').join('')}${board.beacons.every(cell=>path.includes(cell))?'现在前往灯塔。':'继续规划剩下的航标。'}` : '航线已延伸。');
  render();
  motion.sail(previous, target, '.vessel', board.beacons.includes(target));
}

function loadBoard(nextMode = mode, level = practiceLevel) {
  document.querySelector('[data-inspect-note]').textContent='不显示路线；确定结果记一次辅助，搜索未完成不扣次数。';
  motion.cancelFinish();
  stopClock();
  if (dialog.open) dialog.close();
  if(started&&!won)diagnostics.send('leave');
  mode = nextMode;
  document.querySelector('[data-session-records]').open=mode!=='tutorial';
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
    } else message('找到码头与灯塔，先观察剩余航标和机关，再点击相邻格画线。');
  } else message(mode === 'tutorial' ? tutorialInstruction() : `第 ${practiceLevel} 关已载入。通关后可直接前往下一站。`);
  diagnostics.load(mode,practiceLevel,board.difficulty);
  voyage.update(mode === 'practice' ? practiceLevel : null);
  render();
  motion.enter();
  if(arguments.length&&mode!=='tutorial'){try{localStorage.setItem(entryKey,mode);}catch{}}
  if (arguments.length) boardElement.focus({ preventScroll: true });
}

function reset() {
  diagnostics.send('reset');
  motion.cancelFinish();
  motion.clear();
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
  if (next === null) { message('当前搜索没有找到下一步，可能是分支受阻或搜索达到上限。可先检查局面，再撤回尝试。', 'warn'); return; }
  hints += 1;diagnostics.send('hint');
  hintTarget = next;
  message('下一步可行位置已在棋盘上标记。');
  render();
}

async function share() {
  const url = shareURL(`https://tylerzhang.xyz/${mode === 'practice' ? `?practice=${practiceLevel}` : ''}`);
  const title = '每日航线';
  const text = won && mode !== 'tutorial'
    ? `${mode === 'daily' ? board.key : `练习 ${practiceLevel}`} · ${path.length - 1}/${board.limit} 步 · ${hints} 次辅助`
    : '每天一张新海图，也可以连续闯关。来规划你的航线。';
  showGameShare({title,text,url,onShared:()=>track('share')});
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
  loadBoard(button.dataset.mode, button.dataset.mode === 'practice' ? voyage.next() : practiceLevel);
}));
document.querySelector('[data-prev]').addEventListener('click', () => loadBoard('practice', ROUTE_JOURNEY.includes(practiceLevel)?ROUTE_JOURNEY[ROUTE_JOURNEY.indexOf(practiceLevel)-1]:practiceLevel-1));
document.querySelector('[data-next]').addEventListener('click', () => loadBoard('practice', ROUTE_JOURNEY.includes(practiceLevel)?voyage.nextAfter(practiceLevel):practiceLevel+1));
document.querySelector('[data-undo]').addEventListener('click', undo);
document.querySelector('[data-reset]').addEventListener('click', reset);
document.querySelector('[data-hint]').addEventListener('click', hint);
document.querySelector('[data-share]').addEventListener('click', share);
document.querySelector('[data-dialog-share]').addEventListener('click', share);
document.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
document.querySelector('[data-dialog-practice]').addEventListener('click', () => {
  if (mode === 'practice' && voyage.nextAfter(practiceLevel)===null) { dialog.close(); voyage.showMap(); }
  else loadBoard('practice', mode === 'practice' ? voyage.nextAfter(practiceLevel) : voyage.next());
});
setInterval(() => { if (mode === 'daily' && board.key !== dayKey()) loadBoard('daily'); }, 60000);
loadBoard();

const inspection=document.querySelector('[data-inspect]');
inspection.addEventListener('click',()=>{
  const note=document.querySelector('[data-inspect-note]');
  if(mode==='tutorial'){note.textContent='教学会标出下一步。完成教学后，再独立检查每日题或闯关局面。';return;}
  if(hints>=3){note.textContent='本局三次辅助已用完，可以撤回继续尝试。';return;}
  const result=inspectRoute(board,path);diagnostics.send('inspect',result.status);if(result.status!=='unknown'&&result.status!=='solved')hints+=1;
  note.textContent=result.message+(result.status==='unknown'||result.status==='solved'?'':'（记一次辅助，和下一步提示共用三次额度。）');render();
});

document.addEventListener('visibilitychange',()=>{if(document.hidden&&started&&!won)diagnostics.send('leave');});
