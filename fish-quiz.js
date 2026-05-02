/**
 * AI 知识闯关 🧠
 * AI出题，用户答题，计分
 */
(function() {
  'use strict';

  class QuizGame {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-quiz';
      this.score = 0;
      this.round = 0;
      this.maxRound = 10;
      this.answered = false;
      this.el.innerHTML = `
        <style>
          .fish-quiz{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .qz-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
          .qz-header-left{display:flex;align-items:center;gap:0.5rem}
          .qz-header h3{font-size:1.1rem;margin:0}
          .qz-score{font-size:0.85rem;color:var(--accent,#646cff);font-weight:700}
          .qz-cats{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem}
          .qz-cat{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.35rem 0.7rem;border-radius:8px;cursor:pointer;font-size:0.8rem}
          .qz-cat:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .qz-area{padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;min-height:200px}
          .qz-question{font-size:1rem;font-weight:600;margin-bottom:1rem;line-height:1.6}
          .qz-options{display:flex;flex-direction:column;gap:0.5rem}
          .qz-opt{background:rgba(255,255,255,0.03);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;cursor:pointer;font-size:0.9rem;transition:all 0.2s;text-align:left;color:var(--text,#e8e8e8)}
          .qz-opt:hover:not(.disabled){border-color:var(--accent,#646cff);background:rgba(100,108,255,0.08)}
          .qz-opt.correct{border-color:#4caf50;background:rgba(76,175,80,0.15);color:#4caf50}
          .qz-opt.wrong{border-color:#f44336;background:rgba(244,67,54,0.1);color:#f44336}
          .qz-opt.disabled{cursor:default;opacity:0.7}
          .qz-explain{margin-top:0.75rem;font-size:0.85rem;color:var(--text-secondary,#888);line-height:1.6}
          .qz-next{margin-top:1rem;background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;width:100%}
          .qz-next:hover{background:#535bf2}
          .qz-start{text-align:center;padding:2rem 0}
          .qz-start p{color:var(--text-secondary,#888);margin-bottom:1rem}
          .qz-start button{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.7rem 2rem;cursor:pointer;font-size:1rem}
          .qz-result{text-align:center;padding:1.5rem 0}
          .qz-result .big{font-size:2rem;font-weight:800;margin-bottom:0.5rem}
          @media(max-width:640px){.fish-quiz{padding:1rem}}
        </style>
        <div class="qz-header">
          <div class="qz-header-left"><span>🧠</span><h3>AI 知识闯关</h3></div>
          <span class="qz-score" id="qz-score"></span>
        </div>
        <div class="qz-cats">
          <span class="qz-cat" data-v="科技">💻 科技</span>
          <span class="qz-cat" data-v="历史">📜 历史</span>
          <span class="qz-cat" data-v="文学">📖 文学</span>
          <span class="qz-cat" data-v="生活常识">🏠 生活</span>
          <span class="qz-cat" data-v="地理">🌍 地理</span>
          <span class="qz-cat" data-v="综合">🎲 综合</span>
        </div>
        <div class="qz-area" id="qz-area">
          <div class="qz-start"><p>选择类别开始答题</p></div>
        </div>
      `;
      container.appendChild(this.el);

      this.areaEl = this.el.querySelector('#qz-area');
      this.scoreEl = this.el.querySelector('#qz-score');
      this.el.querySelectorAll('.qz-cat').forEach(c => c.addEventListener('click', () => this.start(c.dataset.v)));
    }

    async start(category) {
      this.score = 0; this.round = 0; this.category = category;
      this.scoreEl.textContent = '';
      this.next();
    }

    async next() {
      if (this.round >= this.maxRound) { this.showResult(); return; }
      this.round++;
      this.answered = false;
      this.areaEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary,#888);padding:2rem">出题中...</div>';
      this.scoreEl.textContent = `${this.score}/${this.round - 1}`;

      const prompt = `请出一道${this.category}相关的单选题。严格按JSON格式输出：{"q":"题目","A":"选项A","B":"选项B","C":"选项C","D":"选项D","answer":"A","explain":"解释"}。只输出JSON，不要其他内容。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 300 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) { this.areaEl.innerHTML = '出题失败，点击重试'; return; }
        const q = JSON.parse(match[0]);
        this.renderQuestion(q);
      } catch (e) { this.areaEl.innerHTML = '⚠️ 出题失败'; }
    }

    renderQuestion(q) {
      this.areaEl.innerHTML = `
        <div class="qz-question">第 ${this.round} 题：${q.q}</div>
        <div class="qz-options">
          ${['A','B','C','D'].map(k => `<button class="qz-opt" data-key="${k}">${k}. ${q[k]}</button>`).join('')}
        </div>
        <div class="qz-explain" id="qz-explain" style="display:none"></div>
        <button class="qz-next" id="qz-next" style="display:none">下一题 →</button>
      `;
      this.areaEl.querySelectorAll('.qz-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.answered) return;
          this.answered = true;
          const chosen = btn.dataset.key;
          const correct = q.answer;
          if (chosen === correct) { this.score++; btn.classList.add('correct'); }
          else { btn.classList.add('wrong'); this.areaEl.querySelector(`[data-key="${correct}"]`).classList.add('correct'); }
          this.areaEl.querySelectorAll('.qz-opt').forEach(b => b.classList.add('disabled'));
          this.scoreEl.textContent = `${this.score}/${this.round}`;
          const explainEl = this.areaEl.querySelector('#qz-explain');
          explainEl.textContent = q.explain || '';
          explainEl.style.display = '';
          this.areaEl.querySelector('#qz-next').style.display = '';
        });
      });
      this.areaEl.querySelector('#qz-next').addEventListener('click', () => this.next());
    }

    showResult() {
      const pct = Math.round(this.score / this.maxRound * 100);
      const grade = pct >= 90 ? '🏆 大神！' : pct >= 70 ? '👏 不错！' : pct >= 50 ? '😊 还行' : '📚 继续加油';
      this.areaEl.innerHTML = `
        <div class="qz-result">
          <div class="big">${this.score}/${this.maxRound}</div>
          <div style="font-size:1.1rem;margin-bottom:0.5rem">${grade}</div>
          <div style="color:var(--text-secondary,#888)">正确率 ${pct}% · 分类：${this.category}</div>
          <button class="qz-next" style="margin-top:1rem" onclick="location.reload()">再来一轮</button>
        </div>
      `;
    }
  }

  window.QuizGame = QuizGame;
  function init() { const el = document.getElementById('fish-quiz'); if (!el) return; new QuizGame().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
