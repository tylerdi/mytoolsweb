/**
 * 小鱼儿 Markdown 笔记本 🐟📝
 * 实时预览 Markdown 编辑器 + 本地存储
 * 用法：<div id="fish-markdown"></div><script src="/fish-markdown.js"></script>
 */
(function(){
'use strict';

const STORAGE_KEY = 'fish_markdown_notes';
const MAX_NOTES = 50;

class FishMarkdown {
  constructor() {
    this.el = document.getElementById('fish-markdown');
    if (!this.el) return;
    this.notes = this.load();
    this.current = this.notes[0]?.id || null;
    this.mobile = window.innerWidth <= 900;
    this.render();
  }

  load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (saved && saved.length) return saved;
    } catch {}
    return [{ id: 'default', title: '我的第一篇笔记', content: '# 欢迎使用 Markdown 笔记本 🐟\n\n在这里写笔记，支持 **Markdown** 语法。\n\n## 功能\n\n- 实时预览\n- 多篇笔记管理\n- 本地存储\n- 一键复制\n\n> 开始写作吧！', created: Date.now(), updated: Date.now() }];
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notes));
  }

  getCurrent() {
    return this.notes.find(n => n.id === this.current);
  }

  createNote() {
    if (this.notes.length >= MAX_NOTES) return alert('最多50篇笔记');
    const note = {
      id: Date.now().toString(36),
      title: '未命名笔记',
      content: '',
      created: Date.now(),
      updated: Date.now(),
    };
    this.notes.unshift(note);
    this.current = note.id;
    this.save();
    this.render();
  }

  deleteNote(id) {
    if (!confirm('删除这篇笔记？')) return;
    this.notes = this.notes.filter(n => n.id !== id);
    if (this.current === id) this.current = this.notes[0]?.id || null;
    this.save();
    this.render();
  }

  updateContent(content) {
    const note = this.getCurrent();
    if (!note) return;
    note.content = content;
    note.updated = Date.now();
    const titleMatch = content.match(/^#\s+(.+)/m);
    if (titleMatch) note.title = titleMatch[1].slice(0, 30);
    this.save();
    this.updatePreview();
    this.updateNoteList();
  }

  render() {
    const note = this.getCurrent();
    const content = note?.content || '';

    this.el.innerHTML = `
      <div class="fmd-wrap">
        <div class="fmd-editor-area">
          <div class="fmd-toolbar">
            ${this.mobile ? '<button class="fmd-tool" id="fmd-toggle" title="笔记列表">📓</button>' : ''}
            <button class="fmd-tool" data-md="**" title="粗体"><b>B</b></button>
            <button class="fmd-tool" data-md="_" title="斜体"><i>I</i></button>
            <button class="fmd-tool" data-md="~~" title="删除线"><s>S</s></button>
            <span class="fmd-tool-sep"></span>
            <button class="fmd-tool" data-md="# " title="标题">H</button>
            <button class="fmd-tool" data-md="- " title="列表">☰</button>
            <button class="fmd-tool" data-md="> " title="引用">❝</button>
            <button class="fmd-tool" data-md="\`" title="代码">⟨/⟩</button>
            <span class="fmd-tool-sep"></span>
            <button class="fmd-tool" id="fmd-copy" title="复制 Markdown">📋</button>
            <button class="fmd-tool" id="fmd-copy-html" title="复制 HTML">📄</button>
            <div class="fmd-tabs">
              <button class="fmd-tab active" data-tab="edit">编辑</button>
              <button class="fmd-tab" data-tab="preview">预览</button>
              <button class="fmd-tab" data-tab="split">分屏</button>
            </div>
          </div>
          <div class="fmd-editor-container" id="fmd-editor-container">
            <textarea class="fmd-textarea" id="fmd-textarea" placeholder="写点什么...">${this.escape(content)}</textarea>
            <div class="fmd-preview" id="fmd-preview"></div>
          </div>
        </div>
      </div>
    `;

    this.updatePreview();
    this.bindEvents();
  }

  bindEvents() {
    const textarea = document.getElementById('fmd-textarea');

    textarea.addEventListener('input', () => this.updateContent(textarea.value));

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, start) + '  ' + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        this.updateContent(textarea.value);
      }
    });

    // 手机端笔记列表弹窗
    document.getElementById('fmd-toggle')?.addEventListener('click', () => {
      this.showNotePicker();
    });

    // 格式化按钮
    this.el.querySelectorAll('.fmd-tool[data-md]').forEach(btn => {
      btn.addEventListener('click', () => {
        const md = btn.dataset.md;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = textarea.value.slice(start, end);
        const before = textarea.value.slice(0, start);
        const after = textarea.value.slice(end);
        if (md.startsWith('#') || md.startsWith('-') || md.startsWith('>')) {
          textarea.value = before + md + selected + after;
          textarea.selectionStart = textarea.selectionEnd = start + md.length + selected.length;
        } else {
          textarea.value = before + md + selected + md + after;
          textarea.selectionStart = start + md.length;
          textarea.selectionEnd = end + md.length;
        }
        this.updateContent(textarea.value);
        textarea.focus();
      });
    });

    document.getElementById('fmd-copy')?.addEventListener('click', () => {
      const note = this.getCurrent();
      if (note) {
        navigator.clipboard.writeText(note.content).then(() => {
          const btn = document.getElementById('fmd-copy');
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        });
      }
    });

    document.getElementById('fmd-copy-html')?.addEventListener('click', () => {
      const html = document.getElementById('fmd-preview').innerHTML;
      navigator.clipboard.writeText(html).then(() => {
        const btn = document.getElementById('fmd-copy-html');
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '📄', 1500);
      });
    });

    this.el.querySelectorAll('.fmd-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.el.querySelectorAll('.fmd-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.tab;
        document.getElementById('fmd-editor-container').className = 'fmd-editor-container mode-' + mode;
      });
    });
  }

  showNotePicker() {
    const existing = document.getElementById('fmd-picker-overlay');
    if (existing) { existing.remove(); return; }

    const overlay = document.createElement('div');
    overlay.id = 'fmd-picker-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center';
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    const panel = document.createElement('div');
    panel.style.cssText = 'background:var(--surface,#1a1a2e);border-radius:16px 16px 0 0;width:100%;max-width:500px;max-height:70vh;display:flex;flex-direction:column;overflow:hidden';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--border,#2a2a3e)';
    header.innerHTML = `<span style="font-weight:700;font-size:1rem">📓 笔记列表</span><button id="fmd-picker-new" style="background:var(--accent,#646cff);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:.85rem;cursor:pointer">＋ 新建</button>`;

    const list = document.createElement('div');
    list.style.cssText = 'flex:1;overflow-y:auto;padding:12px';
    list.innerHTML = this.notes.map(n => `
      <div class="fmd-picker-item" data-id="${n.id}" style="padding:12px 16px;border-radius:10px;margin-bottom:6px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background .2s;${n.id === this.current ? 'background:rgba(100,108,255,.15);border:1px solid rgba(100,108,255,.2)' : ''}">
        <div>
          <div style="font-size:.9rem;font-weight:600">${this.escape(n.title)}</div>
          <div style="font-size:.7rem;color:var(--text-secondary,#888);margin-top:2px">${this.formatTime(n.updated)}</div>
        </div>
        <button class="fmd-picker-del" data-id="${n.id}" style="background:none;border:none;color:var(--text-secondary,#666);font-size:1rem;cursor:pointer;padding:4px 8px">🗑️</button>
      </div>
    `).join('');

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = 'width:100%;padding:16px;background:none;border:none;border-top:1px solid var(--border,#2a2a3e);color:var(--text-secondary,#888);font-size:.9rem;cursor:pointer;font-family:inherit';
    closeBtn.addEventListener('click', () => overlay.remove());

    panel.appendChild(header);
    panel.appendChild(list);
    panel.appendChild(closeBtn);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    // 事件
    document.getElementById('fmd-picker-new')?.addEventListener('click', () => {
      overlay.remove();
      this.createNote();
    });

    list.querySelectorAll('.fmd-picker-item').forEach(item => {
      item.addEventListener('click', e => {
        if (e.target.closest('.fmd-picker-del')) {
          e.stopPropagation();
          this.deleteNote(e.target.closest('.fmd-picker-del').dataset.id);
          overlay.remove();
          this.showNotePicker();
          return;
        }
        this.current = item.dataset.id;
        overlay.remove();
        this.render();
      });
    });
  }

  updatePreview() {
    const note = this.getCurrent();
    const preview = document.getElementById('fmd-preview');
    if (!preview || !note) return;
    preview.innerHTML = this.parseMarkdown(note.content);
  }

  updateNoteList() {
    // 手机端不更新侧边栏列表（已移除），仅更新标题
  }

  parseMarkdown(md) {
    if (!md) return '<p style="color:var(--text-secondary,#666)">预览区域</p>';
    let html = this.escape(md);
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code class="fmd-inline-code">$1</code>');
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px" />');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^---$/gm, '<hr />');
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    html = html.replace(/\[x\]/g, '☑️');
    html = html.replace(/\[ \]/g, '⬜');
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>(<h[1-6]>)/g, '$1');
    html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr \/>)/g, '$1');
    return html;
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    if (now - d < 86400000) return '今天';
    if (now - d < 172800000) return '昨天';
    return `${d.getMonth()+1}/${d.getDate()}`;
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fmd-wrap{display:flex;height:600px;max-height:80vh;border:1px solid var(--border,#2a2a3e);border-radius:16px;overflow:hidden;font-family:'LXGW WenKai',system-ui,sans-serif;background:var(--surface,#1a1a2e);width:100%}
.fmd-editor-area{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden}
.fmd-toolbar{display:flex;align-items:center;gap:4px;padding:8px 12px;border-bottom:1px solid var(--border,#2a2a3e);flex-wrap:wrap;flex-shrink:0}
.fmd-tool{background:none;border:1px solid transparent;color:var(--text-secondary,#888);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:.8rem;font-family:inherit;transition:all .2s}
.fmd-tool:hover{background:rgba(100,108,255,.1);color:var(--text,#e8e8e8)}
.fmd-tool-sep{width:1px;height:16px;background:var(--border,#2a2a3e);margin:0 4px}
.fmd-tabs{margin-left:auto;display:flex;gap:2px}
.fmd-tab{background:none;border:none;color:var(--text-secondary,#666);padding:4px 10px;border-radius:6px;cursor:pointer;font-size:.75rem;font-family:inherit;transition:all .2s}
.fmd-tab.active{background:rgba(100,108,255,.15);color:var(--accent,#646cff)}
.fmd-editor-container{flex:1;display:flex;overflow:hidden}
.fmd-editor-container.mode-edit .fmd-preview{display:none}
.fmd-editor-container.mode-edit .fmd-textarea{flex:1}
.fmd-editor-container.mode-preview .fmd-textarea{display:none}
.fmd-editor-container.mode-preview .fmd-preview{flex:1}
.fmd-editor-container.mode-split .fmd-textarea{flex:1;border-right:1px solid var(--border,#2a2a3e)}
.fmd-editor-container.mode-split .fmd-preview{flex:1}
.fmd-textarea{width:100%;height:100%;background:transparent;border:none;color:var(--text,#e8e8e8);font-size:.9rem;line-height:1.8;padding:16px;font-family:'Courier New',monospace;resize:none;outline:none;box-sizing:border-box}
.fmd-textarea::placeholder{color:var(--text-secondary,#666)}
.fmd-preview{flex:1;overflow-y:auto;padding:16px;font-size:.9rem;line-height:1.8;color:var(--text,#e8e8e8)}
.fmd-preview h1,.fmd-preview h2,.fmd-preview h3,.fmd-preview h4{color:var(--text,#e8e8e8);margin:16px 0 8px}
.fmd-preview h1{font-size:1.6rem;border-bottom:1px solid var(--border,#2a2a3e);padding-bottom:8px}
.fmd-preview h2{font-size:1.3rem}
.fmd-preview h3{font-size:1.1rem}
.fmd-preview p{margin:8px 0}
.fmd-preview blockquote{border-left:3px solid var(--accent,#646cff);padding:8px 16px;margin:12px 0;background:rgba(100,108,255,.05);border-radius:0 8px 8px 0;color:var(--text-secondary,#aaa)}
.fmd-preview ul{padding-left:24px;margin:8px 0}
.fmd-preview li{margin:4px 0}
.fmd-preview pre{background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a3e);border-radius:8px;padding:12px;overflow-x:auto;margin:12px 0}
.fmd-preview code{font-family:'Courier New',monospace;font-size:.85rem}
.fmd-inline-code{background:rgba(100,108,255,.1);padding:2px 6px;border-radius:4px;font-size:.85rem}
.fmd-preview hr{border:none;border-top:1px solid var(--border,#2a2a3e);margin:16px 0}
.fmd-preview a{color:var(--accent,#646cff);text-decoration:none}
.fmd-preview a:hover{text-decoration:underline}
.fmd-preview strong{color:var(--text,#fff)}
@media(max-width:900px){
  .fmd-wrap{height:auto!important;max-height:none!important;min-height:70vh}
  .fmd-editor-container{min-height:50vh}
  .fmd-editor-container.mode-split{flex-direction:column}
  .fmd-editor-container.mode-split .fmd-textarea{border-right:none;border-bottom:1px solid var(--border,#2a2a3e)}
}
`;
document.head.appendChild(style);

new FishMarkdown();
})();
