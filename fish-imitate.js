/**
 * AI 模仿写作 🎤
 * 选一个名人/风格，用那个风格重写你的话
 */
(function() {
  'use strict';

  const STYLES = [
    { name: '鲁迅', emoji: '✒️', desc: '犀利、讽刺、一针见血' },
    { name: '李白', emoji: '🌙', desc: '豪放飘逸、诗意盎然' },
    { name: '郭敬明', emoji: '✨', desc: '华丽忧伤、青春疼痛' },
    { name: '余华', emoji: '🚬', desc: '冷静克制、黑色幽默' },
    { name: '刘慈欣', emoji: '🌌', desc: '宏大叙事、硬核科幻' },
    { name: '甲方', emoji: '💼', desc: '五彩斑斓的黑' },
    { name: '东北老铁', emoji: '🧊', desc: '嘎嘎热情、贼有意思' },
    { name: '甄嬛传', emoji: '👑', desc: '本宫说话要讲究' },
    { name: '小学生作文', emoji: '📚', desc: '今天天气真好啊' },
    { name: 'rapper', emoji: '🎤', desc: 'yo yo check it out' },
  ];

  class ImitateWriter {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-imitate';
      this.el.innerHTML = `
        <style>
          .fish-imitate{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .im-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .im-header h3{font-size:1.1rem;margin:0}
          .im-styles{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1rem}
          .im-style-btn{background:rgba(100,108,255,0.06);border:1px solid rgba(100,108,255,0.15);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem;transition:all 0.2s}
          .im-style-btn.active,.im-style-btn:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .im-input{width:100%;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.75rem 1rem;color:var(--text,#e8e8e8);font-size:0.9rem;outline:none;font-family:inherit;min-height:60px;resize:vertical;margin-bottom:0.75rem}
          .im-input:focus{border-color:var(--accent,#646cff)}
          .im-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;transition:background 0.2s}
          .im-go:hover{background:#535bf2}
          .im-go:disabled{opacity:0.5;cursor:not-allowed}
          .im-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;margin-top:1rem;line-height:1.8;font-size:0.9rem}
          .im-output.show{display:block}
          .im-output .label{font-size:0.75rem;color:var(--text-secondary,#888);margin-bottom:0.5rem}
          .im-output .copy-btn{float:right;background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.2rem 0.5rem;border-radius:6px;cursor:pointer;font-size:0.7rem}
          .im-output .copy-btn:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-imitate{padding:1rem}.im-styles{gap:0.3rem}.im-style-btn{padding:0.25rem 0.5rem;font-size:0.7rem}.im-go{width:100%}}
        </style>
        <div class="im-header"><span>🎤</span><h3>AI 模仿写作</h3></div>
        <div class="im-styles" id="im-styles"></div>
        <textarea class="im-input" id="im-input" placeholder="输入你想让AI重写的一段话..."></textarea>
        <button class="im-go" id="im-go">✨ 开始模仿</button>
        <div class="im-output" id="im-output"></div>
      `;
      container.appendChild(this.el);

      this.style = '鲁迅';
      const stylesEl = this.el.querySelector('#im-styles');
      STYLES.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'im-style-btn' + (s.name === '鲁迅' ? ' active' : '');
        btn.textContent = `${s.emoji} ${s.name}`;
        btn.title = s.desc;
        btn.addEventListener('click', () => {
          this.el.querySelectorAll('.im-style-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.style = s.name;
        });
        stylesEl.appendChild(btn);
      });

      this.el.querySelector('#im-go').addEventListener('click', () => this.go());
    }

    async go() {
      const text = this.el.querySelector('#im-input').value.trim();
      if (!text) return;
      const outputEl = this.el.querySelector('#im-output');
      const goBtn = this.el.querySelector('#im-go');
      goBtn.disabled = true;
      goBtn.textContent = '创作中...';
      outputEl.className = 'im-output show';
      outputEl.innerHTML = '<div class="label">正在模仿...</div>';

      const styleObj = STYLES.find(s => s.name === this.style);
      const prompt = `请用"${this.style}"的风格重写以下内容。要模仿得像，体现出${styleObj?.desc || ''}的特点。只输出重写后的内容，不要解释。\n\n原文：${text}`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 500 })
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || data.content || '模仿失败...';
        outputEl.innerHTML = `
          <button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.querySelector('.content').textContent);this.textContent='✅';setTimeout(()=>this.textContent='📋 复制',1500)">📋 复制</button>
          <div class="label">${styleObj?.emoji || ''} ${this.style} 风格：</div>
          <div class="content">${reply.replace(/\n/g, '<br>')}</div>
        `;
      } catch (e) {
        outputEl.innerHTML = '<div class="label">⚠️ 生成失败，请重试</div>';
      }
      goBtn.disabled = false;
      goBtn.textContent = '✨ 开始模仿';
    }
  }

  window.ImitateWriter = ImitateWriter;

  function initImitateWriter() { const el = document.getElementById("fish-imitate"); if (!el) return; new ImitateWriter().build(el); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initImitateWriter);
  else initImitateWriter();
})();
