/**
 * AI 历史上的今天 📜
 * 每天自动展示历史大事，AI讲故事风格
 */
(function() {
  'use strict';

  class HistoryToday {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-history-today';
      this.el.innerHTML = `
        <style>
          .fish-history-today{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .ht-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
          .ht-header-left{display:flex;align-items:center;gap:0.5rem}
          .ht-header h3{font-size:1.1rem;margin:0}
          .ht-date{font-size:0.8rem;color:var(--text-secondary,#888)}
          .ht-refresh{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem}
          .ht-refresh:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .ht-content{line-height:1.8;font-size:0.9rem}
          .ht-loading{text-align:center;color:var(--text-secondary,#888);padding:2rem 0}
          .ht-event{padding:0.75rem 0;border-bottom:1px solid var(--border,#2a2a2a)}
          .ht-event:last-child{border-bottom:none}
          .ht-event .year{font-weight:700;color:var(--accent,#646cff);margin-right:0.5rem}
          @media(max-width:640px){.fish-history-today{padding:1rem}}
        </style>
        <div class="ht-header">
          <div class="ht-header-left"><span>📜</span><h3>历史上的今天</h3></div>
          <div><span class="ht-date" id="ht-date"></span> <button class="ht-refresh" id="ht-refresh">🔄</button></div>
        </div>
        <div class="ht-content" id="ht-content"><div class="ht-loading">加载中...</div></div>
      `;
      container.appendChild(this.el);

      const today = new Date();
      const dateStr = `${today.getMonth()+1}月${today.getDate()}日`;
      this.el.querySelector('#ht-date').textContent = dateStr;
      this.el.querySelector('#ht-refresh').addEventListener('click', () => this.load());
      this.load();
    }

    async load() {
      const contentEl = this.el.querySelector('#ht-content');
      contentEl.innerHTML = '<div class="ht-loading">📜 正在翻阅史书...</div>';
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      const cacheKey = `history_${month}_${day}`;
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) { contentEl.innerHTML = cached; return; }

      const prompt = `请列出历史上${month}月${day}日发生的3-5件重要事件。每个事件包括年份和简要描述（2-3句话），用讲故事的口吻，有趣不枯燥。格式：年份 事件描述。用emoji点缀。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 600 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '加载失败';
        const html = text.split(/\n+/).filter(l => l.trim()).map(line => {
          const m = line.match(/^[\s*•-]*?(\d{4})\s*年?\s*[：:、·\-—]?\s*([\s\S]*)$/);
          if (m) return `<div class="ht-event"><span class="year">${m[1]}年</span>${m[2].trim()}</div>`;
          return `<div class="ht-event">${line.replace(/^[\s*•-]+/, '')}</div>`;
        }).join('');
        contentEl.innerHTML = html;
        sessionStorage.setItem(cacheKey, html);
      } catch (e) { contentEl.innerHTML = '⚠️ 加载失败，请重试'; }
    }
  }

  window.HistoryToday = HistoryToday;
  function init() { const el = document.getElementById('fish-history-today'); if (!el) return; new HistoryToday().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
