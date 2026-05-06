/**
 * 小鱼儿 备忘录 🐟📝
 * 本地存储的便签/待办工具
 * 用法：<div id="fish-memo"></div><script src="/fish-memo.js"></script>
 */
(function(){
'use strict';

const STORAGE_KEY = 'fish_memos';
const MAX_MEMOS = 200;

class FishMemo {
  constructor() {
    this.el = document.getElementById('fish-memo');
    if (!this.el) return;
    this.memos = this.load();
    this.filter = 'all'; // all | pinned | done
    this.search = '';
    this.render();
  }

  load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memos));
  }

  add(text) {
    if (!text.trim() || this.memos.length >= MAX_MEMOS) return;
    this.memos.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text: text.trim(),
      done: false,
      pinned: false,
      color: this.randomColor(),
      created: Date.now(),
    });
    this.save();
    this.render();
  }

  toggle(id) {
    const m = this.memos.find(m => m.id === id);
    if (m) { m.done = !m.done; this.save(); this.render(); }
  }

  pin(id) {
    const m = this.memos.find(m => m.id === id);
    if (m) { m.pinned = !m.pinned; this.save(); this.render(); }
  }

  remove(id) {
    this.memos = this.memos.filter(m => m.id !== id);
    this.save();
    this.render();
  }

  edit(id, newText) {
    const m = this.memos.find(m => m.id === id);
    if (m && newText.trim()) { m.text = newText.trim(); this.save(); this.render(); }
  }

  clearDone() {
    this.memos = this.memos.filter(m => !m.done);
    this.save();
    this.render();
  }

  randomColor() {
    const colors = ['#646cff','#22c55e','#f59e0b','#ef4444','#ec4899','#8b5cf6','#06b6d4','#f97316'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getFiltered() {
    let list = [...this.memos];
    if (this.filter === 'pinned') list = list.filter(m => m.pinned);
    if (this.filter === 'done') list = list.filter(m => m.done);
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(m => m.text.toLowerCase().includes(q));
    }
    // 置顶优先，然后按时间倒序
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.created - a.created;
    });
    return list;
  }

  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
    if (diff < 172800000) return '昨天';
    return `${d.getMonth()+1}/${d.getDate()}`;
  }

  render() {
    const list = this.getFiltered();
    const total = this.memos.length;
    const doneCount = this.memos.filter(m => m.done).length;
    const pinnedCount = this.memos.filter(m => m.pinned).length;

    this.el.innerHTML = `
      <div class="fm-wrap">
        <div class="fm-input-row">
          <input class="fm-input" id="fm-input" placeholder="写点什么..." maxlength="500" autocomplete="off" />
          <button class="fm-add" id="fm-add">＋</button>
        </div>

        <div class="fm-toolbar">
          <div class="fm-tabs">
            <button class="fm-tab ${this.filter==='all'?'active':''}" data-f="all">全部 <span>${total}</span></button>
            <button class="fm-tab ${this.filter==='pinned'?'active':''}" data-f="pinned">📌 置顶 <span>${pinnedCount}</span></button>
            <button class="fm-tab ${this.filter==='done'?'active':''}" data-f="done">✅ 已完成 <span>${doneCount}</span></button>
          </div>
          <div class="fm-actions">
            <input class="fm-search" id="fm-search" placeholder="🔍 搜索..." value="${this.search}" />
            ${doneCount > 0 ? '<button class="fm-clear" id="fm-clear">清除已完成</button>' : ''}
          </div>
        </div>

        <div class="fm-list" id="fm-list">
          ${list.length === 0 ? `
            <div class="fm-empty">
              <span class="fm-empty-icon">📝</span>
              <p>${this.search ? '没有找到匹配的备忘录' : this.filter === 'done' ? '还没有已完成的备忘录' : '写点什么开始吧'}</p>
            </div>
          ` : list.map(m => `
            <div class="fm-card ${m.done ? 'done' : ''} ${m.pinned ? 'pinned' : ''}" data-id="${m.id}">
              <div class="fm-card-stripe" style="background:${m.color}"></div>
              <div class="fm-card-body">
                <div class="fm-card-text" ${m.done ? '' : 'contenteditable="true"'} data-id="${m.id}">${this.escape(m.text)}</div>
                <div class="fm-card-meta">
                  <span class="fm-time">${this.formatTime(m.created)}</span>
                  <div class="fm-card-btns">
                    <button class="fm-btn" data-action="toggle" data-id="${m.id}" title="${m.done ? '恢复' : '完成'}">${m.done ? '↩️' : '✅'}</button>
                    <button class="fm-btn" data-action="pin" data-id="${m.id}" title="${m.pinned ? '取消置顶' : '置顶'}">${m.pinned ? '📌' : '📍'}</button>
                    <button class="fm-btn" data-action="delete" data-id="${m.id}" title="删除">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  bindEvents() {
    const input = document.getElementById('fm-input');
    const addBtn = document.getElementById('fm-add');
    const searchInput = document.getElementById('fm-search');

    // 添加
    const doAdd = () => { this.add(input.value); input.value = ''; input.focus(); };
    addBtn.addEventListener('click', doAdd);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') doAdd(); });

    // 搜索
    searchInput.addEventListener('input', e => {
      this.search = e.target.value;
      this.render();
      // 恢复焦点到搜索框
      const si = document.getElementById('fm-search');
      if (si) { si.focus(); si.setSelectionRange(si.value.length, si.value.length); }
    });

    // 筛选标签
    this.el.querySelectorAll('.fm-tab').forEach(tab => {
      tab.addEventListener('click', () => { this.filter = tab.dataset.f; this.render(); });
    });

    // 清除已完成
    document.getElementById('fm-clear')?.addEventListener('click', () => {
      if (confirm('清除所有已完成的备忘录？')) this.clearDone();
    });

    // 卡片操作
    this.el.querySelectorAll('.fm-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const { action, id } = btn.dataset;
        if (action === 'toggle') this.toggle(id);
        else if (action === 'pin') this.pin(id);
        else if (action === 'delete') this.remove(id);
      });
    });

    // 内容编辑（失焦保存）
    this.el.querySelectorAll('.fm-card-text[contenteditable]').forEach(el => {
      el.addEventListener('blur', () => {
        const id = el.dataset.id;
        const newText = el.textContent.trim();
        if (newText) this.edit(id, newText);
        else this.render();
      });
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
    });
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fm-wrap{max-width:700px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fm-input-row{display:flex;gap:10px;margin-bottom:16px}
.fm-input{flex:1;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 16px;color:var(--text,#e8e8e8);font-size:.95rem;font-family:inherit;outline:none;transition:border-color .3s}
.fm-input:focus{border-color:var(--accent,#646cff)}
.fm-input::placeholder{color:var(--text-secondary,#666)}
.fm-add{background:var(--accent,#646cff);color:#fff;border:none;border-radius:12px;width:48px;font-size:1.3rem;cursor:pointer;transition:all .3s;font-family:inherit}
.fm-add:hover{transform:scale(1.05);filter:brightness(1.1)}
.fm-toolbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px}
.fm-tabs{display:flex;gap:4px}
.fm-tab{background:none;border:1px solid transparent;color:var(--text-secondary,#888);padding:6px 12px;border-radius:20px;cursor:pointer;font-size:.8rem;font-family:inherit;transition:all .3s;display:flex;align-items:center;gap:4px}
.fm-tab span{opacity:.5;font-size:.7rem}
.fm-tab.active{background:var(--surface,#1a1a2e);border-color:var(--border,#2a2a3e);color:var(--text,#e8e8e8)}
.fm-tab.active span{opacity:1}
.fm-actions{display:flex;gap:8px;align-items:center}
.fm-search{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:20px;padding:6px 14px;color:var(--text,#e8e8e8);font-size:.8rem;font-family:inherit;outline:none;width:140px;transition:all .3s}
.fm-search:focus{border-color:var(--accent,#646cff);width:180px}
.fm-clear{background:none;border:1px solid #ef4444;color:#ef4444;padding:5px 12px;border-radius:20px;cursor:pointer;font-size:.75rem;font-family:inherit;transition:all .3s}
.fm-clear:hover{background:#ef4444;color:#fff}
.fm-list{display:flex;flex-direction:column;gap:10px}
.fm-card{display:flex;border-radius:12px;overflow:hidden;background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);transition:all .3s;animation:fmSlideIn .3s ease}
.fm-card:hover{border-color:rgba(100,108,255,.3);transform:translateX(4px)}
.fm-card.done{opacity:.6}
.fm-card.done .fm-card-text{text-decoration:line-through;color:var(--text-secondary,#888)}
.fm-card.pinned{border-color:var(--accent,#646cff);box-shadow:0 0 0 1px rgba(100,108,255,.1)}
.fm-card-stripe{width:4px;flex-shrink:0}
.fm-card-body{flex:1;padding:12px 14px;min-width:0}
.fm-card-text{font-size:.9rem;line-height:1.6;color:var(--text,#e8e8e8);word-break:break-word;outline:none;min-height:1.6em}
.fm-card-text:focus{background:rgba(100,108,255,.05);border-radius:4px;padding:2px 4px;margin:-2px -4px}
.fm-card-meta{display:flex;justify-content:space-between;align-items:center;margin-top:8px}
.fm-time{font-size:.7rem;color:var(--text-secondary,#666)}
.fm-card-btns{display:flex;gap:4px}
.fm-btn{background:none;border:none;cursor:pointer;font-size:.85rem;padding:4px;border-radius:6px;transition:all .2s;opacity:.5}
.fm-btn:hover{opacity:1;background:rgba(255,255,255,.05);transform:scale(1.15)}
.fm-empty{text-align:center;padding:40px 20px;color:var(--text-secondary,#666)}
.fm-empty-icon{font-size:2.5rem;display:block;margin-bottom:12px;opacity:.4}
.fm-empty p{font-size:.9rem}
@keyframes fmSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:480px){
  .fm-toolbar{flex-direction:column;align-items:stretch}
  .fm-actions{justify-content:space-between}
  .fm-search{width:100%;flex:1}
  .fm-search:focus{width:100%}
}
`;
document.head.appendChild(style);

new FishMemo();
})();
