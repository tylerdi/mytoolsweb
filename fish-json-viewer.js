/**
 * 小鱼儿 JSON 可视化 🐟📊
 * JSON 格式化 + 语法高亮 + 折叠展开
 * 用法：<div id="fish-json-viewer"></div><script src="/fish-json-viewer.js"></script>
 */
(function(){
'use strict';

class FishJsonViewer {
  constructor() {
    this.el = document.getElementById('fish-json-viewer');
    if (!this.el) return;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="fjv-wrap">
        <div class="fjv-input-area">
          <div class="fjv-toolbar">
            <button class="fjv-btn" id="fjv-format">✨ 格式化</button>
            <button class="fjv-btn fjv-secondary" id="fjv-minify">📦 压缩</button>
            <button class="fjv-btn fjv-secondary" id="fjv-copy">📋 复制</button>
            <button class="fjv-btn fjv-secondary" id="fjv-clear">🗑️ 清空</button>
            <div class="fjv-indent">
              <label>缩进</label>
              <select id="fjv-indent">
                <option value="2" selected>2空格</option>
                <option value="4">4空格</option>
                <option value="tab">Tab</option>
              </select>
            </div>
          </div>
          <textarea class="fjv-textarea" id="fjv-input" placeholder='粘贴 JSON，例如：{"name":"小鱼儿","age":1}' rows="8"></textarea>
        </div>
        <div class="fjv-output" id="fjv-output">
          <div class="fjv-empty">输入 JSON 后点击「格式化」</div>
        </div>
        <div class="fjv-info" id="fjv-info" style="display:none"></div>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('fjv-format').addEventListener('click', () => this.format());
    document.getElementById('fjv-minify').addEventListener('click', () => this.minify());
    document.getElementById('fjv-copy').addEventListener('click', () => this.copy());
    document.getElementById('fjv-clear').addEventListener('click', () => {
      document.getElementById('fjv-input').value = '';
      document.getElementById('fjv-output').innerHTML = '<div class="fjv-empty">输入 JSON 后点击「格式化」</div>';
      document.getElementById('fjv-info').style.display = 'none';
    });
  }

  getIndent() {
    const sel = document.getElementById('fjv-indent').value;
    return sel === 'tab' ? '\t' : parseInt(sel);
  }

  format() {
    const input = document.getElementById('fjv-input').value.trim();
    if (!input) return;
    try {
      const obj = JSON.parse(input);
      const indent = this.getIndent();
      const formatted = JSON.stringify(obj, null, indent);
      document.getElementById('fjv-input').value = formatted;
      this.renderTree(obj);
      this.showInfo(obj);
    } catch (e) {
      document.getElementById('fjv-output').innerHTML = `<div class="fjv-error">❌ JSON 解析错误：${this.escape(e.message)}</div>`;
      document.getElementById('fjv-info').style.display = 'none';
    }
  }

  minify() {
    const input = document.getElementById('fjv-input').value.trim();
    if (!input) return;
    try {
      const obj = JSON.parse(input);
      document.getElementById('fjv-input').value = JSON.stringify(obj);
    } catch (e) {
      document.getElementById('fjv-output').innerHTML = `<div class="fjv-error">❌ JSON 解析错误：${this.escape(e.message)}</div>`;
    }
  }

  copy() {
    const val = document.getElementById('fjv-input').value;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      const btn = document.getElementById('fjv-copy');
      btn.textContent = '✅ 已复制';
      setTimeout(() => btn.textContent = '📋 复制', 1500);
    });
  }

  showInfo(obj) {
    const info = document.getElementById('fjv-info');
    info.style.display = 'flex';
    const str = JSON.stringify(obj);
    const type = Array.isArray(obj) ? '数组' : typeof obj === 'object' ? '对象' : typeof obj;
    const keys = typeof obj === 'object' && obj !== null ? Object.keys(obj).length : 0;
    const depth = this.getDepth(obj);
    info.innerHTML = `
      <span>类型：${type}</span>
      <span>大小：${str.length} 字符</span>
      ${keys ? `<span>键数：${keys}</span>` : ''}
      <span>深度：${depth}</span>
    `;
  }

  getDepth(obj) {
    if (typeof obj !== 'object' || obj === null) return 0;
    let max = 0;
    for (const val of Object.values(obj)) {
      max = Math.max(max, this.getDepth(val));
    }
    return max + 1;
  }

  renderTree(obj, depth = 0) {
    const html = this.toHtml(obj, depth);
    document.getElementById('fjv-output').innerHTML = `<div class="fjv-tree">${html}</div>`;
    // 绑定折叠
    document.querySelectorAll('.fjv-toggle').forEach(el => {
      el.addEventListener('click', () => {
        const content = el.parentElement.querySelector('.fjv-content');
        if (content) {
          content.style.display = content.style.display === 'none' ? '' : 'none';
          el.textContent = content.style.display === 'none' ? '▶' : '▼';
        }
      });
    });
  }

  toHtml(val, depth) {
    if (val === null) return '<span class="fjv-null">null</span>';
    if (typeof val === 'boolean') return `<span class="fjv-bool">${val}</span>`;
    if (typeof val === 'number') return `<span class="fjv-num">${val}</span>`;
    if (typeof val === 'string') {
      const escaped = this.escape(val);
      if (val.startsWith('http://') || val.startsWith('https://')) {
        return `<span class="fjv-str">"<a href="${val}" target="_blank" class="fjv-link">${escaped}</a>"</span>`;
      }
      return `<span class="fjv-str">"${escaped}"</span>`;
    }
    if (Array.isArray(val)) {
      if (val.length === 0) return '<span class="fjv-bracket">[]</span>';
      const items = val.map((item, i) => `<div class="fjv-item"><span class="fjv-index">${i}:</span> ${this.toHtml(item, depth + 1)}${i < val.length - 1 ? ',' : ''}</div>`).join('');
      return `<span class="fjv-toggle">▼</span><span class="fjv-bracket">[</span><div class="fjv-content">${items}</div><span class="fjv-bracket">]</span>`;
    }
    if (typeof val === 'object') {
      const keys = Object.keys(val);
      if (keys.length === 0) return '<span class="fjv-bracket">{}</span>';
      const items = keys.map((key, i) => `<div class="fjv-item"><span class="fjv-key">"${this.escape(key)}"</span>: ${this.toHtml(val[key], depth + 1)}${i < keys.length - 1 ? ',' : ''}</div>`).join('');
      return `<span class="fjv-toggle">▼</span><span class="fjv-bracket">{</span><div class="fjv-content">${items}</div><span class="fjv-bracket">}</span>`;
    }
    return String(val);
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

const style = document.createElement('style');
style.textContent = `
.fjv-wrap{max-width:800px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fjv-input-area{margin-bottom:16px}
.fjv-toolbar{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;align-items:center}
.fjv-btn{background:var(--accent,#646cff);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:.8rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fjv-btn:hover{filter:brightness(1.1);transform:translateY(-1px)}
.fjv-btn.fjv-secondary{background:var(--surface,#1a1a2e);color:var(--text-secondary,#888);border:1px solid var(--border,#2a2a3e)}
.fjv-btn.fjv-secondary:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
.fjv-indent{margin-left:auto;display:flex;align-items:center;gap:6px}
.fjv-indent label{font-size:.75rem;color:var(--text-secondary,#888)}
.fjv-indent select{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:6px;padding:6px 10px;color:var(--text,#e8e8e8);font-size:.8rem;font-family:inherit;outline:none}
.fjv-textarea{width:100%;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 14px;color:var(--text,#e8e8e8);font-size:.85rem;font-family:'Courier New',monospace;resize:vertical;outline:none;line-height:1.6;transition:border-color .3s;box-sizing:border-box;min-width:0}
.fjv-textarea:focus{border-color:var(--accent,#646cff)}
.fjv-textarea::placeholder{color:var(--text-secondary,#666)}
.fjv-output{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px;padding:16px;min-height:120px;max-height:500px;overflow:auto}
.fjv-empty{color:var(--text-secondary,#666);text-align:center;font-size:.85rem}
.fjv-error{color:#ef4444;font-size:.85rem;padding:12px}
.fjv-tree{font-size:.85rem;font-family:'Courier New',monospace;line-height:1.8}
.fjv-toggle{cursor:pointer;user-select:none;color:var(--text-secondary,#888);margin-right:4px;font-size:.7rem}
.fjv-toggle:hover{color:var(--accent,#646cff)}
.fjv-content{padding-left:20px;border-left:1px solid var(--border,#2a2a3e);margin-left:8px}
.fjv-bracket{color:var(--text-secondary,#888);font-weight:700}
.fjv-key{color:#ec4899}
.fjv-str{color:#22c55e}
.fjv-num{color:#f59e0b}
.fjv-bool{color:#8b5cf6}
.fjv-null{color:var(--text-secondary,#888);font-style:italic}
.fjv-index{color:var(--text-secondary,#666);margin-right:6px;min-width:20px;display:inline-block}
.fjv-link{color:var(--accent,#646cff);text-decoration:none}
.fjv-link:hover{text-decoration:underline}
.fjv-item{margin:2px 0}
.fjv-info{display:flex;gap:16px;padding:10px 16px;background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:10px;margin-top:12px;flex-wrap:wrap;font-size:.75rem;color:var(--text-secondary,#888)}
`;
document.head.appendChild(style);

new FishJsonViewer();
})();
