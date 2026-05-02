/**
 * AI 菜谱推荐 🍳
 * 输入冰箱里有什么食材，AI推荐能做的菜
 */
(function() {
  'use strict';

  class RecipeHelper {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-recipe';
      this.el.innerHTML = `
        <style>
          .fish-recipe{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .rc-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .rc-header h3{font-size:1.1rem;margin:0}
          .rc-tags{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .rc-tag{background:rgba(100,108,255,0.1);border:1px solid rgba(100,108,255,0.2);color:var(--accent,#646cff);padding:0.25rem 0.6rem;border-radius:16px;cursor:pointer;font-size:0.8rem;transition:all 0.2s}
          .rc-tag:hover{background:rgba(100,108,255,0.2)}
          .rc-input-row{display:flex;gap:0.5rem;margin-bottom:0.75rem}
          .rc-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .rc-input:focus{border-color:var(--accent,#646cff)}
          .rc-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.2rem;cursor:pointer;font-size:0.85rem;transition:background 0.2s}
          .rc-go:hover{background:#535bf2}
          .rc-go:disabled{opacity:0.5;cursor:not-allowed}
          .rc-prefs{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem}
          .rc-pref{background:rgba(255,255,255,0.04);border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.75rem;transition:all 0.2s}
          .rc-pref.active{background:rgba(100,108,255,0.15);border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .rc-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem}
          .rc-output.show{display:block}
          @media(max-width:640px){.fish-recipe{padding:1rem}.rc-input-row{flex-direction:column}.rc-go{width:100%}}
        </style>
        <div class="rc-header"><span>🍳</span><h3>AI 菜谱推荐</h3></div>
        <div class="rc-tags">
          <span class="rc-tag" data-v="鸡蛋">🥚 鸡蛋</span>
          <span class="rc-tag" data-v="番茄">🍅 番茄</span>
          <span class="rc-tag" data-v="土豆">🥔 土豆</span>
          <span class="rc-tag" data-v="鸡胸肉">🍗 鸡胸肉</span>
          <span class="rc-tag" data-v="豆腐">🧈 豆腐</span>
          <span class="rc-tag" data-v="青菜">🥬 青菜</span>
          <span class="rc-tag" data-v="米饭">🍚 米饭</span>
          <span class="rc-tag" data-v="面条">🍜 面条</span>
        </div>
        <div class="rc-input-row">
          <input class="rc-input" id="rc-input" placeholder="输入你冰箱里有的食材，用逗号分隔...">
          <button class="rc-go" id="rc-go">🍳 推荐菜谱</button>
        </div>
        <div class="rc-prefs">
          <span class="rc-pref" data-v="清淡">🥗 清淡</span>
          <span class="rc-pref" data-v="重口">🌶️ 重口</span>
          <span class="rc-pref" data-v="减脂">💪 减脂</span>
          <span class="rc-pref" data-v="快手菜">⚡ 快手菜（15分钟内）</span>
        </div>
        <div class="rc-output" id="rc-output"></div>
      `;
      container.appendChild(this.el);

      const input = this.el.querySelector('#rc-input');
      this.el.querySelectorAll('.rc-tag').forEach(tag => {
        tag.addEventListener('click', () => {
          const v = tag.dataset.v;
          const cur = input.value;
          if (!cur.includes(v)) input.value = cur ? cur + '，' + v : v;
        });
      });
      this.el.querySelectorAll('.rc-pref').forEach(p => {
        p.addEventListener('click', () => p.classList.toggle('active'));
      });
      this.el.querySelector('#rc-go').addEventListener('click', () => this.go());
    }

    async go() {
      const input = this.el.querySelector('#rc-input');
      const ingredients = input.value.trim();
      if (!ingredients) return;
      const prefs = Array.from(this.el.querySelectorAll('.rc-pref.active')).map(p => p.dataset.v);
      const outputEl = this.el.querySelector('#rc-output');
      const goBtn = this.el.querySelector('#rc-go');
      goBtn.disabled = true;
      goBtn.textContent = '思考中...';
      outputEl.className = 'rc-output show';
      outputEl.textContent = '正在推荐...';

      let prompt = `我冰箱里有这些食材：${ingredients}。请推荐2-3道能做的菜。每道菜给出：菜名、难度（⭐1-5）、时间、食材清单、简要步骤（3-5步）。格式清晰，用emoji点缀。`;
      if (prefs.length) prompt += `偏好：${prefs.join('、')}。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 800 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '推荐失败，请重试').replace(/\n/g, '<br>');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了，请重试'; }
      goBtn.disabled = false;
      goBtn.textContent = '🍳 推荐菜谱';
    }
  }

  window.RecipeHelper = RecipeHelper;
  function init() { const el = document.getElementById('fish-recipe'); if (!el) return; new RecipeHelper().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
