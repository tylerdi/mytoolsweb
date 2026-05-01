/**
 * 时间胶囊 ⏰💌
 * 给未来的自己写一封信（Supabase 后端版）
 * 用法：<div id="fish-capsule"></div><script src="/fish-capsule.js"></script>
 */

(function () {
  'use strict';

  const API = '/api/capsule';

  function getVisitorId() {
    let id = localStorage.getItem('fish_visitor_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('fish_visitor_id', id);
    }
    return id;
  }

  class FishCapsule {
    constructor() {
      this.container = document.getElementById('fish-capsule');
      if (!this.container) return;
      this.visitorId = getVisitorId();
      this.capsules = [];
      this.loadFromServer();
    }

    async loadFromServer() {
      try {
        const res = await fetch(`${API}?visitor_id=${encodeURIComponent(this.visitorId)}`);
        const json = await res.json();
        if (json.ok) {
          this.capsules = (json.capsules || []).map(c => ({
            id: c.id,
            text: c.content,
            openDate: c.open_date,
            createDate: c.created_at?.slice(0, 10) || '',
            opened: c.is_opened,
          }));
        }
      } catch (e) {
        console.warn('胶囊加载失败，使用本地数据:', e);
        this.capsules = this.loadLocal();
      }
      this.render();
    }

    loadLocal() {
      try { return JSON.parse(localStorage.getItem('fish_capsules')) || []; }
      catch { return []; }
    }

    saveLocal() {
      localStorage.setItem('fish_capsules', JSON.stringify(this.capsules));
    }

    render() {
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);

      // 检查到期（本地标记）
      const opened = [];
      this.capsules.forEach(c => {
        if (!c.opened && c.openDate <= todayKey) {
          c.opened = true;
          opened.push(c);
        }
      });

      const pending = this.capsules.filter(c => !c.opened);
      const openedAll = this.capsules.filter(c => c.opened);

      this.container.innerHTML = `
        <style>
          .cap-widget {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; max-width: 480px; width:100%; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif;
          }
          .cap-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;
            display: flex; align-items: center; gap: 8px; }
          .cap-form { margin-bottom: 20px; }
          .cap-textarea { width: 100%; background: #0a0a0a; border: 1px solid var(--border, #2a2a2a);
            border-radius: 10px; padding: 12px; color: var(--text, #e8e8e8);
            font-size: 0.9rem; font-family: inherit; resize: none;
            min-height: 80px; outline: none; line-height: 1.7; box-sizing: border-box; }
          .cap-textarea:focus { border-color: var(--gold, #d4a853); }
          .cap-textarea::placeholder { color: var(--text-muted, #555); }
          .cap-row { display: flex; gap: 10px; margin-top: 10px; align-items: center; }
          .cap-date { flex: 1; background: #0a0a0a; border: 1px solid var(--border, #2a2a2a);
            border-radius: 8px; padding: 10px 12px; color: var(--text, #e8e8e8);
            font-size: 0.85rem; font-family: inherit; outline: none; }
          .cap-date:focus { border-color: var(--gold, #d4a853); }
          .cap-send { padding: 10px 20px; border-radius: 10px; border: none;
            background: linear-gradient(135deg, var(--gold, #d4a853), #f0d78c);
            color: #000; font-weight: 700; font-size: 0.85rem;
            cursor: pointer; transition: all 0.2s; font-family: inherit; }
          .cap-send:hover { transform: translateY(-1px); }
          .cap-send:disabled { opacity: 0.5; cursor: default; transform: none; }
          .cap-list { margin-top: 16px; }
          .cap-section { font-size: 0.75rem; color: var(--text-dim, #888); margin-bottom: 8px; font-weight: 600; }
          .cap-item { background: #0a0a0a; border: 1px solid var(--border, #2a2a2a);
            border-radius: 10px; padding: 12px; margin-bottom: 8px;
            cursor: pointer; transition: all 0.2s; }
          .cap-item:hover { border-color: var(--gold, #d4a853); }
          .cap-item .date { font-size: 0.75rem; color: var(--gold, #d4a853); margin-bottom: 4px; }
          .cap-item .preview { font-size: 0.85rem; color: var(--text-dim, #888); }
          .cap-item .countdown { font-size: 0.7rem; color: var(--accent, #646cff); margin-top: 4px; }
          .cap-letter { display: none; padding: 16px; background: #0a0a0a;
            border: 1px solid var(--border, #2a2a2a); border-radius: 10px; margin-top: 8px; }
          .cap-letter.show { display: block; animation: capFadeIn 0.4s ease; }
          @keyframes capFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          .cap-letter .text { font-size: 0.9rem; color: var(--text, #e8e8e8); line-height: 1.8; white-space: pre-wrap; }
          .cap-letter .close { text-align: right; margin-top: 8px;
            font-size: 0.75rem; color: var(--text-dim, #888); cursor: pointer; }
          .cap-letter .close:hover { color: var(--text, #e8e8e8); }
          .cap-empty { text-align: center; color: var(--text-muted, #555); padding: 16px; font-size: 0.85rem; }
          .cap-toast { position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, var(--gold, #d4a853), #f0d78c); color: #000;
            padding: 12px 24px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; z-index: 9999;
            box-shadow: 0 8px 30px rgba(212,168,83,0.4); animation: capToastIn 0.4s ease; }
          @keyframes capToastIn { from { opacity:0; transform:translateX(-50%) translateY(-20px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
        
        @media(max-width:480px){
          .cap-widget{padding:16px !important;border-radius:12px !important}
          .cap-widget *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
        <div class="cap-widget">
          <div class="cap-title">⏰ 时间胶囊</div>
          <div class="cap-form">
            <textarea class="cap-textarea" id="cap-text" placeholder="写给未来的自己..." maxlength="500"></textarea>
            <div class="cap-row">
              <input type="date" class="cap-date" id="cap-date" min="${todayKey}" value="${this.getDefaultDate()}">
              <button class="cap-send" id="cap-send-btn" onclick="this.closest('.cap-widget').__send()">💌 封存</button>
            </div>
          </div>
          ${pending.length > 0 ? `
            <div class="cap-list">
              <div class="cap-section">🔒 未到期（${pending.length}）</div>
              ${pending.map(c => `
                <div class="cap-item" onclick="this.closest('.cap-widget').__toggle(${c.id})">
                  <div class="date">📅 ${c.createDate} → ${c.openDate}</div>
                  <div class="preview">${c.text.slice(0, 30)}${c.text.length > 30 ? '...' : ''}</div>
                  <div class="countdown">⏳ 还有 ${this.daysLeft(c.openDate)} 天</div>
                  <div class="cap-letter" id="cap-letter-${c.id}">
                    <div class="text">${c.text}</div>
                    <div class="close" onclick="event.stopPropagation()">收起</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${openedAll.length > 0 ? `
            <div class="cap-list">
              <div class="cap-section">📬 已开启（${openedAll.length}）</div>
              ${openedAll.slice(-3).reverse().map(c => `
                <div class="cap-item" onclick="this.closest('.cap-widget').__toggle(${c.id})">
                  <div class="date">✨ ${c.openDate} 开启</div>
                  <div class="preview">${c.text.slice(0, 30)}${c.text.length > 30 ? '...' : ''}</div>
                  <div class="cap-letter" id="cap-letter-${c.id}">
                    <div class="text">${c.text}</div>
                    <div class="close" onclick="event.stopPropagation()">收起</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${pending.length === 0 && openedAll.length === 0 ? '<div class="cap-empty">还没有时间胶囊，写一封给未来的自己吧 ✨</div>' : ''}
        </div>
      `;

      const widget = this.container.querySelector('.cap-widget');
      widget.__send = () => this.send();
      widget.__toggle = (id) => this.toggle(id);

      // 到期提醒
      for (const c of opened) {
        const toast = document.createElement('div');
        toast.className = 'cap-toast';
        toast.textContent = `💌 时间胶囊到期！「${c.text.slice(0, 15)}...」`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
      }
    }

    getDefaultDate() {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().slice(0, 10);
    }

    daysLeft(openDate) {
      const today = new Date().toISOString().slice(0, 10);
      return Math.max(0, Math.ceil((new Date(openDate) - new Date(today)) / 86400000));
    }

    async send() {
      const text = document.getElementById('cap-text').value.trim();
      const openDate = document.getElementById('cap-date').value;
      if (!text || !openDate) return;

      const btn = document.getElementById('cap-send-btn');
      btn.disabled = true;
      btn.textContent = '封存中...';

      try {
        const res = await fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: this.visitorId,
            content: text,
            open_date: openDate,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          this.capsules.push({
            id: json.capsule?.id || Date.now(),
            text,
            openDate,
            createDate: new Date().toISOString().slice(0, 10),
            opened: false,
          });
          this.saveLocal();
          this.render();
        }
      } catch (e) {
        console.error('封存失败，保存本地:', e);
        this.capsules.push({
          id: Date.now(),
          text,
          openDate,
          createDate: new Date().toISOString().slice(0, 10),
          opened: false,
        });
        this.saveLocal();
        this.render();
      }
    }

    toggle(id) {
      const el = document.getElementById(`cap-letter-${id}`);
      if (el) el.classList.toggle('show');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishCapsule());
  } else {
    new FishCapsule();
  }
})();
