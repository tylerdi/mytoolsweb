/**
 * AI 旅行规划师 🗺️
 * 输入目的地、天数、偏好，生成详细行程
 */
(function() {
  'use strict';

  class TravelPlanner {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-travel';
      this.el.innerHTML = `
        <style>
          .fish-travel{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .tv-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .tv-header h3{font-size:1.1rem;margin:0}
          .tv-form{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:0.75rem}
          .tv-row{display:flex;gap:0.5rem;align-items:center}
          .tv-label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:50px}
          .tv-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:0.5rem 0.75rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .tv-input:focus{border-color:var(--accent,#646cff)}
          .tv-presets{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.5rem}
          .tv-preset{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.75rem}
          .tv-preset:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .tv-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;align-self:flex-end}
          .tv-go:disabled{opacity:0.5;cursor:not-allowed}
          .tv-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;max-height:500px;overflow-y:auto}
          .tv-output.show{display:block}
          .tv-output::-webkit-scrollbar{width:4px}
          .tv-output::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          @media(max-width:640px){.fish-travel{padding:1rem}.tv-row{flex-direction:column;align-items:stretch}.tv-go{width:100%}}
        </style>
        <div class="tv-header"><span>🗺️</span><h3>AI 旅行规划师</h3></div>
        <div class="tv-presets">
          <span class="tv-preset" data-v="东京">🗼 东京</span>
          <span class="tv-preset" data-v="曼谷">🛕 曼谷</span>
          <span class="tv-preset" data-v="成都">🐼 成都</span>
          <span class="tv-preset" data-v="大理">🏔️ 大理</span>
          <span class="tv-preset" data-v="巴黎">🗼 巴黎</span>
          <span class="tv-preset" data-v="首尔">🇰🇷 首尔</span>
        </div>
        <div class="tv-form">
          <div class="tv-row"><span class="tv-label">目的地</span><input class="tv-input" id="tv-dest" placeholder="想去哪里？"></div>
          <div class="tv-row"><span class="tv-label">天数</span><input class="tv-input" id="tv-days" type="number" min="1" max="30" value="3" style="max-width:80px"></div>
          <div class="tv-row"><span class="tv-label">预算</span><input class="tv-input" id="tv-budget" placeholder="如：3000元/人（可留空）"></div>
          <div class="tv-row"><span class="tv-label">偏好</span><input class="tv-input" id="tv-pref" placeholder="如：美食、拍照、亲子、文艺（可留空）"></div>
        </div>
        <button class="tv-go" id="tv-go">🗺️ 生成行程</button>
        <div class="tv-output" id="tv-output"></div>
      `;
      container.appendChild(this.el);

      const dest = this.el.querySelector('#tv-dest');
      this.el.querySelectorAll('.tv-preset').forEach(p => {
        p.addEventListener('click', () => { dest.value = p.dataset.v; });
      });
      this.el.querySelector('#tv-go').addEventListener('click', () => this.go());
    }

    async go() {
      const dest = this.el.querySelector('#tv-dest').value.trim();
      const days = this.el.querySelector('#tv-days').value;
      const budget = this.el.querySelector('#tv-budget').value.trim();
      const pref = this.el.querySelector('#tv-pref').value.trim();
      if (!dest) return;
      const outputEl = this.el.querySelector('#tv-output');
      const goBtn = this.el.querySelector('#tv-go');
      goBtn.disabled = true;
      goBtn.textContent = '规划中...';
      outputEl.className = 'tv-output show';
      outputEl.textContent = '正在规划行程...';

      let prompt = `请为"${dest}"规划一个${days}天的旅行行程。每天包含：上午/下午/晚上各1-2个景点或活动，推荐餐厅，交通方式。`;
      if (budget) prompt += `预算：${budget}。`;
      if (pref) prompt += `偏好：${pref}。`;
      prompt += `\n最后给一些实用小贴士。格式清晰，用emoji点缀，按天分段。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 1200 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '规划失败').replace(/\n/g, '<br>');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了，请重试'; }
      goBtn.disabled = false;
      goBtn.textContent = '🗺️ 生成行程';
    }
  }

  window.TravelPlanner = TravelPlanner;
  function init() { const el = document.getElementById('fish-travel'); if (!el) return; new TravelPlanner().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
