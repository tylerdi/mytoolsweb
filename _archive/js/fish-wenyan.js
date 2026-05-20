/**
 * 文言文翻译 🏛️
 * 现代文↔文言文互译
 */
(function() {
  'use strict';

  class WenyanTranslator {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-wenyan';
      this.el.innerHTML = `
        <style>
          .fish-wenyan{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .wy-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .wy-header h3{font-size:1.1rem;margin:0}
          .wy-toggle{display:flex;gap:0.5rem;margin-bottom:1rem}
          .wy-toggle-btn{flex:1;padding:0.5rem;border:1px solid var(--border,#2a2a2a);background:transparent;color:var(--text-secondary,#888);border-radius:8px;cursor:pointer;font-size:0.85rem;transition:all 0.2s}
          .wy-toggle-btn.active{background:rgba(100,108,255,0.15);border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .wy-textarea{width:100%;min-height:80px;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.75rem 1rem;color:var(--text,#e8e8e8);font-size:0.9rem;outline:none;font-family:inherit;resize:vertical;margin-bottom:0.75rem}
          .wy-textarea:focus{border-color:var(--accent,#646cff)}
          .wy-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;width:100%}
          .wy-go:disabled{opacity:0.5;cursor:not-allowed}
          .wy-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;margin-top:1rem;font-size:1rem;line-height:2;font-family:'LXGW WenKai',serif}
          .wy-output.show{display:block}
          .wy-copy{float:right;background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.2rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.7rem}
          @media(max-width:640px){.fish-wenyan{padding:1rem}}
        </style>
        <div class="wy-header"><span>🏛️</span><h3>文言文翻译</h3></div>
        <div class="wy-toggle">
          <button class="wy-toggle-btn active" data-mode="to-wenyan">现代文 → 文言文</button>
          <button class="wy-toggle-btn" data-mode="to-modern">文言文 → 现代文</button>
        </div>
        <textarea class="wy-textarea" id="wy-input" placeholder="输入现代文..."></textarea>
        <button class="wy-go" id="wy-go">🏛️ 翻译</button>
        <div class="wy-output" id="wy-output"></div>
      `;
      container.appendChild(this.el);
      this.mode = 'to-wenyan';
      this.el.querySelectorAll('.wy-toggle-btn').forEach(b => b.addEventListener('click', () => {
        this.el.querySelectorAll('.wy-toggle-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.mode = b.dataset.mode;
        this.el.querySelector('#wy-input').placeholder = this.mode === 'to-wenyan' ? '输入现代文...' : '输入文言文...';
      }));
      this.el.querySelector('#wy-go').addEventListener('click', () => this.go());
    }

    async go() {
      const text = this.el.querySelector('#wy-input').value.trim();
      if (!text) return;
      const outputEl = this.el.querySelector('#wy-output');
      const goBtn = this.el.querySelector('#wy-go');
      goBtn.disabled = true; goBtn.textContent = '翻译中...';
      outputEl.className = 'wy-output show'; outputEl.textContent = '...';

      const prompt = this.mode === 'to-wenyan'
        ? `请将以下现代文翻译成文言文，要求典雅优美，符合古文语法。只输出翻译结果。\n\n${text}`
        : `请将以下文言文翻译成现代文，通俗易懂。只输出翻译结果。\n\n${text}`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 400 })
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || '翻译失败';
        outputEl.innerHTML = `<button class="wy-copy" onclick="navigator.clipboard.writeText(this.parentElement.textContent.replace('复制',''));this.textContent='✅';setTimeout(()=>this.textContent='复制',1500)">复制</button>${reply.replace(/\n/g, '<br>')}`;
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '🏛️ 翻译';
    }
  }

  window.WenyanTranslator = WenyanTranslator;
  function init() { const el = document.getElementById('fish-wenyan'); if (!el) return; new WenyanTranslator().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
