/**
 * 脑筋急转弯 🤪
 * AI出题，猜谜游戏
 */
(function() {
  'use strict';

  class RiddleGame {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-riddle';
      this.el.innerHTML = `
        <style>
          .fish-riddle{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .rd-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
          .rd-header-left{display:flex;align-items:center;gap:0.5rem}
          .rd-header h3{font-size:1.1rem;margin:0}
          .rd-score{font-size:0.85rem;color:var(--accent,#646cff)}
          .rd-card{padding:1.5rem;background:var(--bg,#0a0a0a);border-radius:12px;text-align:center;min-height:150px;display:flex;flex-direction:column;justify-content:center}
          .rd-q{font-size:1.1rem;font-weight:600;margin-bottom:1rem;line-height:1.6}
          .rd-input-row{display:flex;gap:0.5rem;margin-bottom:1rem}
          .rd-input{flex:1;background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.9rem;outline:none;font-family:inherit}
          .rd-input:focus{border-color:var(--accent,#646cff)}
          .rd-btns{display:flex;gap:0.5rem}
          .rd-btn{flex:1;border:none;border-radius:10px;padding:0.6rem;cursor:pointer;font-size:0.85rem;transition:all 0.2s}
          .rd-submit{background:var(--accent,#646cff);color:#fff}
          .rd-submit:hover{background:#535bf2}
          .rd-hint{background:transparent;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888)}
          .rd-hint:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          .rd-answer{display:none;margin-top:1rem;padding:1rem;border-radius:10px;font-size:0.9rem;line-height:1.6}
          .rd-answer.correct{background:rgba(76,175,80,0.1);border:1px solid rgba(76,175,80,0.3);color:#4caf50}
          .rd-answer.wrong{background:rgba(244,67,54,0.08);border:1px solid rgba(244,67,54,0.2);color:#f44336}
          .rd-next{margin-top:0.75rem;background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem;width:100%;cursor:pointer;font-size:0.9rem}
          @media(max-width:640px){.fish-riddle{padding:1rem}}
        </style>
        <div class="rd-header">
          <div class="rd-header-left"><span>🤪</span><h3>脑筋急转弯</h3></div>
          <span class="rd-score" id="rd-score"></span>
        </div>
        <div class="rd-card" id="rd-card">
          <div class="rd-q" id="rd-q">准备好了吗？点击开始！</div>
        </div>
        <div class="rd-input-row" id="rd-input-row" style="display:none">
          <input class="rd-input" id="rd-input" placeholder="你的答案...">
        </div>
        <div class="rd-btns" id="rd-btns" style="margin-top:1rem">
          <button class="rd-btn rd-submit" id="rd-start">🤪 开始挑战</button>
        </div>
      `;
      container.appendChild(this.el);
      this.score = 0; this.round = 0; this.total = 5; this.hintUsed = false;
      this.el.querySelector('#rd-start').addEventListener('click', () => this.next());
    }

    async next() {
      if (this.round >= this.total) { this.showResult(); return; }
      this.round++; this.hintUsed = false;
      this.el.querySelector('#rd-card').innerHTML = '<div class="rd-q" style="color:var(--text-secondary,#888)">出题中...</div>';
      this.el.querySelector('#rd-input-row').style.display = 'none';
      this.el.querySelector('#rd-btns').innerHTML = '';

      const prompt = `请出一道脑筋急转弯。输出JSON：{"q":"题目","answer":"答案","hint":"提示（一句话）"}。只输出JSON，题目要有趣不常见。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 200 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) { this.el.querySelector('#rd-card').innerHTML = '<div class="rd-q">出题失败，点击重试</div>'; return; }
        this.current = JSON.parse(match[0]);
        this.renderQuestion();
      } catch (e) { this.el.querySelector('#rd-card').innerHTML = '<div class="rd-q">⚠️ 出题失败</div>'; }
    }

    renderQuestion() {
      this.el.querySelector('#rd-q').textContent = this.current.q;
      this.el.querySelector('#rd-input-row').style.display = '';
      this.el.querySelector('#rd-input').value = '';
      this.el.querySelector('#rd-input').focus();
      this.el.querySelector('#rd-btns').innerHTML = `
        <button class="rd-btn rd-submit" id="rd-submit">提交答案</button>
        <button class="rd-btn rd-hint" id="rd-hint-btn">💡 提示</button>
      `;
      this.el.querySelector('#rd-answer')?.remove();
      this.el.querySelector('#rd-submit').addEventListener('click', () => this.check());
      this.el.querySelector('#rd-hint-btn').addEventListener('click', () => {
        if (!this.hintUsed) {
          this.hintUsed = true;
          this.el.querySelector('#rd-hint-btn').textContent = this.current.hint;
          this.el.querySelector('#rd-hint-btn').disabled = true;
        }
      });
      this.el.querySelector('#rd-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') this.check();
      });
    }

    check() {
      const input = this.el.querySelector('#rd-input').value.trim();
      if (!input) return;
      const correct = this.current.answer;
      const isCorrect = input.includes(correct) || correct.includes(input);
      if (isCorrect) this.score++;
      this.el.querySelector('#rd-score').textContent = `${this.score}/${this.round}`;
      const div = document.createElement('div');
      div.className = `rd-answer ${isCorrect ? 'correct' : 'wrong'}`;
      div.innerHTML = isCorrect
        ? `✅ 正确！答案就是「${correct}」`
        : `❌ 不对哦，答案是「${correct}」`;
      this.el.querySelector('#rd-card').appendChild(div);
      div.style.display = '';
      this.el.querySelector('#rd-btns').innerHTML = `<button class="rd-btn rd-submit" id="rd-next" style="flex:1">下一题 →</button>`;
      this.el.querySelector('#rd-next').addEventListener('click', () => this.next());
      this.el.querySelector('#rd-input-row').style.display = 'none';
    }

    showResult() {
      const pct = Math.round(this.score / this.total * 100);
      const grade = pct >= 80 ? '🏆 脑筋王者！' : pct >= 60 ? '👏 不错不错' : pct >= 40 ? '😊 还行吧' : '🤪 再练练';
      this.el.querySelector('#rd-card').innerHTML = `
        <div style="font-size:2.5rem;margin-bottom:0.5rem">${grade}</div>
        <div style="font-size:1.5rem;font-weight:800;margin-bottom:0.5rem">${this.score}/${this.total}</div>
        <div style="color:var(--text-secondary,#888)">正确率 ${pct}%</div>
      `;
      this.el.querySelector('#rd-input-row').style.display = 'none';
      this.el.querySelector('#rd-btns').innerHTML = `<button class="rd-btn rd-submit" style="flex:1" onclick="location.reload()">再来一轮</button>`;
    }
  }

  window.RiddleGame = RiddleGame;
  function init() { const el = document.getElementById('fish-riddle'); if (!el) return; new RiddleGame().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
