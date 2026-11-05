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

export function createVoyage({ game, count, onSelect, titleFor, detailFor = () => null, version = 'v1', onMapOpen = () => {} }) {
  const key = `daily-games:voyage:${game}:${version}`;
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
      const description = detailFor(number);
      button.append(label, title);
      if (description) {
        const badge = document.createElement('em');
        badge.className = 'level-badge';
        badge.textContent = description;
        badge.dataset.difficulty = description;
        button.append(badge);
      }
      button.append(detail);
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
  const sailings = new Map();
  const effects = document.createElement('div');
  effects.className = 'sea-effects';
  effects.setAttribute('aria-hidden', 'true');
  board.append(effects);
  const medal = document.createElement('div');
  medal.className = 'arrival-medal';
  medal.setAttribute('aria-hidden', 'true');
  medal.textContent = '✓';
  dialog.prepend(medal);
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
    if (!active()) {
      for (const animation of activeAnimations) animation.cancel();
      for (const sailing of sailings.values()) sailing.cleanup();
      effects.replaceChildren();
    }
  }
  toggle.addEventListener('click', () => {
    enabled = !active();
    try { localStorage.setItem('daily-games:motion', enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
    sync();
  });
  media.addEventListener('change', sync);
  sync();
  function transient(element, frames, options) {
    effects.append(element);
    const animation = animate(element, frames, options);
    const remove = () => element.remove();
    if (animation) animation.finished.then(remove, remove);
    else remove();
  }
  function center(cell) {
    const frame = board.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    return { x: rect.x + rect.width / 2 - frame.x - board.clientLeft, y: rect.y + rect.height / 2 - frame.y - board.clientTop, size: rect.width };
  }
  function pulse(cell, gold = false) {
    if (!active() || !cell) return;
    const point = center(cell);
    for (let ring = 0; ring < 2; ring += 1) {
      const ripple = document.createElement('i');
      ripple.className = `sea-ripple${gold ? ' golden' : ''}`;
      Object.assign(ripple.style, { left: `${point.x}px`, top: `${point.y}px`, width: `${point.size * .7}px`, height: `${point.size * .5}px` });
      transient(ripple, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: .8 }, { transform: 'translate(-50%,-50%) scale(1.65)', opacity: 0 }], { duration: gold ? 750 : 600, delay: ring * 100, easing: 'ease-out', fill: 'both' });
    }
    if (gold) for (let i = 0; i < 8; i += 1) {
      const spark = document.createElement('i');
      spark.className = 'beacon-spark';
      Object.assign(spark.style, { left: `${point.x}px`, top: `${point.y}px` });
      const angle = i * Math.PI / 4;
      transient(spark, [{ transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(angle) * point.size * .65}px),calc(-50% + ${Math.sin(angle) * point.size * .65}px)) scale(.1)`, opacity: 0 }], { duration: 650, easing: 'ease-out' });
    }
  }
  function wake(origin, destination) {
    const a = center(origin);
    const b = center(destination);
    const distance = Math.hypot(b.x - a.x, b.y - a.y);
    const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    const trail = document.createElement('div');
    trail.className = 'sailing-wake';
    Object.assign(trail.style, { left: `${a.x}px`, top: `${a.y - 12}px`, width: `${distance}px` });
    trail.innerHTML = '<svg viewBox="0 0 100 24" preserveAspectRatio="none"><path d="M0 12Q24 0 50 6T100 10M0 12Q24 24 50 18T100 14"/><path class="wake-foam" d="M10 12H85"/></svg>';
    transient(trail, [
      { transform: `rotate(${angle}deg) scaleX(.1)`, opacity: .8 },
      { transform: `rotate(${angle}deg) scaleX(1)`, opacity: .65, offset: .45 },
      { transform: `rotate(${angle}deg) scaleX(1.1) scaleY(1.6)`, opacity: 0 },
    ], { duration: 850, easing: 'ease-out' });
  }
  function clearSailings() {
    for (const sailing of sailings.values()) { sailing.animation.cancel(); sailing.cleanup(); }
    effects.replaceChildren();
  }
  return {
    sail(from, to, selector = '.vessel', celebrate = false) {
      if (!active()) return;
      if (from === to) {
        const previous = sailings.get(selector);
        if (previous) { previous.animation.cancel(); previous.cleanup(); }
        return;
      }
      for (const animation of board.getAnimations()) animation.cancel();
      const origin = board.querySelector(`[data-index="${from}"]`);
      const destination = board.querySelector(`[data-index="${to}"]`);
      const vessel = destination?.querySelector(selector);
      if (!origin || !destination || !vessel) return;
      const a = origin.getBoundingClientRect();
      const b = destination.getBoundingClientRect();
      const frame = board.getBoundingClientRect();
      const target = vessel.getBoundingClientRect();
      const previous = sailings.get(selector);
      const start = previous?.ghost.getBoundingClientRect();
      if (previous) { previous.animation.cancel(); previous.cleanup(); }
      const ghost = document.createElement('div');
      ghost.className = 'sailing-boat';
      Object.assign(ghost.style, { left: `${target.x - frame.x - board.clientLeft}px`, top: `${target.y - frame.y - board.clientTop}px`, width: `${target.width}px`, height: `${target.height}px` });
      const hull = vessel.cloneNode(true);
      hull.className = '';
      ghost.append(hull);
      effects.append(ghost);
      vessel.style.visibility = 'hidden';
      const dx = start ? start.x - target.x : a.x - b.x;
      const dy = start ? start.y - target.y : a.y - b.y;
      const bank = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) * -7 : Math.sign(dy) * 3;
      const animation = animate(ghost, [
        { transform: `translate(${dx}px,${dy}px) rotate(${bank}deg)` },
        { transform: 'translate(0,0) rotate(-1deg)', offset: .85 },
        { transform: 'translate(0,0) rotate(0deg)' },
      ], { duration: 390, easing: 'cubic-bezier(.22,.65,.32,1)', fill: 'both' });
      const sailing = { ghost, animation, cleanup() {
        ghost.remove();
        vessel.style.visibility = '';
        if (sailings.get(selector) === sailing) sailings.delete(selector);
      } };
      sailings.set(selector, sailing);
      animation.finished.then(sailing.cleanup, sailing.cleanup);
      wake(origin, destination);
      pulse(origin);
      if (celebrate) pulse(destination, true);
    },
    invalid() { animate(board, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 190 }); },
    enter() { clearSailings(); animate(board, [{ opacity: .4, transform: 'translateY(10px) scale(.98)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 380, easing: 'ease-out' }); },
    clear: clearSailings,
    cancelFinish() { clearTimeout(finishTimer); board.classList.remove('harbor-arrival'); },
    finish() {
      clearTimeout(finishTimer);
      board.classList.add('harbor-arrival');
      finishTimer = setTimeout(() => {
        if (!dialog.open) dialog.showModal();
        animate(dialog, [{ opacity: 0, transform: 'translateY(16px) scale(.96)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 320, easing: 'ease-out' });
        animate(medal, [{ transform: 'scale(.35) rotate(-25deg)', opacity: 0 }, { transform: 'scale(1.12) rotate(5deg)', opacity: 1, offset: .7 }, { transform: 'scale(1) rotate(0deg)', opacity: 1 }], { duration: 600, easing: 'ease-out' });
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
      }, active() ? 520 : 0);
    },
  };
}
