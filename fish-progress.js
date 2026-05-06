/**
 * 小鱼儿 人生进度条 🐟⏳
 * 可视化展示年/月/周/人生进度
 * 用法：<div id="fish-progress"></div><script src="/fish-progress.js"></script>
 */
(function(){
'use strict';

class FishProgress {
  constructor() {
    this.el = document.getElementById('fish-progress');
    if (!this.el) return;
    this.lifeExpectancy = parseInt(localStorage.getItem('fish_life_exp') || '80');
    this.birthday = localStorage.getItem('fish_birthday') || '';
    this.render();
    // 每分钟刷新
    setInterval(() => this.render(), 60000);
  }

  getProgress() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // 今年进度
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const yearPct = ((now - yearStart) / (yearEnd - yearStart) * 100);

    // 本月进度
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const monthPct = ((now - monthStart) / (monthEnd - monthStart) * 100);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // 本周进度（周一为起点）
    const dayOfWeek = now.getDay() || 7; // 周日=7
    const weekPct = ((dayOfWeek - 1) * 24 + hour + minute / 60) / (7 * 24) * 100;

    // 今日进度
    const dayPct = (hour * 60 + minute) / (24 * 60) * 100;

    // 人生进度
    let lifePct = null;
    let lifeYears = null;
    if (this.birthday) {
      const birth = new Date(this.birthday);
      const lived = now - birth;
      const total = this.lifeExpectancy * 365.25 * 24 * 3600 * 1000;
      lifePct = (lived / total * 100);
      lifeYears = (lived / (365.25 * 24 * 3600 * 1000));
    }

    // 距离各种日期
    const newYear = new Date(year + 1, 0, 1);
    const daysToNewYear = Math.ceil((newYear - now) / 86400000);
    const nextMonth = new Date(year, month + 1, 1);
    const daysToNextMonth = Math.ceil((nextMonth - now) / 86400000);
    const nextFriday = new Date(now);
    const daysToFri = ((5 - dayOfWeek + 7) % 7) || 7;
    nextFriday.setDate(nextFriday.getDate() + daysToFri);
    nextFriday.setHours(0,0,0,0);
    const daysToWeekend = Math.ceil((nextFriday - now) / 86400000);

    return {
      year: year,
      yearPct: { pct: yearPct, label: `${year}年`, sub: `还剩 ${365 - Math.floor((now - yearStart) / 86400000)} 天` },
      month: { pct: monthPct, label: `${month + 1}月`, sub: `${daysInMonth}天，还剩 ${daysInMonth - day} 天` },
      week: { pct: weekPct, label: '本周', sub: daysToWeekend > 0 ? `距周末 ${daysToWeekend} 天` : '🎉 周末快乐！' },
      day: { pct: dayPct, label: '今天', sub: `${hour}:${String(minute).padStart(2,'0')}` },
      life: lifePct != null ? { pct: lifePct, label: '人生', sub: `已度过 ${lifeYears.toFixed(1)} 年 / ${this.lifeExpectancy} 年` } : null,
      daysToNewYear,
    };
  }

  render() {
    const p = this.getProgress();
    const items = [p.day, p.week, p.month, p.yearPct];
    if (p.life) items.push(p.life);

    const gradients = [
      'linear-gradient(90deg, #f59e0b, #ef4444)',
      'linear-gradient(90deg, #8b5cf6, #ec4899)',
      'linear-gradient(90deg, #06b6d4, #3b82f6)',
      'linear-gradient(90deg, #22c55e, #14b8a6)',
      'linear-gradient(90deg, #d4a853, #c0392b)',
    ];

    const emoji = ['☀️', '📅', '📆', '🗓️', '⏳'];

    this.el.innerHTML = `
      <div class="fp-wrap">
        <div class="fp-header">
          <span class="fp-clock" id="fp-clock">${this.getClock()}</span>
        </div>
        ${items.map((item, i) => `
          <div class="fp-row">
            <div class="fp-label">${emoji[i]} ${item.label}</div>
            <div class="fp-bar-wrap">
              <div class="fp-bar" style="width:${Math.min(item.pct, 100).toFixed(1)}%;background:${gradients[i]}">
                <span class="fp-pct">${item.pct.toFixed(1)}%</span>
              </div>
            </div>
            <div class="fp-sub">${item.sub}</div>
          </div>
        `).join('')}
        <div class="fp-footer">
          <span class="fp-countdown">🎆 距 ${p.year + 1} 年还有 <strong>${p.daysToNewYear}</strong> 天</span>
          ${!this.birthday ? '<button class="fp-set" id="fp-set-birth">🎂 设置生日</button>' : '<button class="fp-set" id="fp-set-birth">修改</button>'}
        </div>
      </div>
    `;

    // 实时时钟
    this.startClock();

    // 设置生日
    document.getElementById('fp-set-birth')?.addEventListener('click', () => {
      const input = prompt('输入你的生日（格式：2000-01-01）', this.birthday || '');
      if (input && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
        this.birthday = input;
        localStorage.setItem('fish_birthday', input);
        this.render();
      }
    });
  }

  getClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  startClock() {
    if (this._clockTimer) clearInterval(this._clockTimer);
    this._clockTimer = setInterval(() => {
      const el = document.getElementById('fp-clock');
      if (el) el.textContent = this.getClock();
    }, 1000);
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fp-wrap{max-width:700px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fp-header{text-align:center;margin-bottom:28px}
.fp-clock{font-size:2.8rem;font-weight:800;letter-spacing:4px;color:var(--text,#e8e8e8);font-variant-numeric:tabular-nums;text-shadow:0 0 20px rgba(100,108,255,.3)}
.fp-row{margin-bottom:18px}
.fp-label{font-size:.9rem;font-weight:600;color:var(--text,#e8e8e8);margin-bottom:6px;display:flex;align-items:center;gap:6px}
.fp-bar-wrap{height:28px;background:var(--border,#2a2a3e);border-radius:14px;overflow:hidden;position:relative}
.fp-bar{height:100%;border-radius:14px;transition:width 1.5s cubic-bezier(.4,0,.2,1);display:flex;align-items:center;justify-content:flex-end;padding-right:10px;min-width:50px;position:relative}
.fp-bar::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent 60%,rgba(255,255,255,.15));border-radius:14px}
.fp-pct{font-size:.75rem;font-weight:700;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.4);position:relative;z-index:1}
.fp-sub{font-size:.75rem;color:var(--text-secondary,#888);margin-top:3px}
.fp-footer{display:flex;align-items:center;justify-content:space-between;margin-top:24px;flex-wrap:wrap;gap:10px}
.fp-countdown{font-size:.85rem;color:var(--text-secondary,#888)}
.fp-countdown strong{color:var(--accent,#646cff);font-weight:700}
.fp-set{background:none;border:1px solid var(--border,#2a2a3e);color:var(--text-secondary,#888);padding:4px 14px;border-radius:16px;cursor:pointer;font-size:.8rem;font-family:inherit;transition:all .3s}
.fp-set:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
@media(max-width:480px){
  .fp-clock{font-size:2rem}
  .fp-bar-wrap{height:24px}
  .fp-pct{font-size:.7rem}
}
`;
document.head.appendChild(style);

new FishProgress();
})();
