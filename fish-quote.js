/**
 * AI 每日名言 💡
 * 每天一句AI生成的名言，带出处和解读
 */
(function() {
  'use strict';

  class DailyQuote {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-quote';
      this.el.innerHTML = `
        <style>
          .fish-quote{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .dq-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
          .dq-header-left{display:flex;align-items:center;gap:0.5rem}
          .dq-header h3{font-size:1.1rem;margin:0}
          .dq-refresh{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem}
          .dq-refresh:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .dq-card{padding:1.5rem;background:var(--bg,#0a0a0a);border-radius:12px;text-align:center}
          .dq-text{font-size:1.1rem;font-weight:600;line-height:1.8;margin-bottom:0.75rem;font-family:'LXGW WenKai',serif}
          .dq-author{font-size:0.85rem;color:var(--accent,#646cff);margin-bottom:0.5rem}
          .dq-explain{font-size:0.8rem;color:var(--text-secondary,#888);line-height:1.6}
          .dq-loading{text-align:center;color:var(--text-secondary,#888);padding:2rem 0}
          .dq-share{margin-top:1rem;background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.8rem}
          .dq-share:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-quote{padding:1rem}.dq-text{font-size:1rem}}
        </style>
        <div class="dq-header">
          <div class="dq-header-left"><span>💡</span><h3>每日名言</h3></div>
          <button class="dq-refresh" id="dq-refresh">🔄 换一句</button>
        </div>
        <div class="dq-card" id="dq-card"><div class="dq-loading">加载中...</div></div>
      `;
      container.appendChild(this.el);
      this.el.querySelector('#dq-refresh').addEventListener('click', () => this.load(true));
      this.load(false);
    }

    async load(forceRefresh) {
      const cardEl = this.el.querySelector('#dq-card');
      const today = new Date().toISOString().slice(0, 10);
      const cacheKey = `quote_${today}`;

      if (!forceRefresh) {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) { cardEl.innerHTML = cached; return; }
      }
      cardEl.innerHTML = '<div class="dq-loading">💡 正在寻找灵感...</div>';

      const prompt = `请生成一句有深度的名言（可以是真实的名人名言，也可以是AI创作的）。输出JSON格式：{"quote":"名言内容","author":"出处/作者","explain":"一句话解读"}。只输出JSON。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 200 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const q = JSON.parse(match[0]);
          const html = `
            <div class="dq-text">"${q.quote}"</div>
            <div class="dq-author">— ${q.author || '佚名'}</div>
            <div class="dq-explain">${q.explain || ''}</div>
            <button class="dq-share" onclick="navigator.clipboard.writeText('${q.quote.replace(/'/g, "\\'")} — ${q.author}');this.textContent='✅ 已复制';setTimeout(()=>this.textContent='📋 复制名言',1500)">📋 复制名言</button>
          `;
          cardEl.innerHTML = html;
          sessionStorage.setItem(cacheKey, html);
        }
      } catch (e) { cardEl.innerHTML = '⚠️ 加载失败'; }
    }
  }

  window.DailyQuote = DailyQuote;
  function init() { const el = document.getElementById('fish-quote'); if (!el) return; new DailyQuote().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
