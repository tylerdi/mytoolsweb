const status = document.querySelector('#status');
const table = document.querySelector('#metrics');
const days = document.querySelector('#days');
const events = ['open', 'tutorial_start', 'tutorial_complete', 'daily_start', 'daily_complete', 'return_next_day', 'share'];

async function refresh() {
  status.textContent = '正在读取统计...';
  table.hidden = true;
  try {
    const response = await fetch(`/api/stats?type=game&days=${days.value}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const totals = { route: {}, twins: {} };
    for (const [key, counts] of Object.entries(data.counts || {})) {
      const game = key.slice(key.lastIndexOf(':') + 1);
      if (!totals[game]) continue;
      for (const event of events) totals[game][event] = (totals[game][event] || 0) + (counts[event] || 0);
    }
    const body = table.querySelector('tbody');
    body.replaceChildren();
    for (const [game, name] of [['route', '每日航线'], ['twins', '潮汐双船']]) {
      const row = document.createElement('tr');
      for (const value of [name, ...events.map((event) => totals[game][event] || 0)]) {
        const cell = document.createElement('td');
        cell.textContent = String(value);
        row.append(cell);
      }
      body.append(row);
    }
    table.hidden = false;
    status.textContent = data.truncated ? '记录量达到读取上限，显示的是部分事件。' : '统计已更新。';
  } catch {
    status.textContent = '统计暂时不可用，请稍后再试。';
  }
}

days.addEventListener('change', refresh);
refresh();
