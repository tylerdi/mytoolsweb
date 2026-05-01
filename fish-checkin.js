/**
 * 小鱼儿签到系统 🐟📅
 * 每日签到 + 连续天数 + 成就系统（Supabase 后端版）
 * 用法：<div id="fish-checkin"></div><script src="/fish-checkin.js"></script>
 */

(function () {
  'use strict';

  const API = '/api/checkin';

  const ACHIEVEMENTS = [
    { days: 1, icon: '🌱', name: '初来乍到', desc: '第一次签到' },
    { days: 3, icon: '🌿', name: '三日之约', desc: '连续签到3天' },
    { days: 7, icon: '🌳', name: '一周达人', desc: '连续签到7天' },
    { days: 14, icon: '🌟', name: '两周之星', desc: '连续签到14天' },
    { days: 30, icon: '👑', name: '月度王者', desc: '连续签到30天' },
    { days: 100, icon: '💎', name: '百日传奇', desc: '连续签到100天' },
  ];

  function getVisitorId() {
    let id = localStorage.getItem('fish_visitor_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('fish_visitor_id', id);
    }
    return id;
  }

  class FishCheckin {
    constructor() {
      this.container = document.getElementById('fish-checkin');
      if (!this.container) return;
      this.visitorId = getVisitorId();
      this.todayKey = new Date().toISOString().slice(0, 10);
      this.data = { checked_today: false, streak: 0, total: 0, achievements: [] };
      this.loadFromServer();
    }

    async loadFromServer() {
      try {
        const res = await fetch(`${API}?visitor_id=${encodeURIComponent(this.visitorId)}`);
        const json = await res.json();
        this.data.checked_today = json.checked_today || false;
        this.data.streak = json.streak || 0;
        this.data.total = json.total || 0;
        this.data.achievements = JSON.parse(localStorage.getItem('fish_achievements') || '[]');
        this.syncAchievements();
      } catch (e) {
        console.warn('签到加载失败，使用本地数据:', e);
        this.loadLocalFallback();
      }
      this.render();
    }

    loadLocalFallback() {
      try {
        const raw = localStorage.getItem('fish_checkin');
        if (raw) {
          const local = JSON.parse(raw);
          this.data.streak = local.streak || 0;
          this.data.total = local.total || 0;
          this.data.achievements = local.achievements || [];
          this.data.checked_today = local.lastDate === this.todayKey;
        }
      } catch {}
    }

    syncAchievements() {
      for (const a of ACHIEVEMENTS) {
        if (this.data.streak >= a.days && !this.data.achievements.includes(a.days)) {
          this.data.achievements.push(a.days);
        }
      }
      localStorage.setItem('fish_achievements', JSON.stringify(this.data.achievements));
    }

    async doCheckin() {
      if (this.data.checked_today) return;
      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitor_id: this.visitorId }),
        });
        const json = await res.json();
        if (json.ok) {
          this.data.checked_today = true;
          this.data.streak = json.streak || this.data.streak + 1;
          if (json.total) this.data.total = json.total;
          const newAchievements = [];
          for (const a of ACHIEVEMENTS) {
            if (this.data.streak >= a.days && !this.data.achievements.includes(a.days)) {
              this.data.achievements.push(a.days);
              newAchievements.push(a);
            }
          }
          localStorage.setItem('fish_achievements', JSON.stringify(this.data.achievements));
          localStorage.setItem('fish_checkin', JSON.stringify({
            lastDate: this.todayKey, streak: this.data.streak,
            total: this.data.total, achievements: this.data.achievements,
          }));
          this.render(newAchievements);
        }
      } catch (e) {
        console.error('签到失败，降级本地:', e);
        this.doCheckinLocal();
      }
    }

    doCheckinLocal() {
      this.data.streak += 1;
      this.data.total += 1;
      this.data.checked_today = true;
      const newAchievements = [];
      for (const a of ACHIEVEMENTS) {
        if (this.data.streak >= a.days && !this.data.achievements.includes(a.days)) {
          this.data.achievements.push(a.days);
          newAchievements.push(a);
        }
      }
      localStorage.setItem('fish_checkin', JSON.stringify({
        lastDate: this.todayKey, streak: this.data.streak,
        total: this.data.total, achievements: this.data.achievements,
      }));
      localStorage.setItem('fish_achievements', JSON.stringify(this.data.achievements));
      this.render(newAchievements);
    }

    render(newAchievements = []) {
      const { streak, total, checked_today } = this.data;
      const achievements = this.data.achievements;
      const nextAch = ACHIEVEMENTS.find(a => a.days > streak);
      const prevAch = [...ACHIEVEMENTS].reverse().find(a => a.days <= streak);
      const progress = nextAch ? ((streak - (prevAch?.days || 0)) / (nextAch.days - (prevAch?.days || 0))) * 100 : 100;
      const fishStage = streak < 3 ? '🐟' : streak < 7 ? '🐠' : streak < 14 ? '🐬' : streak < 30 ? '🐋' : '🐉';
      const fishSize = Math.min(1.5 + streak * 0.02, 2.5);

      this.container.innerHTML = `
        <style>
          .fc-widget {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; max-width: 480px; width:100%; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif; text-align: center;
          }
          .fc-fish { font-size: ${fishSize}rem; margin-bottom: 12px; display: inline-block;
            animation: ${checked_today ? 'fcCelebrate 0.6s ease' : 'fcFloat 3s ease-in-out infinite'}; }
          @keyframes fcFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
          @keyframes fcCelebrate { 0%{transform:scale(1)} 50%{transform:scale(1.3) rotate(10deg)} 100%{transform:scale(1)} }
          .fc-streak { font-size: 2rem; font-weight: 900; color: var(--gold, #d4a853); margin-bottom: 4px; }
          .fc-label { font-size: 0.8rem; color: var(--text-dim, #888); margin-bottom: 16px; }
          .fc-btn { width: 100%; padding: 14px; border-radius: 12px; border: none;
            font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.25s; font-family: inherit; }
          .fc-btn.active { background: linear-gradient(135deg, var(--accent, #646cff), var(--pink, #ff6b9d));
            color: #fff; box-shadow: 0 4px 20px var(--accent-glow, rgba(100,108,255,0.3)); }
          .fc-btn.active:hover { transform: translateY(-2px); }
          .fc-btn.done { background: rgba(34,197,94,0.1); color: var(--green, #22c55e);
            border: 1px solid rgba(34,197,94,0.2); cursor: default; }
          .fc-progress { margin: 16px 0; }
          .fc-progress-bar { height: 6px; background: var(--border, #2a2a2a); border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
          .fc-progress-fill { height: 100%; border-radius: 3px;
            background: linear-gradient(90deg, var(--accent, #646cff), var(--gold, #d4a853)); transition: width 0.6s ease; }
          .fc-progress-text { font-size: 0.75rem; color: var(--text-dim, #888); }
          .fc-stats { display: flex; justify-content: center; gap: 24px; margin-top: 16px; }
          .fc-stat .num { font-size: 1.2rem; font-weight: 900; color: var(--text, #e8e8e8); }
          .fc-stat .label { font-size: 0.7rem; color: var(--text-dim, #888); }
          .fc-achievements { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border, #2a2a2a); }
          .fc-ach-title { font-size: 0.75rem; color: var(--text-dim, #888); margin-bottom: 8px; }
          .fc-ach-list { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
          .fc-ach { font-size: 1.2rem; position: relative; cursor: default; }
          .fc-ach:hover::after { content: attr(data-name); position: absolute; bottom: 120%; left: 50%;
            transform: translateX(-50%); background: #222; color: #fff; font-size: 0.65rem;
            padding: 3px 8px; border-radius: 6px; white-space: nowrap; pointer-events: none; }
          .fc-ach.locked { opacity: 0.2; filter: grayscale(1); }
          .fc-ach-new { animation: fcAchPop 0.5s ease; }
          @keyframes fcAchPop { 0%{transform:scale(0)} 50%{transform:scale(1.5)} 100%{transform:scale(1)} }
          .fc-toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, var(--gold, #d4a853), #f0d78c); color: #000;
            padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; z-index: 9999;
            box-shadow: 0 8px 30px rgba(212,168,83,0.4); animation: fcToastIn 0.4s ease, fcToastOut 0.4s ease 2.6s forwards; }
          @keyframes fcToastIn { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
          @keyframes fcToastOut { to { opacity:0; transform:translateX(-50%) translateY(-20px); } }
        
        @media(max-width:480px){
          .fc-widget{padding:16px !important;border-radius:12px !important}
          .fc-widget *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
        <div class="fc-widget">
          <div class="fc-fish">${fishStage}</div>
          <div class="fc-streak">${streak}</div>
          <div class="fc-label">连续签到天数</div>
          ${checked_today
            ? `<button class="fc-btn done">✅ 今日已签到</button>`
            : `<button class="fc-btn active" onclick="this.closest('.fc-widget').__checkin()">🎯 立即签到</button>`}
          ${nextAch ? `
            <div class="fc-progress">
              <div class="fc-progress-bar"><div class="fc-progress-fill" style="width:${progress}%"></div></div>
              <div class="fc-progress-text">距「${nextAch.icon} ${nextAch.name}」还差 ${nextAch.days - streak} 天</div>
            </div>
          ` : '<div class="fc-progress-text" style="margin-top:12px;color:var(--gold,#d4a853)">🏆 所有成就已解锁！</div>'}
          <div class="fc-stats">
            <div class="fc-stat"><div class="num">${total}</div><div class="label">累计签到</div></div>
            <div class="fc-stat"><div class="num">${achievements.length}</div><div class="label">成就解锁</div></div>
          </div>
          <div class="fc-achievements">
            <div class="fc-ach-title">🏅 成就</div>
            <div class="fc-ach-list">
              ${ACHIEVEMENTS.map(a => {
                const unlocked = achievements.includes(a.days);
                const isNew = newAchievements.some(na => na.days === a.days);
                return `<span class="fc-ach ${unlocked ? '' : 'locked'} ${isNew ? 'fc-ach-new' : ''}" data-name="${a.name}">${a.icon}</span>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;

      this.container.querySelector('.fc-widget').__checkin = () => this.doCheckin();

      for (const a of newAchievements) {
        const toast = document.createElement('div');
        toast.className = 'fc-toast';
        toast.textContent = `🏅 解锁成就：${a.icon} ${a.name}`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishCheckin());
  } else {
    new FishCheckin();
  }
})();
