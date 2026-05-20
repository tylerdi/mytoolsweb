/**
 * 朋友圈文案生成器 📱
 * 关键词→各种风格的朋友圈文案
 */
(function() {
  'use strict';

  class PyqWriter {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-pyq';
      this.el.innerHTML = `
        <style>
          .fish-pyq{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .py-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .py-header h3{font-size:1.1rem;margin:0}
          .py-scenes{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .py-scene{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem}
          .py-scene:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .py-input{width:100%;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit;margin-bottom:0.75rem}
          .py-input:focus{border-color:var(--accent,#646cff)}
          .py-styles{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .py-style{background:rgba(255,255,255,0.04);border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.75rem}
          .py-style.active{background:rgba(100,108,255,0.15);border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .py-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem}
          .py-go:disabled{opacity:0.5;cursor:not-allowed}
          .py-results{display:none;margin-top:1rem;display:none;flex-direction:column;gap:0.75rem}
          .py-results.show{display:flex}
          .py-card{padding:0.75rem 1rem;background:var(--bg,#0a0a0a);border-radius:10px;font-size:0.88rem;line-height:1.7;position:relative;cursor:pointer;transition:border-color 0.2s;border:1px solid transparent}
          .py-card:hover{border-color:var(--accent,#646cff)}
          .py-card .copy-hint{position:absolute;top:0.5rem;right:0.5rem;font-size:0.65rem;color:var(--text-secondary,#888);opacity:0;transition:opacity 0.2s}
          .py-card:hover .copy-hint{opacity:1}
          @media(max-width:640px){.fish-pyq{padding:1rem}.py-go{width:100%}}
        </style>
        <div class="py-header"><span>📱</span><h3>朋友圈文案</h3></div>
        <div class="py-scenes">
          <span class="py-scene" data-v="今天吃了好吃的美食">🍜 美食</span>
          <span class="py-scene" data-v="今天去旅行了">✈️ 旅行</span>
          <span class="py-scene" data-v="今天心情不错">😊 心情好</span>
          <span class="py-scene" data-v="今天加班好累">😩 加班</span>
          <span class="py-scene" data-v="今天健身打卡">💪 健身</span>
          <span class="py-scene" data-v="下雨天">🌧️ 下雨</span>
          <span class="py-scene" data-v="周末宅家">🛋️ 宅家</span>
          <span class="py-scene" data-v="收到礼物">🎁 收礼物</span>
        </div>
        <input class="py-input" id="py-input" placeholder="描述一下你的情况或心情...">
        <div class="py-styles">
          <span class="py-style active" data-v="文艺">✨ 文艺</span>
          <span class="py-style" data-v="搞笑">😂 搞笑</span>
          <span class="py-style" data-v="高级感">💎 高级感</span>
          <span class="py-style" data-v="简短">⚡ 简短</span>
          <span class="py-style" data-v="emoji多">🎉 emoji风</span>
        </div>
        <button class="py-go" id="py-go">📱 生成文案</button>
        <div class="py-results" id="py-results"></div>
      `;
      container.appendChild(this.el);
      const input = this.el.querySelector('#py-input');
      this.el.querySelectorAll('.py-scene').forEach(s => s.addEventListener('click', () => { input.value = s.dataset.v; }));
      this.style = '文艺';
      this.el.querySelectorAll('.py-style').forEach(s => s.addEventListener('click', () => {
        this.el.querySelectorAll('.py-style').forEach(x => x.classList.remove('active'));
        s.classList.add('active'); this.style = s.dataset.v;
      }));
      this.el.querySelector('#py-go').addEventListener('click', () => this.go());
    }

    async go() {
      const desc = this.el.querySelector('#py-input').value.trim();
      if (!desc) return;
      const resultsEl = this.el.querySelector('#py-results');
      const goBtn = this.el.querySelector('#py-go');
      goBtn.disabled = true; goBtn.textContent = '生成中...';
      resultsEl.className = 'py-results show';
      resultsEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary,#888)">创作中...</div>';

      const prompt = `请为以下场景生成5条不同风格的朋友圈文案。场景：${desc}。风格偏好：${this.style}。每条文案单独一行，用|||分隔。只输出文案，不要编号。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 400 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const lines = text.split(/\|\|\||\n+/).map(l => l.trim()).filter(l => l && l.length > 1);
        resultsEl.innerHTML = lines.slice(0, 5).map(line =>
          `<div class="py-card" onclick="navigator.clipboard.writeText(this.querySelector('.text').textContent);this.style.borderColor='#4caf50';setTimeout(()=>this.style.borderColor='transparent',1000)"><span class="copy-hint">点击复制</span><span class="text">${line.replace(/^\d+[\.\)、]\s*/, '')}</span></div>`
        ).join('');
      } catch (e) { resultsEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '📱 生成文案';
    }
  }

  window.PyqWriter = PyqWriter;
  function init() { const el = document.getElementById('fish-pyq'); if (!el) return; new PyqWriter().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
