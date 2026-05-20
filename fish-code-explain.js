/**
 * AI 代码解释器 💻
 * 粘贴代码，AI逐行解读
 */
(function() {
  'use strict';

  class CodeExplainer {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-code';
      this.el.innerHTML = `
        <style>
          .fish-code{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .ce-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .ce-header h3{font-size:1.1rem;margin:0}
          .ce-textarea{width:100%;min-height:120px;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.75rem 1rem;color:#4ade80;font-size:0.85rem;outline:none;font-family:'SF Mono',Monaco,Consolas,monospace;resize:vertical;line-height:1.6;margin-bottom:0.75rem;tab-size:2}
          .ce-textarea:focus{border-color:var(--accent,#646cff)}
          .ce-textarea::placeholder{color:#555}
          .ce-actions{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem}
          .ce-btn{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.78rem}
          .ce-btn:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .ce-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem}
          .ce-go:disabled{opacity:0.5;cursor:not-allowed}
          .ce-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem}
          .ce-output.show{display:block}
          .ce-output pre{background:#111;padding:0.75rem;border-radius:8px;overflow-x:auto;font-size:0.82rem;line-height:1.5;margin:0.5rem 0}
          @media(max-width:640px){.fish-code{padding:1rem}.ce-go{width:100%}}
        </style>
        <div class="ce-header"><span>💻</span><h3>AI 代码解释器</h3></div>
        <textarea class="ce-textarea" id="ce-code" placeholder="粘贴你的代码到这里..." spellcheck="false"></textarea>
        <div class="ce-actions">
          <span class="ce-btn" data-m="逐行解释这段代码，标注关键逻辑">📖 逐行解释</span>
          <span class="ce-btn" data-m="找出这段代码的潜在bug和改进建议">🐛 找Bug</span>
          <span class="ce-btn" data-m="优化这段代码的性能和可读性">⚡ 优化建议</span>
          <span class="ce-btn" data-m="用简单的语言解释这段代码是做什么的，适合新手理解">👶 小白版</span>
          <span class="ce-btn" data-m="检查这段代码的安全漏洞和风险">🔒 安全检查</span>
          <span class="ce-btn" data-m="将这段代码转换为等价的Python代码">🐍 转Python</span>
          <span class="ce-btn" data-m="将这段代码转换为等价的JavaScript代码">📜 转JS</span>
        </div>
        <button class="ce-go" id="ce-go">💻 解读代码</button>
        <div class="ce-output" id="ce-output"></div>
      `;
      container.appendChild(this.el);
      this.mode = '逐行解释这段代码，标注关键逻辑';
      this.el.querySelectorAll('.ce-btn').forEach(b => b.addEventListener('click', () => {
        this.mode = b.dataset.m;
        this.el.querySelector('#ce-code').value && this.go();
      }));
      this.el.querySelector('#ce-go').addEventListener('click', () => this.go());
    }

    async go() {
      const code = this.el.querySelector('#ce-code').value.trim();
      if (!code) return;
      const outputEl = this.el.querySelector('#ce-output');
      const goBtn = this.el.querySelector('#ce-go');
      goBtn.disabled = true; goBtn.textContent = '解读中...';
      outputEl.className = 'ce-output show'; outputEl.textContent = '正在分析代码...';

      const prompt = `${this.mode}：\n\n\`\`\`\n${code}\n\`\`\`\n\n用中文回答，格式清晰。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 800 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '解读失败').replace(/\n/g, '<br>').replace(/`([^`]+)`/g, '<code style="background:#222;padding:0.1rem 0.3rem;border-radius:3px;color:#4ade80">$1</code>');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '💻 解读代码';
    }
  }

  window.CodeExplainer = CodeExplainer;
  function init() { const el = document.getElementById('fish-code-explain'); if (!el) return; new CodeExplainer().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
