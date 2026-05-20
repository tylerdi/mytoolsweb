/**
 * AI 对联生成器 🧧
 * 输入上联，AI对下联
 */
(function() {
  'use strict';

  class CoupletGen {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-couplet';
      this.el.innerHTML = `
        <style>
          .fish-couplet{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .cp-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .cp-header h3{font-size:1.1rem;margin:0}
          .cp-presets{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .cp-preset{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem}
          .cp-preset:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .cp-input-row{display:flex;gap:0.5rem;margin-bottom:0.75rem}
          .cp-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.9rem;outline:none;font-family:'LXGW WenKai',serif}
          .cp-input:focus{border-color:var(--accent,#646cff)}
          .cp-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.2rem;cursor:pointer;font-size:0.85rem}
          .cp-go:disabled{opacity:0.5;cursor:not-allowed}
          .cp-result{display:none;margin-top:1rem}
          .cp-result.show{display:block}
          .cp-card{padding:1.5rem;background:var(--bg,#0a0a0a);border-radius:12px;text-align:center;border:2px solid rgba(239,68,68,0.2)}
          .cp-card .upper{font-size:1.2rem;font-weight:700;color:#ef4444;margin-bottom:0.75rem;font-family:'LXGW WenKai',serif;letter-spacing:0.2em}
          .cp-card .divider{color:#ef4444;font-size:1.5rem;margin:0.5rem 0}
          .cp-card .lower{font-size:1.2rem;font-weight:700;color:#ef4444;margin-bottom:0.5rem;font-family:'LXGW WenKai',serif;letter-spacing:0.2em}
          .cp-card .hengpi{font-size:1rem;color:#eab308;margin-top:0.75rem;font-weight:600}
          .cp-card .explain{font-size:0.8rem;color:var(--text-secondary,#888);margin-top:0.5rem;line-height:1.6}
          .cp-others{margin-top:0.75rem;font-size:0.85rem;color:var(--text-secondary,#888);line-height:1.8}
          .cp-others strong{color:var(--text,#e8e8e8)}
          @media(max-width:640px){.fish-couplet{padding:1rem}.cp-input-row{flex-direction:column}.cp-go{width:100%}}
        </style>
        <div class="cp-header"><span>🧧</span><h3>AI 对联生成器</h3></div>
        <div class="cp-presets">
          <span class="cp-preset" data-v="春风得意马蹄疾">春风得意</span>
          <span class="cp-preset" data-v="天增岁月人增寿">天增岁月</span>
          <span class="cp-preset" data-v="一帆风顺年年好">一帆风顺</span>
          <span class="cp-preset" data-v="书山有路勤为径">书山有路</span>
          <span class="cp-preset" data-v="海内存知己">海内存知己</span>
        </div>
        <div class="cp-input-row">
          <input class="cp-input" id="cp-input" placeholder="输入上联...">
          <button class="cp-go" id="cp-go">🧧 对下联</button>
        </div>
        <div class="cp-result" id="cp-result"></div>
      `;
      container.appendChild(this.el);
      const input = this.el.querySelector('#cp-input');
      this.el.querySelectorAll('.cp-preset').forEach(p => p.addEventListener('click', () => { input.value = p.dataset.v; }));
      this.el.querySelector('#cp-go').addEventListener('click', () => this.go());
    }

    async go() {
      const upper = this.el.querySelector('#cp-input').value.trim();
      if (!upper) return;
      const resultEl = this.el.querySelector('#cp-result');
      const goBtn = this.el.querySelector('#cp-go');
      goBtn.disabled = true; goBtn.textContent = '对联中...';
      resultEl.className = 'cp-result show';
      resultEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary,#888);padding:1rem">正在对联...</div>';

      const prompt = `上联："${upper}"\n请对下联。输出JSON格式：{"best":"最佳下联","hengpi":"横批（4字）","explain":"对仗解析","others":["备选下联1","备选下联2"]}\n要求：平仄相对，词性相同，意境相关。只输出JSON。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 400 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const r = JSON.parse(match[0]);
          const others = (r.others || []).map(o => `<div>「${o}」</div>`).join('');
          resultEl.innerHTML = `
            <div class="cp-card">
              <div class="upper">${upper}</div>
              <div class="divider">— 对 —</div>
              <div class="lower">${r.best}</div>
              <div class="hengpi">【${r.hengpi || '...'}】</div>
              <div class="explain">${r.explain || ''}</div>
            </div>
            ${others ? `<div class="cp-others"><strong>备选：</strong>${others}</div>` : ''}
          `;
        } else { resultEl.innerHTML = '对联失败，请重试'; }
      } catch (e) { resultEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '🧧 对下联';
    }
  }

  window.CoupletGen = CoupletGen;
  function init() { const el = document.getElementById('fish-couplet'); if (!el) return; new CoupletGen().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
