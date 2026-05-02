/**
 * AI 故事接龙 🎭
 * 用户写一句，AI接一句，轮流创作
 */
(function() {
  'use strict';

  class StoryGame {
    constructor() {
      this.history = [];
      this.style = 'random';
      this.running = false;
    }

    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-story-game';
      this.el.innerHTML = `
        <style>
          .fish-story-game{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .sg-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .sg-header h3{font-size:1.1rem;margin:0}
          .sg-styles{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:1rem}
          .sg-style-btn{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:20px;cursor:pointer;font-size:0.8rem;transition:all 0.2s}
          .sg-style-btn.active,.sg-style-btn:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .sg-story{min-height:200px;max-height:400px;overflow-y:auto;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;margin-bottom:1rem;line-height:1.8;font-size:0.95rem}
          .sg-story::-webkit-scrollbar{width:4px}
          .sg-story::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          .sg-line{margin-bottom:0.5rem}
          .sg-line.user{color:#e8e8e8}
          .sg-line.ai{color:var(--accent,#646cff)}
          .sg-line .label{font-size:0.75rem;color:var(--text-secondary,#888);margin-right:0.25rem}
          .sg-input-area{display:flex;gap:0.5rem}
          .sg-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.7rem 1rem;color:var(--text,#e8e8e8);font-size:0.9rem;outline:none;font-family:inherit}
          .sg-input:focus{border-color:var(--accent,#646cff)}
          .sg-send{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.7rem 1.2rem;cursor:pointer;font-size:0.9rem;transition:background 0.2s}
          .sg-send:hover{background:#535bf2}
          .sg-send:disabled{opacity:0.5;cursor:not-allowed}
          .sg-actions{display:flex;gap:0.5rem;margin-top:0.75rem}
          .sg-action-btn{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.8rem;transition:all 0.2s}
          .sg-action-btn:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-story-game{padding:1rem}}
        </style>
        <div class="sg-header"><span>🎭</span><h3>AI 故事接龙</h3></div>
        <div class="sg-styles">
          <button class="sg-style-btn active" data-style="random">🎲 随机</button>
          <button class="sg-style-btn" data-style="wuxia">⚔️ 武侠</button>
          <button class="sg-style-btn" data-style="scifi">🚀 科幻</button>
          <button class="sg-style-btn" data-style="horror">👻 悬疑</button>
          <button class="sg-style-btn" data-style="funny">😂 搞笑</button>
          <button class="sg-style-btn" data-style="romance">💕 言情</button>
        </div>
        <div class="sg-story" id="sg-story"></div>
        <div class="sg-input-area">
          <input class="sg-input" id="sg-input" placeholder="写一句开头，AI帮你接下去..." maxlength="200">
          <button class="sg-send" id="sg-send">发送</button>
        </div>
        <div class="sg-actions">
          <button class="sg-action-btn" id="sg-new">🔄 新故事</button>
          <button class="sg-action-btn" id="sg-export">📋 复制全文</button>
        </div>
      `;
      container.appendChild(this.el);

      this.storyEl = this.el.querySelector('#sg-story');
      this.inputEl = this.el.querySelector('#sg-input');
      this.sendBtn = this.el.querySelector('#sg-send');

      this.el.querySelectorAll('.sg-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.el.querySelectorAll('.sg-style-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.style = btn.dataset.style;
        });
      });

      this.sendBtn.addEventListener('click', () => this.send());
      this.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }});
      this.el.querySelector('#sg-new').addEventListener('click', () => this.reset());
      this.el.querySelector('#sg-export').addEventListener('click', () => this.exportStory());
    }

    async send() {
      const text = this.inputEl.value.trim();
      if (!text || this.running) return;
      this.inputEl.value = '';
      this.addLine('user', text);
      this.history.push({ role: 'user', content: text });
      this.running = true;
      this.sendBtn.disabled = true;
      this.sendBtn.textContent = '思考中...';

      const styleMap = {
        random: '随机风格', wuxia: '武侠小说风格', scifi: '科幻小说风格',
        horror: '悬疑惊悚风格', funny: '幽默搞笑风格', romance: '浪漫言情风格'
      };
      const styleName = styleMap[this.style] || '随机风格';
      const sysPrompt = `你是一个故事接龙高手。用户会写一段故事的开头或中间内容，你需要自然地接下去，写2-4句话推进剧情。风格要求：${styleName}。注意：1）要自然衔接用户的内容；2）推进剧情但不要结尾；3）保持趣味性和悬念；4）不要重复用户已写的内容。`;

      try {
        const messages = [
          { role: 'system', content: sysPrompt },
          ...this.history.slice(-10)
        ];
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages, stream: false, max_tokens: 300 })
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || data.content || '嗯...让我想想怎么接...';
        this.addLine('ai', reply);
        this.history.push({ role: 'assistant', content: reply });
      } catch (e) {
        this.addLine('ai', '⚠️ 出错了，再试一次？');
      }
      this.running = false;
      this.sendBtn.disabled = false;
      this.sendBtn.textContent = '发送';
    }

    addLine(role, text) {
      const div = document.createElement('div');
      div.className = `sg-line ${role}`;
      div.innerHTML = `<span class="label">${role === 'user' ? '✍️ 你' : '🎭 AI'}</span>${this.escapeHtml(text)}`;
      this.storyEl.appendChild(div);
      this.storyEl.scrollTop = this.storyEl.scrollHeight;
    }

    reset() {
      this.history = [];
      this.storyEl.innerHTML = '';
      const hint = document.createElement('div');
      hint.style.cssText = 'color:var(--text-secondary,#888);text-align:center;padding:2rem 0;font-size:0.9rem';
      hint.textContent = '写一句开头，开始你的故事...';
      this.storyEl.appendChild(hint);
    }

    exportStory() {
      const text = this.history.map(h => (h.role === 'user' ? '✍️ ' : '🎭 ') + h.content).join('\n\n');
      navigator.clipboard.writeText(text).then(() => {
        const btn = this.el.querySelector('#sg-export');
        btn.textContent = '✅ 已复制';
        setTimeout(() => btn.textContent = '📋 复制全文', 1500);
      });
    }

    escapeHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
  }

  window.StoryGame = StoryGame;

  function initStoryGame() { const el = document.getElementById("fish-story-game"); if (!el) return; const g = new StoryGame(); g.build(el); g.reset(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initStoryGame);
  else initStoryGame();
})();
