/**
 * 小鱼儿 倒计时 🐟⏰
 * 倒数重要日子
 * 用法：<div id="fish-countdown"></div><script src="/fish-countdown.js"></script>
 */
(function(){
'use strict';

const STORAGE_KEY = 'fish_countdowns';

const PRESETS = [
  { name: '元旦', emoji: '🎆', month: 1, day: 1 },
  { name: '春节', emoji: '🧧', month: 1, day: 29 }, // 2027
  { name: '情人节', emoji: '💝', month: 2, day: 14 },
  { name: '劳动节', emoji: '🔨', month: 5, day: 1 },
  { name: '端午节', emoji: '🐲', month: 5, day: 31 },
  { name: '中秋节', emoji: '🥮', month: 10, day: 6 },
  { name: '国庆节', emoji: '🇨🇳', month: 10, day: 1 },
  { name: '圣诞节', emoji: '🎄', month: 12, day: 25 },
];

class FishCountdown {
  constructor() {
    this.el = document.getElementById('fish-countdown');
    if (!this.el) return;
    this.events = this.load();
    this.editing = false;
    this.render();
    this.startTimer();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.length) return saved;
    } catch {}
    // 默认事件
    return [
      { id: '1', name: '元旦', emoji: '🎆', date: this.nextDate(1, 1), color: '#f59e0b' },
      { id: '2', name: '春节', emoji: '🧧', date: '2027-01-29', color: '#ef4444' },
      { id: '3', name: '国庆节', emoji: '🇨🇳', date: this.nextDate(10, 1), color: '#ec4899' },
    ];
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.events));
  }

  nextDate(month, day) {
    const now = new Date();
    const year = (now.getMonth() + 1 > month || (now.getMonth() + 1 === month && now.getDate() >= day))
      ? now.getFullYear() + 1 : now.getFullYear();
    return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  }

  addEvent(name, emoji, date, color) {
    this.events.push({
      id: Date.now().toString(36),
      name, emoji, date, color: color || this.randomColor(),
    });
    this.save();
    this.render();
  }

  removeEvent(id) {
    this.events = this.events.filter(e => e.id !== id);
    this.save();
    this.render();
  }

  randomColor() {
    const c = ['#646cff','#22c55e','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#f97316'];
    return c[Math.floor(Math.random() * c.length)];
  }

  getDiff(dateStr) {
    const target = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diff = target - now;
    if (diff <= 0) return { days: 0, hours: 0, mins: 0, secs: 0, passed: true };
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return { days, hours, mins, secs, passed: false };
  }

  render() {
    // 按日期排序，最近的在前
    const sorted = [...this.events].sort((a, b) => new Date(a.date) - new Date(b.date));

    this.el.innerHTML = `
      <div class="fc-wrap">
        <div class="fc-grid">
          ${sorted.map(ev => {
            const d = this.getDiff(ev.date);
            const dateObj = new Date(ev.date + 'T00:00:00');
            const dateStr = `${dateObj.getMonth()+1}月${dateObj.getDate()}日`;
            return `
              <div class="fc-card" style="--c:${ev.color}">
                <div class="fc-emoji">${ev.emoji}</div>
                <div class="fc-name">${ev.name}</div>
                <div class="fc-date">${dateStr}</div>
                ${d.passed ? `
                  <div class="fc-passed">🎉 已过</div>
                ` : `
                  <div class="fc-nums">
                    <div class="fc-num-box">
                      <span class="fc-num" data-id="${ev.id}" data-field="days">${d.days}</span>
                      <span class="fc-num-label">天</span>
                    </div>
                    <div class="fc-num-box">
                      <span class="fc-num" data-id="${ev.id}" data-field="hours">${String(d.hours).padStart(2,'0')}</span>
                      <span class="fc-num-label">时</span>
                    </div>
                    <div class="fc-num-box">
                      <span class="fc-num" data-id="${ev.id}" data-field="mins">${String(d.mins).padStart(2,'0')}</span>
                      <span class="fc-num-label">分</span>
                    </div>
                    <div class="fc-num-box">
                      <span class="fc-num" data-id="${ev.id}" data-field="secs">${String(d.secs).padStart(2,'0')}</span>
                      <span class="fc-num-label">秒</span>
                    </div>
                  </div>
                `}
                <button class="fc-del" data-id="${ev.id}" title="删除">×</button>
              </div>
            `;
          }).join('')}
        </div>

        <div class="fc-add-area">
          <button class="fc-add-btn" id="fc-add-btn">＋ 添加倒计时</button>
          <div class="fc-add-form" id="fc-add-form" style="display:none">
            <div class="fc-form-row">
              <input class="fc-form-input" id="fc-emoji" placeholder="emoji" maxlength="4" style="width:60px;text-align:center" />
              <input class="fc-form-input" id="fc-name" placeholder="事件名称" maxlength="20" />
              <input class="fc-form-input" id="fc-date" type="date" />
              <button class="fc-form-submit" id="fc-submit">确定</button>
            </div>
            <div class="fc-presets">
              ${PRESETS.map(p => `<button class="fc-preset" data-name="${p.name}" data-emoji="${p.emoji}" data-month="${p.month}" data-day="${p.day}">${p.emoji} ${p.name}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 删除
    this.el.querySelectorAll('.fc-del').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.removeEvent(btn.dataset.id);
      });
    });

    // 添加按钮
    const addBtn = document.getElementById('fc-add-btn');
    const form = document.getElementById('fc-add-form');
    addBtn.addEventListener('click', () => {
      form.style.display = form.style.display === 'none' ? 'block' : 'none';
      addBtn.style.display = form.style.display === 'none' ? '' : 'none';
    });

    // 预设
    this.el.querySelectorAll('.fc-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const { name, emoji, month, day } = btn.dataset;
        this.addEvent(name, emoji, this.nextDate(+month, +day));
        form.style.display = 'none';
        addBtn.style.display = '';
      });
    });

    // 自定义添加
    document.getElementById('fc-submit').addEventListener('click', () => {
      const emoji = document.getElementById('fc-emoji').value || '📌';
      const name = document.getElementById('fc-name').value;
      const date = document.getElementById('fc-date').value;
      if (!name || !date) return alert('请填写名称和日期');
      this.addEvent(name, emoji, date);
      form.style.display = 'none';
      addBtn.style.display = '';
    });
  }

  startTimer() {
    setInterval(() => {
      this.events.forEach(ev => {
        const d = this.getDiff(ev.date);
        if (d.passed) return;
        ['days','hours','mins','secs'].forEach(field => {
          const el = this.el.querySelector(`.fc-num[data-id="${ev.id}"][data-field="${field}"]`);
          if (el) {
            const val = field === 'days' ? d.days : String(d[field]).padStart(2, '0');
            if (el.textContent !== String(val)) el.textContent = val;
          }
        });
      });
    }, 1000);
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fc-wrap{max-width:800px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:24px}
.fc-card{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:16px;padding:20px;text-align:center;position:relative;transition:all .3s;overflow:hidden}
.fc-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--c);opacity:.6}
.fc-card:hover{border-color:var(--c);transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.fc-card:hover::before{opacity:1}
.fc-emoji{font-size:2rem;margin-bottom:8px}
.fc-name{font-size:1rem;font-weight:700;color:var(--text,#e8e8e8);margin-bottom:2px}
.fc-date{font-size:.75rem;color:var(--text-secondary,#888);margin-bottom:12px}
.fc-nums{display:flex;justify-content:center;gap:8px}
.fc-num-box{display:flex;flex-direction:column;align-items:center}
.fc-num{font-size:1.6rem;font-weight:800;color:var(--c);font-variant-numeric:tabular-nums;min-width:2ch;line-height:1.2}
.fc-num-label{font-size:.65rem;color:var(--text-secondary,#888);margin-top:2px}
.fc-passed{font-size:1.2rem;color:var(--text-secondary,#888);padding:10px 0}
.fc-del{position:absolute;top:8px;right:10px;background:none;border:none;color:var(--text-secondary,#666);font-size:1.1rem;cursor:pointer;opacity:0;transition:all .3s;padding:4px 8px;border-radius:6px}
.fc-card:hover .fc-del{opacity:1}
.fc-del:hover{color:#ef4444;background:rgba(239,68,68,.1)}
.fc-add-area{text-align:center}
.fc-add-btn{background:var(--surface,#1a1a2e);border:2px dashed var(--border,#2a2a3e);border-radius:16px;padding:20px;width:100%;color:var(--text-secondary,#888);font-size:.95rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fc-add-btn:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
.fc-add-form{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:16px;padding:20px;margin-top:12px}
.fc-form-row{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.fc-form-input{background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a3e);border-radius:10px;padding:10px 12px;color:var(--text,#e8e8e8);font-size:.85rem;font-family:inherit;outline:none;flex:1;min-width:0;transition:border-color .3s}
.fc-form-input:focus{border-color:var(--accent,#646cff)}
.fc-form-submit{background:var(--accent,#646cff);color:#fff;border:none;border-radius:10px;padding:10px 20px;cursor:pointer;font-family:inherit;font-size:.85rem;transition:all .3s}
.fc-form-submit:hover{filter:brightness(1.1)}
.fc-presets{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.fc-preset{background:none;border:1px solid var(--border,#2a2a3e);border-radius:20px;padding:5px 12px;color:var(--text-secondary,#888);font-size:.75rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fc-preset:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
@media(max-width:480px){
  .fc-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
  .fc-num{font-size:1.3rem}
}
`;
document.head.appendChild(style);

new FishCountdown();
})();
