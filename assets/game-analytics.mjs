const events = new Set([
  'open', 'return_next_day', 'tutorial_start', 'tutorial_complete',
  'daily_start', 'daily_complete', 'practice_start', 'practice_complete', 'share',
]);

function analyticsDayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function createGameTelemetry(game) {
  const live = ['tylerzhang.xyz', 'www.tylerzhang.xyz'].includes(location.hostname)
    && !location.pathname.startsWith('/prototypes/')
    && navigator.globalPrivacyControl !== true && !['1', 'yes'].includes(navigator.doNotTrack);
  const today = analyticsDayKey();

  function track(event) {
    if (!live || !events.has(event)) return;
    const key = `daily-games:event:${game}:${today}:${event}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch { /* Games remain playable if storage is unavailable. */ }
    fetch('/api/stats', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'game', game, event }), keepalive: true,
    }).catch(() => {});
  }

  track('open');
  if (live) {
    const key = `daily-games:last-visit:${game}`;
    try {
      const previous = localStorage.getItem(key);
      const yesterday = new Date(Date.parse(`${today}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
      if (previous === yesterday) track('return_next_day');
      localStorage.setItem(key, today);
    } catch { /* No cross-day count without local storage. */ }
  }
  return track;
}
