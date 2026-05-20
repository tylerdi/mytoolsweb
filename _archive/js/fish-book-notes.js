/**
 * AI 读书笔记 📚
 * 输入书名，生成精华笔记
 */
(function() {
  'use strict';

  class BookNotes {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-book';
      this.el.innerHTML = `
        <style>
          .fish-book{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .bk-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .bk-header h3{font-size:1.1rem;margin:0}
          .bk-hot{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .bk-hot-btn{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem}
          .bk-hot-btn:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .bk-input-row{display:flex;gap:0.5rem;margin-bottom:0.75rem}
          .bk-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .bk-input:focus{border-color:var(--accent,#646cff)}
          .bk-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.2rem;cursor:pointer;font-size:0.85rem}
          .bk-go:disabled{opacity:0.5;cursor:not-allowed}
          .bk-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;max-height:500px;overflow-y:auto}
          .bk-output.show{display:block}
          .bk-output::-webkit-scrollbar{width:4px}
          .bk-output::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          .bk-act{display:none;gap:0.5rem;margin-top:0.75rem}
          .bk-act.show{display:flex}
          .bk-act-btn{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.8rem}
          .bk-act-btn:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-book{padding:1rem}.bk-input-row{flex-direction:column}.bk-go{width:100%}}
        </style>
        <div class="bk-header"><span>📚</span><h3>AI 读书笔记</h3></div>
        <div class="bk-hot">
          <span class="bk-hot-btn" data-v="人类简史">人类简史</span>
          <span class="bk-hot-btn" data-v="活着">活着</span>
          <span class="bk-hot-btn" data-v="三体">三体</span>
          <span class="bk-hot-btn" data-v="小王子">小王子</span>
          <span class="bk-hot-btn" data-v="思考快与慢">思考快与慢</span>
          <span class="bk-hot-btn" data-v="百年孤独">百年孤独</span>
        </div>
        <div class="bk-input-row">
          <input class="bk-input" id="bk-input" placeholder="输入书名...">
          <button class="bk-go" id="bk-go">📚 生成笔记</button>
        </div>
        <div class="bk-output" id="bk-output"></div>
        <div class="bk-act" id="bk-act">
          <button class="bk-act-btn" id="bk-copy">📋 复制笔记</button>
        </div>
      `;
      container.appendChild(this.el);
      const input = this.el.querySelector('#bk-input');
      this.el.querySelectorAll('.bk-hot-btn').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.v; }));
      this.el.querySelector('#bk-go').addEventListener('click', () => this.go());
      this.el.querySelector('#bk-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(this.el.querySelector('#bk-output').textContent);
        const btn = this.el.querySelector('#bk-copy'); btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制笔记', 1500);
      });
    }

    async go() {
      const book = this.el.querySelector('#bk-input').value.trim();
      if (!book) return;
      const outputEl = this.el.querySelector('#bk-output');
      const actEl = this.el.querySelector('#bk-act');
      const goBtn = this.el.querySelector('#bk-go');
      goBtn.disabled = true; goBtn.textContent = '生成中...';
      outputEl.className = 'bk-output show'; outputEl.textContent = '正在生成读书笔记...';
      actEl.classList.remove('show');

      const prompt = `请为《${book}》生成一份精华读书笔记。包含：1）一句话概括；2）作者简介；3）核心观点（3-5个）；4）金句摘录（3-5句）；5）读后思考。格式清晰，用emoji点缀。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 800 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '生成失败').replace(/\n/g, '<br>');
        actEl.classList.add('show');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '📚 生成笔记';
    }
  }

  window.BookNotes = BookNotes;
  function init() { const el = document.getElementById('fish-book-notes'); if (!el) return; new BookNotes().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
