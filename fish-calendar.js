/**
 * 小鱼儿 贡献日历 🐟📊
 * GitHub 风格的打卡热力图 + 连续天数统计
 * 用法：<div id="fish-calendar"></div><script src="/fish-calendar.js"></script>
 */
(function(){
'use strict';

const STORAGE_KEY = 'fish_calendar_data';

class FishCalendar {
  constructor() {
    this.el = document.getElementById('fish-calendar');
    if (!this.el) return;
    this.data = this.load();
    this.today = this.dateKey(new Date());
    this.render();
  }

  load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
  }

  dateKey(d) {
    return d.toISOString().slice(0, 10);
  }

  toggle(dateKey) {
    if (this.data[dateKey]) {
      delete this.data[dateKey];
    } else {
      this.data[dateKey] = 1;
    }
    this.save();
    this.render();
  }

  getStats() {
    const keys = Object.keys(this.data).sort();
    const total = keys.length;
    if (total === 0) return { total: 0, streak: 0, maxStreak: 0, thisMonth: 0, thisYear: 0 };

    // 当前连续天数
    let streak = 0;
    const d = new Date();
    while (true) {
      const k = this.dateKey(d);
      if (this.data[k]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }

    // 最长连续
    let maxStreak = 0;
    let curStreak = 0;
    let prevDate = null;
    for (const k of keys) {
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(k);
        const diff = (curr - prev) / 86400000;
        if (diff === 1) curStreak++;
        else curStreak = 1;
      } else {
        curStreak = 1;
      }
      maxStreak = Math.max(maxStreak, curStreak);
      prevDate = k;
    }

    const year = new Date().getFullYear();
    const month = new Date().toISOString().slice(0, 7);
    const thisYear = keys.filter(k => k.startsWith(String(year))).length;
    const thisMonth = keys.filter(k => k.startsWith(month)).length;

    return { total, streak, maxStreak, thisMonth, thisYear };
  }

  render() {
    const stats = this.getStats();
    const weeks = this.buildWeeks();

    this.el.innerHTML = `
      <div class="fcal-wrap">
        <div class="fcal-stats">
          <div class="fcal-stat">
            <span class="fcal-stat-num">${stats.total}</span>
            <span class="fcal-stat-label">总打卡</span>
          </div>
          <div class="fcal-stat">
            <span class="fcal-stat-num">${stats.streak}</span>
            <span class="fcal-stat-label">当前连续 🔥</span>
          </div>
          <div class="fcal-stat">
            <span class="fcal-stat-num">${stats.maxStreak}</span>
            <span class="fcal-stat-label">最长连续</span>
          </div>
          <div class="fcal-stat">
            <span class="fcal-stat-num">${stats.thisMonth}</span>
            <span class="fcal-stat-label">本月</span>
          </div>
          <div class="fcal-stat">
            <span class="fcal-stat-num">${stats.thisYear}</span>
            <span class="fcal-stat-label">今年</span>
          </div>
        </div>

        <div class="fcal-heatmap">
          <div class="fcal-months">${this.renderMonths(weeks)}</div>
          <div class="fcal-body">
            <div class="fcal-days-label">
              <span>一</span><span>三</span><span>五</span>
            </div>
            <div class="fcal-grid">${this.renderGrid(weeks)}</div>
          </div>
        </div>

        <div class="fcal-legend">
          <span>少</span>
          <span class="fcal-cell level-0"></span>
          <span class="fcal-cell level-1"></span>
          <span class="fcal-cell level-2"></span>
          <span class="fcal-cell level-3"></span>
          <span>多</span>
        </div>

        <div class="fcal-actions">
          <button class="fcal-today-btn" id="fcal-today">
            ${this.data[this.today] ? '✅ 今日已打卡' : '⬜ 今日打卡'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('fcal-today')?.addEventListener('click', () => {
      this.toggle(this.today);
    });

    this.el.querySelectorAll('.fcal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.dataset.date;
        if (date) this.toggle(date);
      });
    });
  }

  buildWeeks() {
    const weeks = [];
    const today = new Date();
    // 从 52 周前的周一开始
    const start = new Date(today);
    start.setDate(start.getDate() - 364);
    // 回到周一
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);

    let current = new Date(start);
    while (current <= today || current.getDay() !== 1) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
      if (current > today && current.getDay() === 1) break;
    }
    return weeks;
  }

  renderMonths(weeks) {
    let html = '';
    let lastMonth = -1;
    const monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    weeks.forEach(week => {
      const firstDay = week[0];
      const m = firstDay.getMonth();
      if (m !== lastMonth) {
        html += `<span>${monthNames[m]}</span>`;
        lastMonth = m;
      }
    });
    return html;
  }

  renderGrid(weeks) {
    let html = '';
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      html += '<div class="fcal-row">';
      weeks.forEach(week => {
        const d = week[dayIdx];
        const key = this.dateKey(d);
        const isToday = key === this.today;
        const isFuture = d > new Date();
        const checked = !!this.data[key];
        const level = checked ? 'level-2' : 'level-0';
        const cls = `fcal-cell ${level} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`;
        const title = `${key}${checked ? ' ✅' : ''}`;
        html += `<div class="${cls}" data-date="${isFuture ? '' : key}" title="${title}"></div>`;
      });
      html += '</div>';
    }
    return html;
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fcal-wrap{max-width:800px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fcal-stats{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;justify-content:center}
.fcal-stat{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px;padding:14px 20px;text-align:center;min-width:90px;flex:1}
.fcal-stat-num{font-size:1.8rem;font-weight:800;color:var(--accent,#646cff);display:block;font-variant-numeric:tabular-nums}
.fcal-stat-label{font-size:.75rem;color:var(--text-secondary,#888);margin-top:4px;display:block}
.fcal-heatmap{overflow-x:auto;padding-bottom:8px}
.fcal-months{display:flex;gap:3px;margin-bottom:4px;padding-left:32px;font-size:.65rem;color:var(--text-secondary,#666)}
.fcal-months span{min-width:52px}
.fcal-body{display:flex;gap:6px}
.fcal-days-label{display:flex;flex-direction:column;gap:3px;font-size:.6rem;color:var(--text-secondary,#666);padding-top:2px}
.fcal-days-label span{height:14px;display:flex;align-items:center}
.fcal-grid{display:flex;gap:3px}
.fcal-row{display:flex;flex-direction:column;gap:3px}
.fcal-cell{width:14px;height:14px;border-radius:3px;cursor:pointer;transition:all .2s}
.fcal-cell:hover{transform:scale(1.3);outline:2px solid var(--accent,#646cff);outline-offset:1px}
.fcal-cell.level-0{background:var(--border,#1e1e2e)}
.fcal-cell.level-1{background:#0e4429}
.fcal-cell.level-2{background:#006d32}
.fcal-cell.level-3{background:#26a641}
.fcal-cell.today{outline:2px solid var(--accent,#646cff);outline-offset:1px}
.fcal-cell.future{opacity:.3;cursor:default}
.fcal-cell.future:hover{transform:none;outline:none}
.fcal-legend{display:flex;align-items:center;gap:4px;justify-content:flex-end;margin-top:8px;font-size:.7rem;color:var(--text-secondary,#666)}
.fcal-legend .fcal-cell{cursor:default}
.fcal-legend .fcal-cell:hover{transform:none;outline:none}
.fcal-actions{text-align:center;margin-top:20px}
.fcal-today-btn{background:var(--surface,#1a1a2e);border:2px solid var(--accent,#646cff);border-radius:14px;padding:12px 32px;color:var(--text,#e8e8e8);font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .3s}
.fcal-today-btn:hover{background:var(--accent,#646cff);color:#fff;transform:translateY(-2px)}
@media(max-width:480px){
  .fcal-stats{gap:8px}
  .fcal-stat{padding:10px 12px;min-width:70px}
  .fcal-stat-num{font-size:1.4rem}
  .fcal-cell{width:12px;height:12px}
}
`;
document.head.appendChild(style);

new FishCalendar();
})();
