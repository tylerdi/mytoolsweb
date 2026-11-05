// Progress stays on this device. Existing daily scores use their own storage.
export function cleanVoyageProgress(value, count) {
  const clean = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean;
  for (let level = 1; level <= count; level += 1) {
    const result = value[level];
    if (result && Number.isInteger(result.steps) && result.steps > 0 && result.steps <= 100
      && Number.isInteger(result.hints) && result.hints >= 0 && result.hints <= 3) {
      clean[level] = { steps: result.steps, hints: result.hints };
    }
  }
  return clean;
}

export function nextVoyageLevel(progress, count) {
  for (let level = 1; level <= count; level += 1) if (!progress[level]) return level;
  return 1;
}

export function saveVoyageResult(progress, level, result) {
  const previous = progress[level];
  if (!previous || result.steps < previous.steps || result.steps === previous.steps && result.hints < previous.hints) {
    progress[level] = { steps: result.steps, hints: result.hints };
  }
}

export function createVoyage({ game, count, onSelect, titleFor, onMapOpen = () => {} }) {
  const key = `daily-games:voyage:${game}:v1`;
  let progress = {};
  try { progress = cleanVoyageProgress(JSON.parse(localStorage.getItem(key)), count); } catch { /* Local storage is optional. */ }
  const entry = document.querySelector('[data-voyage-entry]');
  const map = document.createElement('dialog');
  map.className = 'voyage-map';
  map.setAttribute('aria-labelledby', 'voyage-map-title');
  map.innerHTML = '<div class="map-heading"><div><p class="eyebrow">YOUR NEXT HORIZON</p><h2 id="voyage-map-title">选择你的下一片海</h2></div><button type="button" data-map-close aria-label="关闭关卡地图">×</button></div><p class="map-note">所有关卡都可直接挑战。✓ 表示已通关；记录仅保存在此浏览器。</p><div class="level-grid"></div>';
  document.body.append(map);
  const grid = map.querySelector('.level-grid');
  let current = null;
  const buttons = [];
  for (let level = 1; level <= count; level += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.level = String(level);
    button.addEventListener('click', () => { map.close(); onSelect(level); });
    grid.append(button);
    buttons.push(button);
  }
  map.querySelector('[data-map-close]').addEventListener('click', () => map.close());
  function update(level = current) {
    current = level;
    const completed = Object.keys(progress).length;
    entry.querySelector('[data-voyage-progress]').textContent = `${completed} / ${count} 已通关`;
    entry.querySelector('[data-voyage-fill]').style.width = `${completed / count * 100}%`;
    entry.querySelector('[data-voyage-start]').textContent = completed === count ? '再航行一次' : completed ? `继续第 ${nextVoyageLevel(progress, count)} 关 →` : '开始第 1 关 →';
    for (const button of buttons) {
      const number = Number(button.dataset.level);
      const result = progress[number];
      button.replaceChildren();
      const label = document.createElement('strong');
      label.textContent = `${result ? '✓ ' : ''}${String(number).padStart(2, '0')}`;
      const title = document.createElement('span');
      title.textContent = titleFor(number);
      const detail = document.createElement('small');
      detail.textContent = result ? `${result.steps} 步 · ${result.hints} 次提示` : '等待启航';
      button.append(label, title, detail);
      button.classList.toggle('completed', Boolean(result));
      if (number === current) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    }
  }
  const showMap = () => {
    onMapOpen();
    update();
    if (!map.open) map.showModal();
    (buttons.find((button) => Number(button.dataset.level) === (current || nextVoyageLevel(progress, count))) || buttons[0]).focus();
  };
  entry.querySelector('[data-voyage-start]').addEventListener('click', () => onSelect(nextVoyageLevel(progress, count)));
  entry.querySelector('[data-voyage-map]').addEventListener('click', showMap);
  update();
  return {
    update, showMap,
    next: () => nextVoyageLevel(progress, count),
    win(level, result) {
      saveVoyageResult(progress, level, result);
      try { localStorage.setItem(key, JSON.stringify(progress)); } catch { /* Progress remains available for this visit. */ }
      update(level);
    },
  };
}

export function createSeaMotion(board, dialog) {
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('[data-motion-toggle]');
  let enabled = true;
  try { enabled = localStorage.getItem('daily-games:motion') !== 'off'; } catch { /* Defaults to system preference. */ }
  const activeAnimations = new Set();
  let finishTimer;
  const active = () => enabled && !media.matches;
  function animate(element, frames, options) {
    if (!active() || !element) return;
    const animation = element.animate(frames, options);
    activeAnimations.add(animation);
    animation.finished.then(() => activeAnimations.delete(animation), () => activeAnimations.delete(animation));
    return animation;
  }
  function sync() {
    document.documentElement.dataset.motion = active() ? 'on' : 'off';
    toggle.textContent = active() ? '◉ 动效 开' : '○ 动效 关';
    toggle.setAttribute('aria-pressed', String(active()));
    toggle.title = media.matches ? '系统已启用减少动态效果' : '开关航行动画';
    toggle.disabled = media.matches;
    if (!active()) for (const animation of activeAnimations) animation.cancel();
  }
  toggle.addEventListener('click', () => {
    enabled = !active();
    try { localStorage.setItem('daily-games:motion', enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
    sync();
  });
  media.addEventListener('change', sync);
  sync();
  function pulse(cell, gold = false) {
    if (!active() || !cell) return;
    const ripple = document.createElement('i');
    ripple.className = `sea-ripple${gold ? ' golden' : ''}`;
    cell.append(ripple);
    const animation = animate(ripple, [{ transform: 'scale(.25)', opacity: .9 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: gold ? 650 : 480, easing: 'ease-out' });
    animation?.finished.then(() => ripple.remove(), () => ripple.remove());
  }
  return {
    sail(from, to, selector = '.vessel', celebrate = false) {
      if (!active() || from === to) return;
      const origin = board.querySelector(`[data-index="${from}"]`);
      const destination = board.querySelector(`[data-index="${to}"]`);
      const vessel = destination?.querySelector(selector);
      if (!origin || !destination || !vessel) return;
      const a = origin.getBoundingClientRect();
      const b = destination.getBoundingClientRect();
      animate(vessel, [
        { transform: `translate(${a.x - b.x}px, ${a.y - b.y}px) scale(.94)` },
        { transform: 'translate(0,0) scale(1)' },
      ], { duration: 230, easing: 'cubic-bezier(.2,.8,.3,1)' });
      pulse(origin);
      if (celebrate) pulse(destination, true);
    },
    invalid() { animate(board, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 190 }); },
    enter() { animate(board, [{ opacity: .4, transform: 'translateY(10px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 380, easing: 'ease-out' }); },
    cancelFinish() { clearTimeout(finishTimer); },
    finish() {
      clearTimeout(finishTimer);
      finishTimer = setTimeout(() => {
        if (!dialog.open) dialog.showModal();
        animate(dialog, [{ opacity: 0, transform: 'translateY(16px) scale(.96)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 320, easing: 'ease-out' });
        if (!active()) return;
        for (let i = 0; i < 20; i += 1) {
          const spark = document.createElement('i');
          spark.className = 'harbor-spark';
          spark.style.setProperty('--spark-color', ['#eead4f', '#5fc8b7', '#eb8169'][i % 3]);
          dialog.append(spark);
          const angle = i * Math.PI * 2 / 20;
          const animation = animate(spark, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${Math.cos(angle) * 170}px, ${Math.sin(angle) * 140 + 30}px) rotate(${i * 57}deg)`, opacity: 0 }], { duration: 900, delay: i % 4 * 30, easing: 'ease-out', fill: 'both' });
          animation?.finished.then(() => spark.remove(), () => spark.remove());
        }
      }, active() ? 300 : 0);
    },
  };
}
