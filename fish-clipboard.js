/**
 * 小鱼儿 剪贴板管理 🐟📋
 * 快速文本片段存储 + 一键复制
 * 用法：<div id="fish-clipboard"></div><script src="/fish-clipboard.js"></script>
 */
(function(){
'use strict';

const STORAGE_KEY = 'fish_clipboard';
const MAX_ITEMS = 50;

const TEMPLATES = [
  { name: '📧 邮箱', text: 'your@email.com' },
  { name: '📱 手机', text: '13800138000' },
  { name: '🔗 GitHub', text: 'https://github.com/' },
  { name: '💻 代码块', text: '```\n\n```' },
  { name: '📝 待办', text: '- [ ] ' },
  { name: '📅 日期', text: new Date().toISOString().slice(0, 10) },
];

class FishClipboard {
  constructor() {
    this.el = document.getElementById('fish-clipboard');
    if (!this.el) return;
    this.items = this.load();
    this.render();
  }

  load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
  }

  add(text, name) {
    if (!text.trim()) return;
    const item = {
      id: Date.now().toString(36),
      text: text.trim(),
      name: name || this.autoName(text.trim()),
      created: Date.now(),
      copied: 0,
    };
    this.items.unshift(item);
    if (this.items.length > MAX_ITEMS) this.items = this.items.slice(0, MAX_ITEMS);
    this.save();
    this.render();
  }

  remove(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.save();
    this.render();
  }

  copy(id) {
    const item = this.items.find(i => i.id === id);
    if (!item) return;
    navigator.clipboard.writeText(item.text).then(() => {
      item.copied++;
      item.lastCopied = Date.now();
      this.save();
      this.render();
      // 高亮反馈
      const el = document.querySelector(`[data-copy-id="${id}"]`);
      if (el) {
        el.textContent = '✅';
        setTimeout(() => el.textContent = '📋', 1500);
      }
    });
  }

  autoName(text) {
    if (text.startsWith('http')) return '🔗 链接';
    if (text.includes('@') && text.includes('.')) return '📧 邮箱';
    if (/^\d{11}$/.test(text)) return '📱 手机';
    if (text.length <= 20) return text;
    return text.slice(0, 20) + '...';
  }

  render() {
    this.el.innerHTML = `
      <div class="fcb-wrap">
        <div class="fcb-add-row">
          <input class="fcb-input" id="fcb-input" placeholder="输入文本片段..." />
          <input class="fcb-name-input" id="fcb-name" placeholder="名称(可选)" />
          <button class="fcb-add-btn" id="fcb-add">＋ 保存</button>
        </div>

        <div class="fcb-templates">
          ${TEMPLATES.map(t => `<button class="fcb-tpl" data-text="${this.escape(t.text)}">${t.name}</button>`).join('')}
        </div>

        ${this.items.length === 0 ? `
          <div class="fcb-empty">
            <span>📋</span>
            <p>还没有保存的片段</p>
          </div>
        ` : `
          <div class="fcb-list">
            ${this.items.map(item => `
              <div class="fcb-item">
                <div class="fcb-item-head">
                  <span class="fcb-item-name">${this.escape(item.name)}</span>
                  <span class="fcb-item-meta">${this.formatTime(item.created)}${item.copied > 0 ? ` · 复制${item.copied}次` : ''}</span>
                </div>
                <div class="fcb-item-text">${this.escape(item.text)}</div>
                <div class="fcb-item-actions">
                  <button class="fcb-action" data-copy-id="${item.id}" data-action="copy" title="复制">📋</button>
                  <button class="fcb-action" data-action="delete" data-id="${item.id}" title="删除">🗑️</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    const input = document.getElementById('fcb-input');
    const nameInput = document.getElementById('fcb-name');

    document.getElementById('fcb-add').addEventListener('click', () => {
      this.add(input.value, nameInput.value);
      input.value = '';
      nameInput.value = '';
      input.focus();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        this.add(input.value, nameInput.value);
        input.value = '';
        nameInput.value = '';
      }
    });

    this.el.querySelectorAll('.fcb-tpl').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.text;
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✅ 已复制';
          setTimeout(() => btn.textContent = btn.dataset.text ? TEMPLATES.find(t => t.text === text)?.name || btn.textContent : btn.textContent, 1500);
        });
      });
    });

    this.el.querySelectorAll('.fcb-action').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.action === 'copy') this.copy(btn.dataset.copyId);
        else if (btn.dataset.action === 'delete') this.remove(btn.dataset.id);
      });
    });
  }

  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (now - d < 86400000) return '今天';
    if (now - d < 172800000) return '昨天';
    return `${d.getMonth()+1}/${d.getDate()}`;
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

const style = document.createElement('style');
style.textContent = `
.fcb-wrap{max-width:600px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fcb-add-row{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}
.fcb-input{flex:2;min-width:120px;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:10px;padding:10px 14px;color:var(--text,#e8e8e8);font-size:.85rem;font-family:inherit;outline:none;transition:border-color .3s}
.fcb-input:focus{border-color:var(--accent,#646cff)}
.fcb-input::placeholder{color:var(--text-secondary,#666)}
.fcb-name-input{flex:1;min-width:80px;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:10px;padding:10px 14px;color:var(--text,#e8e8e8);font-size:.85rem;font-family:inherit;outline:none;transition:border-color .3s}
.fcb-name-input:focus{border-color:var(--accent,#646cff)}
.fcb-name-input::placeholder{color:var(--text-secondary,#666)}
.fcb-add-btn{background:var(--accent,#646cff);color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:.85rem;cursor:pointer;font-family:inherit;transition:all .3s;white-space:nowrap}
.fcb-add-btn:hover{filter:brightness(1.1)}
.fcb-templates{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.fcb-tpl{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:16px;padding:5px 12px;color:var(--text-secondary,#888);font-size:.75rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fcb-tpl:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
.fcb-empty{text-align:center;padding:40px 20px;color:var(--text-secondary,#666)}
.fcb-empty span{font-size:2.5rem;display:block;margin-bottom:8px;opacity:.4}
.fcb-empty p{font-size:.85rem}
.fcb-list{display:flex;flex-direction:column;gap:8px}
.fcb-item{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 14px;transition:all .3s}
.fcb-item:hover{border-color:rgba(100,108,255,.3)}
.fcb-item-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
.fcb-item-name{font-size:.8rem;font-weight:700;color:var(--text,#e8e8e8)}
.fcb-item-meta{font-size:.65rem;color:var(--text-secondary,#666)}
.fcb-item-text{font-size:.8rem;color:var(--text-secondary,#aaa);line-height:1.6;word-break:break-all;max-height:80px;overflow:hidden;white-space:pre-wrap;font-family:'Courier New',monospace}
.fcb-item-actions{display:flex;gap:6px;margin-top:8px;justify-content:flex-end}
.fcb-action{background:none;border:none;cursor:pointer;font-size:.85rem;opacity:.5;transition:all .2s;padding:4px 8px;border-radius:6px}
.fcb-action:hover{opacity:1;background:rgba(255,255,255,.05);transform:scale(1.15)}
`;
document.head.appendChild(style);

new FishClipboard();
})();
