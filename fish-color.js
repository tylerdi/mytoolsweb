/**
 * AI 配色方案生成器 🎨
 * 输入描述，生成一组配色方案
 */
(function() {
  'use strict';

  class ColorGen {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-color';
      this.el.innerHTML = `
        <style>
          .fish-color{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .cl-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .cl-header h3{font-size:1.1rem;margin:0}
          .cl-presets{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .cl-preset{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem;transition:all 0.2s}
          .cl-preset:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .cl-input-row{display:flex;gap:0.5rem;margin-bottom:0.75rem}
          .cl-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .cl-input:focus{border-color:var(--accent,#646cff)}
          .cl-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.2rem;cursor:pointer;font-size:0.85rem}
          .cl-go:disabled{opacity:0.5;cursor:not-allowed}
          .cl-result{display:none;margin-top:1rem}
          .cl-result.show{display:block}
          .cl-palette{display:flex;border-radius:12px;overflow:hidden;height:80px;margin-bottom:1rem}
          .cl-color{flex:1;cursor:pointer;position:relative;transition:flex 0.3s}
          .cl-color:hover{flex:2}
          .cl-color .hex{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);font-size:0.65rem;padding:0.15rem 0.3rem;border-radius:4px;background:rgba(0,0,0,0.6);color:#fff;opacity:0;transition:opacity 0.2s;white-space:nowrap}
          .cl-color:hover .hex{opacity:1}
          .cl-info{font-size:0.85rem;line-height:1.7;color:var(--text-secondary,#888)}
          .cl-copied{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--accent,#646cff);color:#fff;padding:0.5rem 1rem;border-radius:8px;font-size:0.85rem;z-index:9999;animation:clFade 1s ease forwards}
          @keyframes clFade{0%{opacity:1}70%{opacity:1}100%{opacity:0}}
          @media(max-width:640px){.fish-color{padding:1rem}.cl-input-row{flex-direction:column}.cl-go{width:100%}.cl-palette{height:60px}}
        </style>
        <div class="cl-header"><span>🎨</span><h3>AI 配色方案</h3></div>
        <div class="cl-presets">
          <span class="cl-preset" data-v="科技感、冷色调">🖥️ 科技冷色</span>
          <span class="cl-preset" data-v="温暖、秋日暖色调">🍂 秋日暖色</span>
          <span class="cl-preset" data-v="清新、自然绿色系">🌿 自然清新</span>
          <span class="cl-preset" data-v="高级感、莫兰迪色系">🎭 莫兰迪</span>
          <span class="cl-preset" data-v="活力、年轻、撞色">🔥 活力撞色</span>
          <span class="cl-preset" data-v="极简、黑白灰">◻️ 极简黑白</span>
        </div>
        <div class="cl-input-row">
          <input class="cl-input" id="cl-input" placeholder="描述你想要的风格（如：梦幻紫色、赛博朋克...）">
          <button class="cl-go" id="cl-go">🎨 生成配色</button>
        </div>
        <div class="cl-result" id="cl-result"></div>
      `;
      container.appendChild(this.el);

      const input = this.el.querySelector('#cl-input');
      this.el.querySelectorAll('.cl-preset').forEach(p => {
        p.addEventListener('click', () => { input.value = p.dataset.v; });
      });
      this.el.querySelector('#cl-go').addEventListener('click', () => this.go());
    }

    async go() {
      const desc = this.el.querySelector('#cl-input').value.trim();
      if (!desc) return;
      const resultEl = this.el.querySelector('#cl-result');
      const goBtn = this.el.querySelector('#cl-go');
      goBtn.disabled = true;
      resultEl.className = 'cl-result show';
      resultEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary,#888);padding:1rem">生成中...</div>';

      const prompt = `请为"${desc}"生成一组5色配色方案。只输出JSON数组，格式：[{"hex":"#xxxxxx","name":"颜色名","usage":"用途建议"}]。不要输出其他内容。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 400 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const colors = JSON.parse(match[0]);
          this.renderPalette(colors);
        } else {
          resultEl.innerHTML = '<div style="color:var(--text-secondary,#888)">生成失败，请重试</div>';
        }
      } catch (e) { resultEl.innerHTML = '⚠️ 出错了，请重试'; }
      goBtn.disabled = false;
    }

    renderPalette(colors) {
      const resultEl = this.el.querySelector('#cl-result');
      const paletteHtml = colors.map(c =>
        `<div class="cl-color" style="background:${c.hex}" data-hex="${c.hex}" title="点击复制">
          <span class="hex">${c.hex}</span>
        </div>`
      ).join('');
      const infoHtml = colors.map(c =>
        `<div>🎨 <strong style="color:${c.hex}">${c.name}</strong> — ${c.hex} · ${c.usage || ''}</div>`
      ).join('');
      resultEl.innerHTML = `<div class="cl-palette">${paletteHtml}</div><div class="cl-info">${infoHtml}</div>`;
      resultEl.querySelectorAll('.cl-color').forEach(el => {
        el.addEventListener('click', () => {
          navigator.clipboard.writeText(el.dataset.hex);
          const toast = document.createElement('div');
          toast.className = 'cl-copied';
          toast.textContent = `已复制 ${el.dataset.hex}`;
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 1000);
        });
      });
    }
  }

  window.ColorGen = ColorGen;
  function init() { const el = document.getElementById('fish-color'); if (!el) return; new ColorGen().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
