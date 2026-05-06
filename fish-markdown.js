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
    // 自动提取标题
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
        <div class="fmd-sidebar" id="fmd-sidebar">
          <div class="fmd-sidebar-header">
            <span>📓 笔记本</span>
            <button class="fmd-new" id="fmd-new" title="新建笔记">＋</button>
          </div>
          <div class="fmd-note-list" id="fmd-note-list">
            ${this.notes.map(n => `
              <div class="fmd-note-item ${n.id === this.current ? 'active' : ''}" data-id="${n.id}">
                <div class="fmd-note-title">${this.escape(n.title)}</div>
                <div class="fmd-note-time">${this.formatTime(n.updated)}</div>
                <button class="fmd-note-del" data-id="${n.id}" title="删除">×</button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="fmd-editor-area">
          <div class="fmd-toolbar">
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

    // 内容变化
    textarea.addEventListener('input', () => this.updateContent(textarea.value));

    // Tab 键支持
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

    // 新建笔记
    document.getElementById('fmd-new').addEventListener('click', () => this.createNote());

    // 笔记切换
    document.getElementById('fmd-note-list').addEventListener('click', e => {
      const item = e.target.closest('.fmd-note-item');
      const del = e.target.closest('.fmd-note-del');
      if (del) { e.stopPropagation(); this.deleteNote(del.dataset.id); return; }
      if (item) {
        this.current = item.dataset.id;
        this.render();
      }
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

    // 复制
    document.getElementById('fmd-copy').addEventListener('click', () => {
      const note = this.getCurrent();
      if (note) {
        navigator.clipboard.writeText(note.content).then(() => {
          const btn = document.getElementById('fmd-copy');
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        });
      }
    });

    document.getElementById('fmd-copy-html').addEventListener('click', () => {
      const html = document.getElementById('fmd-preview').innerHTML;
      navigator.clipboard.writeText(html).then(() => {
        const btn = document.getElementById('fmd-copy-html');
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '📄', 1500);
      });
    });

    // 标签页切换
    this.el.querySelectorAll('.fmd-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.el.querySelectorAll('.fmd-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const mode = tab.dataset.tab;
        const container = document.getElementById('fmd-editor-container');
        container.className = 'fmd-editor-container mode-' + mode;
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
    const list = document.getElementById('fmd-note-list');
    if (!list) return;
    list.innerHTML = this.notes.map(n => `
      <div class="fmd-note-item ${n.id === this.current ? 'active' : ''}" data-id="${n.id}">
        <div class="fmd-note-title">${this.escape(n.title)}</div>
        <div class="fmd-note-time">${this.formatTime(n.updated)}</div>
        <button class="fmd-note-del" data-id="${n.id}" title="删除">×</button>
      </div>
    `).join('');
  }

  parseMarkdown(md) {
    if (!md) return '<p style="color:var(--text-secondary,#666)">预览区域</p>';
    let html = this.escape(md);
    // 代码块
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code class="fmd-inline-code">$1</code>');
    // 标题
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    // 粗体、斜体、删除线
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');
    // 链接
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>');
    // 图片
    html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px" />');
    // 引用
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    // 水平线
    html = html.replace(/^---$/gm, '<hr />');
    // 列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
    // 复选框
    html = html.replace(/\[x\]/g, '☑️');
    html = html.replace(/\[ \]/g, '⬜');
    // 段落
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    // 清理空段落
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
.fmd-wrap{display:flex;height:600px;max-height:80vh;border:1px solid var(--border,#2a2a3e);border-radius:16px;overflow:hidden;font-family:'LXGW WenKai',system-ui,sans-serif;background:var(--surface,#1a1a2e)}
.fmd-sidebar{width:220px;border-right:1px solid var(--border,#2a2a3e);display:flex;flex-direction:column;flex-shrink:0}
.fmd-sidebar-header{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid var(--border,#2a2a3e);font-size:.9rem;font-weight:700;color:var(--text,#e8e8e8)}
.fmd-new{background:var(--accent,#646cff);color:#fff;border:none;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center;transition:all .3s}
.fmd-new:hover{transform:scale(1.1)}
.fmd-note-list{flex:1;overflow-y:auto;padding:8px}
.fmd-note-item{padding:10px 12px;border-radius:10px;cursor:pointer;margin-bottom:4px;position:relative;transition:all .2s}
.fmd-note-item:hover{background:rgba(100,108,255,.08)}
.fmd-note-item.active{background:rgba(100,108,255,.15);border:1px solid rgba(100,108,255,.2)}
.fmd-note-title{font-size:.8rem;font-weight:600;color:var(--text,#e8e8e8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fmd-note-time{font-size:.65rem;color:var(--text-secondary,#666);margin-top:2px}
.fmd-note-del{position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text-secondary,#666);font-size:.8rem;cursor:pointer;opacity:0;transition:all .2s;padding:2px 6px;border-radius:4px}
.fmd-note-item:hover .fmd-note-del{opacity:1}
.fmd-note-del:hover{color:#ef4444;background:rgba(239,68,68,.1)}
.fmd-editor-area{flex:1;display:flex;flex-direction:column;min-width:0}
.fmd-toolbar{display:flex;align-items:center;gap:4px;padding:8px 12px;border-bottom:1px solid var(--border,#2a2a3e);flex-wrap:wrap}
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
.fmd-textarea{width:100%;height:100%;background:transparent;border:none;color:var(--text,#e8e8e8);font-size:.9rem;line-height:1.8;padding:16px;font-family:'Courier New',monospace;resize:none;outline:none}
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
@media(max-width:768px){
  .fmd-wrap{flex-direction:column;height:auto;max-height:none}
  .fmd-sidebar{width:100%;max-height:200px;border-right:none;border-bottom:1px solid var(--border,#2a2a3e)}
  .fmd-editor-container{min-height:400px}
  .fmd-editor-container.mode-split{flex-direction:column}
  .fmd-editor-container.mode-split .fmd-textarea{border-right:none;border-bottom:1px solid var(--border,#2a2a3e)}
}
`;
document.head.appendChild(style);

new FishMarkdown();
})();
