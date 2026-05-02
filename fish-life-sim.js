/**
 * 人生重开模拟器 🔄
 * 如果重活一次，你会怎样？
 */
(function() {
  'use strict';

  class LifeSimulator {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-life-sim';
      this.el.innerHTML = `
        <style>
          .fish-life-sim{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .ls-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .ls-header h3{font-size:1.1rem;margin:0}
          .ls-intro{text-align:center;padding:1.5rem;color:var(--text-secondary,#888);font-size:0.9rem;line-height:1.8}
          .ls-intro .big{font-size:2rem;margin-bottom:0.5rem}
          .ls-attrs{display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;margin-bottom:1rem}
          .ls-attr{display:flex;align-items:center;gap:0.5rem}
          .ls-attr label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:50px}
          .ls-attr input[type=range]{flex:1;accent-color:var(--accent,#646cff)}
          .ls-attr .val{font-size:0.8rem;color:var(--accent,#646cff);min-width:30px;text-align:right}
          .ls-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.7rem 2rem;cursor:pointer;font-size:1rem;width:100%;margin-bottom:1rem}
          .ls-go:disabled{opacity:0.5;cursor:not-allowed}
          .ls-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;max-height:500px;overflow-y:auto}
          .ls-output.show{display:block}
          .ls-output::-webkit-scrollbar{width:4px}
          .ls-output::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          @media(max-width:640px){.fish-life-sim{padding:1rem}.ls-attrs{grid-template-columns:1fr}}
        </style>
        <div class="ls-header"><span>🔄</span><h3>人生重开模拟器</h3></div>
        <div class="ls-intro"><div class="big">🔄</div>如果能重活一次，你希望...</div>
        <div class="ls-attrs">
          <div class="ls-attr"><label>智力</label><input type="range" min="1" max="10" value="5" id="ls-int"><span class="val">5</span></div>
          <div class="ls-attr"><label>颜值</label><input type="range" min="1" max="10" value="5" id="ls-look"><span class="val">5</span></div>
          <div class="ls-attr"><label>家境</label><input type="range" min="1" max="10" value="5" id="ls-money"><span class="val">5</span></div>
          <div class="ls-attr"><label>运气</label><input type="range" min="1" max="10" value="5" id="ls-luck"><span class="val">5</span></div>
          <div class="ls-attr"><label>体质</label><input type="range" min="1" max="10" value="5" id="ls-body"><span class="val">5</span></div>
          <div class="ls-attr"><label>情商</label><input type="range" min="1" max="10" value="5" id="ls-eq"><span class="val">5</span></div>
        </div>
        <button class="ls-go" id="ls-go">🎲 开始新人生</button>
        <div class="ls-output" id="ls-output"></div>
      `;
      container.appendChild(this.el);
      this.el.querySelectorAll('input[type=range]').forEach(r => {
        r.addEventListener('input', () => r.nextElementSibling.textContent = r.value);
      });
      this.el.querySelector('#ls-go').addEventListener('click', () => this.go());
    }

    async go() {
      const attrs = {};
      ['int','look','money','luck','body','eq'].forEach(k => {
        attrs[k] = this.el.querySelector('#ls-' + k).value;
      });
      const outputEl = this.el.querySelector('#ls-output');
      const goBtn = this.el.querySelector('#ls-go');
      goBtn.disabled = true; goBtn.textContent = '生成中...';
      outputEl.className = 'ls-output show'; outputEl.textContent = '正在重开人生...';

      const prompt = `你是一个人生模拟器。用户选择了以下属性重新开始人生：智力${attrs.int}/10、颜值${attrs.look}/10、家境${attrs.money}/10、运气${attrs.luck}/10、体质${attrs.body}/10、情商${attrs.eq}/10。请模拟这个人从出生到老的一生，按年龄段（0-6岁、7-12岁、13-18岁、19-25岁、26-35岁、36-50岁、51-65岁、66岁+）分段叙述。每段2-3句话，要有趣、有戏剧性、有转折。最后给一个人生总结和墓志铭。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 1000 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '模拟失败').replace(/\n/g, '<br>');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '🎲 再来一次';
    }
  }

  window.LifeSimulator = LifeSimulator;
  function init() { const el = document.getElementById('fish-life-sim'); if (!el) return; new LifeSimulator().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
