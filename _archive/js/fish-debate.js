/**
 * AI 辩论赛 🤖
 * 正方反方自我辩论，用户投票
 */
(function() {
  'use strict';

  class DebateGame {
    constructor() {
      this.rounds = 0;
      this.maxRounds = 4;
      this.running = false;
      this.topic = '';
    }

    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-debate';
      this.el.innerHTML = `
        <style>
          .fish-debate{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .db-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .db-header h3{font-size:1.1rem;margin:0}
          .db-topics{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem}
          .db-topic-btn{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:20px;cursor:pointer;font-size:0.8rem;transition:all 0.2s}
          .db-topic-btn:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .db-custom{display:flex;gap:0.5rem;margin-bottom:1rem}
          .db-custom input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .db-custom input:focus{border-color:var(--accent,#646cff)}
          .db-custom button{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1rem;cursor:pointer;font-size:0.85rem}
          .db-arena{min-height:200px;max-height:500px;overflow-y:auto;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;margin-bottom:1rem}
          .db-arena::-webkit-scrollbar{width:4px}
          .db-arena::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          .db-turn{margin-bottom:1rem;padding:0.75rem 1rem;border-radius:10px;font-size:0.9rem;line-height:1.7}
          .db-turn.pro{background:rgba(76,175,80,0.08);border-left:3px solid #4caf50}
          .db-turn.con{background:rgba(244,67,54,0.08);border-left:3px solid #f44336}
          .db-turn .side{font-size:0.75rem;font-weight:700;margin-bottom:0.25rem}
          .db-turn.pro .side{color:#4caf50}
          .db-turn.con .side{color:#f44336}
          .db-round{font-size:0.8rem;color:var(--text-secondary,#888);text-align:center;margin:0.5rem 0}
          .db-vote{display:none;gap:1rem;justify-content:center;margin-top:1rem}
          .db-vote.show{display:flex}
          .db-vote-btn{padding:0.7rem 1.5rem;border-radius:10px;border:2px solid;cursor:pointer;font-size:0.9rem;font-weight:600;transition:all 0.2s;background:transparent}
          .db-vote-btn.pro-btn{border-color:#4caf50;color:#4caf50}
          .db-vote-btn.pro-btn:hover{background:rgba(76,175,80,0.15)}
          .db-vote-btn.con-btn{border-color:#f44336;color:#f44336}
          .db-vote-btn.con-btn:hover{background:rgba(244,67,54,0.15)}
          .db-result{display:none;text-align:center;padding:1rem;font-size:1.1rem;font-weight:700}
          .db-result.show{display:block}
          .db-status{text-align:center;color:var(--text-secondary,#888);font-size:0.85rem;margin-top:0.5rem}
          @media(max-width:640px){.fish-debate{padding:1rem}.db-custom{flex-direction:column}.db-custom button{width:100%}.db-topics{gap:0.3rem}.db-topic-btn{padding:0.3rem 0.5rem;font-size:0.72rem}.db-vote{flex-direction:column;gap:0.5rem}.db-vote-btn{width:100%}}
        </style>
        <div class="db-header"><span>🤖</span><h3>AI 辩论赛</h3></div>
        <div class="db-topics">
          <button class="db-topic-btn" data-topic="AI会取代人类大部分工作">AI会取代人类工作？</button>
          <button class="db-topic-btn" data-topic="996工作制是否合理">996合理吗？</button>
          <button class="db-topic-btn" data-topic="远程办公比坐班更高效">远程 vs 坐班？</button>
          <button class="db-topic-btn" data-topic="大学学历还有用吗">学历还有用吗？</button>
          <button class="db-topic-btn" data-topic="社交媒体让人更孤独还是更 connected">社交媒体让人孤独？</button>
        </div>
        <div class="db-custom">
          <input id="db-input" placeholder="输入自定义辩题..." maxlength="50">
          <button id="db-start">开始辩论</button>
        </div>
        <div class="db-arena" id="db-arena">
          <div style="color:var(--text-secondary,#888);text-align:center;padding:2rem 0;font-size:0.9rem">选择一个辩题，或输入自定义辩题，开始观战</div>
        </div>
        <div class="db-vote" id="db-vote">
          <button class="db-vote-btn pro-btn" id="db-vote-pro">👍 支持正方</button>
          <button class="db-vote-btn con-btn" id="db-vote-con">👍 支持反方</button>
        </div>
        <div class="db-result" id="db-result"></div>
        <div class="db-status" id="db-status"></div>
      `;
      container.appendChild(this.el);

      this.arenaEl = this.el.querySelector('#db-arena');
      this.voteEl = this.el.querySelector('#db-vote');
      this.resultEl = this.el.querySelector('#db-result');
      this.statusEl = this.el.querySelector('#db-status');

      this.el.querySelectorAll('.db-topic-btn').forEach(btn => {
        btn.addEventListener('click', () => this.start(btn.dataset.topic));
      });
      this.el.querySelector('#db-start').addEventListener('click', () => {
        const v = this.el.querySelector('#db-input').value.trim();
        if (v) this.start(v);
      });
      this.el.querySelector('#db-vote-pro').addEventListener('click', () => this.vote('pro'));
      this.el.querySelector('#db-vote-con').addEventListener('click', () => this.vote('con'));
    }

    async start(topic) {
      this.topic = topic;
      this.rounds = 0;
      this.running = true;
      this.arenaEl.innerHTML = '';
      this.voteEl.classList.remove('show');
      this.resultEl.classList.remove('show');
      this.statusEl.textContent = '';

      this.history = [
        { role: 'system', content: `你是一个辩论赛主持人和辩手。辩题是"${topic}"。你需要模拟正方（支持）和反方（反对）的辩论。规则：1）每轮先输出正方论点，再输出反方论点；2）每方2-3句话，要有理有据；3）后续轮要回应对方上一轮的论点；4）保持礼貌但犀利。输出格式严格为：【正方】论点内容\\n\\n【反方】论点内容` }
      ];

      for (let i = 0; i < this.maxRounds; i++) {
        this.statusEl.textContent = `第 ${i+1} / ${this.maxRounds} 轮 辩论中...`;
        if (i > 0) this.arenaEl.innerHTML += `<div class="db-round">—— 第 ${i+1} 轮 ——</div>`;

        const roundPrompt = i === 0
          ? `请开始第${i+1}轮辩论，围绕"${topic}"展开，分别陈述正方和反方的开篇立论。`
          : `请进行第${i+1}轮辩论。正方要回应反方上一轮的论点并补充新论据，反方同理。越来越深入，越来越犀利。`;

        this.history.push({ role: 'user', content: roundPrompt });

        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: this.history, stream: false, max_tokens: 500 })
          });
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content || data.content || '...';
          this.history.push({ role: 'assistant', content: reply });
          this.renderTurns(reply);
        } catch (e) {
          this.arenaEl.innerHTML += '<div style="color:#f44336;text-align:center">⚠️ 辩论中断，请重试</div>';
          break;
        }
      }

      this.running = false;
      this.voteEl.classList.add('show');
      this.statusEl.textContent = '辩论结束！请投票选出你心中的胜方 👇';
    }

    renderTurns(text) {
      const parts = text.split(/\n+/);
      for (const p of parts) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        const isPro = trimmed.includes('【正方】') || trimmed.includes('正方：');
        const isCon = trimmed.includes('【反方】') || trimmed.includes('反方：');
        const side = isPro ? 'pro' : isCon ? 'con' : (this.arenaEl.children.length % 2 === 0 ? 'pro' : 'con');
        const cleanText = trimmed.replace(/【[正反]方】|^[正反]方[：:]\s*/g, '');
        if (!cleanText) continue;
        const div = document.createElement('div');
        div.className = `db-turn ${side}`;
        div.innerHTML = `<div class="side">${side === 'pro' ? '🟢 正方' : '🔴 反方'}</div>${cleanText.replace(/\n/g, '<br>')}`;
        this.arenaEl.appendChild(div);
      }
      this.arenaEl.scrollTop = this.arenaEl.scrollHeight;
    }

    vote(side) {
      this.voteEl.classList.remove('show');
      const emoji = side === 'pro' ? '🟢' : '🔴';
      const name = side === 'pro' ? '正方' : '反方';
      this.resultEl.textContent = `${emoji} 你支持了${name}！感谢参与投票 🎉`;
      this.resultEl.classList.add('show');
    }
  }

  window.DebateGame = DebateGame;

  function initDebateGame() { const el = document.getElementById("fish-debate"); if (!el) return; new DebateGame().build(el); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDebateGame);
  else initDebateGame();
})();
