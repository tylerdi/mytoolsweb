/**
 * AI 歌词创作 🎵
 * 输入主题/心情，AI写歌词
 */
(function() {
  'use strict';

  class LyricWriter {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-lyric';
      this.el.innerHTML = `
        <style>
          .fish-lyric{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .ly-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .ly-header h3{font-size:1.1rem;margin:0}
          .ly-moods{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .ly-mood{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem}
          .ly-mood:hover,.ly-mood.active{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .ly-styles{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .ly-style{background:rgba(255,255,255,0.04);border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.25rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.75rem}
          .ly-style.active{background:rgba(100,108,255,0.15);border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .ly-input{width:100%;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit;margin-bottom:0.75rem}
          .ly-input:focus{border-color:var(--accent,#646cff)}
          .ly-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem}
          .ly-go:disabled{opacity:0.5;cursor:not-allowed}
          .ly-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;margin-top:1rem;font-size:0.9rem;line-height:2;white-space:pre-wrap;font-family:'LXGW WenKai',serif}
          .ly-output.show{display:block}
          .ly-actions{display:none;gap:0.5rem;margin-top:0.75rem}
          .ly-actions.show{display:flex}
          .ly-act{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.8rem}
          .ly-act:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-lyric{padding:1rem}.ly-go{width:100%}}
        </style>
        <div class="ly-header"><span>🎵</span><h3>AI 歌词创作</h3></div>
        <div class="ly-moods">
          <span class="ly-mood" data-v="开心">😊 开心</span>
          <span class="ly-mood" data-v="伤感">😢 伤感</span>
          <span class="ly-mood" data-v="思念">💭 思念</span>
          <span class="ly-mood" data-v="励志">🔥 励志</span>
          <span class="ly-mood" data-v="恋爱">💕 恋爱</span>
          <span class="ly-mood" data-v="孤独">🌙 孤独</span>
        </div>
        <div class="ly-styles">
          <span class="ly-style active" data-v="流行">🎤 流行</span>
          <span class="ly-style" data-v="民谣">🎸 民谣</span>
          <span class="ly-style" data-v="说唱">🎧 说唱</span>
          <span class="ly-style" data-v="古风">🏮 古风</span>
          <span class="ly-style" data-v="摇滚">🤘 摇滚</span>
          <span class="ly-style" data-v="R&B">🎷 R&B</span>
        </div>
        <input class="ly-input" id="ly-input" placeholder="描述你想表达的内容或故事...">
        <button class="ly-go" id="ly-go">🎵 开始创作</button>
        <div class="ly-output" id="ly-output"></div>
        <div class="ly-actions" id="ly-actions">
          <button class="ly-act" id="ly-copy">📋 复制歌词</button>
        </div>
      `;
      container.appendChild(this.el);

      this.style = '流行';
      this.el.querySelectorAll('.ly-mood').forEach(m => m.addEventListener('click', () => {
        const input = this.el.querySelector('#ly-input');
        input.value = m.dataset.v + '的' + input.value.replace(/^(开心|伤感|思念|励志|恋爱|孤独)的/, '');
      }));
      this.el.querySelectorAll('.ly-style').forEach(s => s.addEventListener('click', () => {
        this.el.querySelectorAll('.ly-style').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        this.style = s.dataset.v;
      }));
      this.el.querySelector('#ly-go').addEventListener('click', () => this.go());
      this.el.querySelector('#ly-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(this.el.querySelector('#ly-output').textContent);
        const btn = this.el.querySelector('#ly-copy'); btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制歌词', 1500);
      });
    }

    async go() {
      const desc = this.el.querySelector('#ly-input').value.trim();
      if (!desc) return;
      const outputEl = this.el.querySelector('#ly-output');
      const actionsEl = this.el.querySelector('#ly-actions');
      const goBtn = this.el.querySelector('#ly-go');
      goBtn.disabled = true; goBtn.textContent = '创作中...';
      outputEl.className = 'ly-output show'; outputEl.textContent = '正在写词...';
      actionsEl.classList.remove('show');

      const prompt = `请写一首${this.style}风格的中文歌词。主题/心情：${desc}。要求：有主歌、副歌结构，押韵，有画面感。只输出歌词，不要解释。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 600 })
        });
        const data = await res.json();
        outputEl.textContent = data.choices?.[0]?.message?.content || '创作失败，请重试';
        actionsEl.classList.add('show');
      } catch (e) { outputEl.textContent = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '🎵 开始创作';
    }
  }

  window.LyricWriter = LyricWriter;
  function init() { const el = document.getElementById('fish-lyric-writer'); if (!el) return; new LyricWriter().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
