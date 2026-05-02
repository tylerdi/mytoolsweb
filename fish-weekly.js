/**
 * AI 周报生成器 📝
 * 输入关键词，生成专业周报
 */
(function() {
  'use strict';

  class WeeklyReport {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-weekly';
      this.el.innerHTML = `
        <style>
          .fish-weekly{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .wk-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .wk-header h3{font-size:1.1rem;margin:0}
          .wk-form{display:flex;flex-direction:column;gap:0.75rem;margin-bottom:1rem}
          .wk-row{display:flex;gap:0.5rem;align-items:center}
          .wk-label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:60px;flex-shrink:0}
          .wk-input,.wk-textarea{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:0.5rem 0.75rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .wk-input:focus,.wk-textarea:focus{border-color:var(--accent,#646cff)}
          .wk-textarea{min-height:60px;resize:vertical}
          .wk-styles{display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem}
          .wk-style-btn{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem;transition:all 0.2s}
          .wk-style-btn.active,.wk-style-btn:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .wk-gen-btn{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;align-self:flex-end;transition:background 0.2s}
          .wk-gen-btn:hover{background:#535bf2}
          .wk-gen-btn:disabled{opacity:0.5;cursor:not-allowed}
          .wk-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;white-space:pre-wrap}
          .wk-output.show{display:block}
          .wk-output::-webkit-scrollbar{width:4px}
          .wk-output::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          .wk-actions{display:none;gap:0.5rem;margin-top:0.75rem}
          .wk-actions.show{display:flex}
          .wk-action-btn{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.8rem;transition:all 0.2s}
          .wk-action-btn:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-weekly{padding:1rem}.wk-row{flex-direction:column;align-items:stretch}.wk-label{min-width:auto}}
        </style>
        <div class="wk-header"><span>📝</span><h3>AI 周报生成器</h3></div>
        <div class="wk-form">
          <div class="wk-row">
            <span class="wk-label">本周做了</span>
            <textarea class="wk-textarea" id="wk-done" placeholder="做了什么（关键词即可，如：完成登录模块、修了3个bug、参加需求评审）"></textarea>
          </div>
          <div class="wk-row">
            <span class="wk-label">遇到问题</span>
            <input class="wk-input" id="wk-issue" placeholder="遇到的问题（可留空）">
          </div>
          <div class="wk-row">
            <span class="wk-label">下周计划</span>
            <input class="wk-input" id="wk-plan" placeholder="下周打算做什么（可留空）">
          </div>
          <div class="wk-styles">
            <span class="wk-label" style="min-width:auto">风格：</span>
            <button class="wk-style-btn active" data-style="professional">📋 专业正式</button>
            <button class="wk-style-btn" data-style="brief">⚡ 简洁高效</button>
            <button class="wk-style-btn" data-style="detailed">📊 详细全面</button>
          </div>
          <button class="wk-gen-btn" id="wk-gen">✨ 生成周报</button>
        </div>
        <div class="wk-output" id="wk-output"></div>
        <div class="wk-actions" id="wk-actions">
          <button class="wk-action-btn" id="wk-copy">📋 复制</button>
        </div>
      `;
      container.appendChild(this.el);

      this.style = 'professional';
      this.el.querySelectorAll('.wk-style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.el.querySelectorAll('.wk-style-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.style = btn.dataset.style;
        });
      });

      this.el.querySelector('#wk-gen').addEventListener('click', () => this.generate());
      this.el.querySelector('#wk-copy').addEventListener('click', () => {
        const text = this.el.querySelector('#wk-output').textContent;
        navigator.clipboard.writeText(text).then(() => {
          const btn = this.el.querySelector('#wk-copy');
          btn.textContent = '✅ 已复制';
          setTimeout(() => btn.textContent = '📋 复制', 1500);
        });
      });
    }

    async generate() {
      const done = this.el.querySelector('#wk-done').value.trim();
      if (!done) { alert('请填写本周工作内容'); return; }
      const issue = this.el.querySelector('#wk-issue').value.trim();
      const plan = this.el.querySelector('#wk-plan').value.trim();
      const outputEl = this.el.querySelector('#wk-output');
      const actionsEl = this.el.querySelector('#wk-actions');
      const genBtn = this.el.querySelector('#wk-gen');

      genBtn.disabled = true;
      genBtn.textContent = '生成中...';
      outputEl.className = 'wk-output show';
      outputEl.textContent = '正在生成...';
      actionsEl.classList.remove('show');

      const styleDesc = { professional: '专业正式的职场风格', brief: '简洁高效，要点式列出', detailed: '详细全面，有数据分析' }[this.style];
      let prompt = `请根据以下信息生成一份周报。风格要求：${styleDesc}。直接输出周报内容，不要输出多余的解释。\n\n本周工作：${done}`;
      if (issue) prompt += `\n遇到的问题：${issue}`;
      if (plan) prompt += `\n下周计划：${plan}`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 800 })
        });
        const data = await res.json();
        outputEl.textContent = data.choices?.[0]?.message?.content || data.content || '生成失败，请重试';
        actionsEl.classList.add('show');
      } catch (e) {
        outputEl.textContent = '⚠️ 生成失败，请重试';
      }
      genBtn.disabled = false;
      genBtn.textContent = '✨ 生成周报';
    }
  }

  window.WeeklyReport = WeeklyReport;

  function initWeeklyReport() { const el = document.getElementById("fish-weekly"); if (!el) return; new WeeklyReport().build(el); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initWeeklyReport);
  else initWeeklyReport();
})();
