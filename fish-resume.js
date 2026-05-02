/**
 * AI 简历生成器 📄
 * 输入关键词，生成专业简历
 */
(function() {
  'use strict';

  class ResumeBuilder {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-resume';
      this.el.innerHTML = `
        <style>
          .fish-resume{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .rv-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .rv-header h3{font-size:1.1rem;margin:0}
          .rv-form{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:0.75rem}
          .rv-row{display:flex;gap:0.5rem;align-items:center}
          .rv-label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:60px}
          .rv-input,.rv-textarea{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:0.5rem 0.75rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .rv-input:focus,.rv-textarea:focus{border-color:var(--accent,#646cff)}
          .rv-textarea{min-height:50px;resize:vertical}
          .rv-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;align-self:flex-end}
          .rv-go:disabled{opacity:0.5;cursor:not-allowed}
          .rv-output{display:none;padding:1.2rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;white-space:pre-wrap}
          .rv-output.show{display:block}
          .rv-actions{display:none;gap:0.5rem;margin-top:0.75rem}
          .rv-actions.show{display:flex}
          .rv-act{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.35rem 0.75rem;border-radius:8px;cursor:pointer;font-size:0.8rem}
          .rv-act:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-resume{padding:1rem}.rv-row{flex-direction:column;align-items:stretch}.rv-go{width:100%}}
        </style>
        <div class="rv-header"><span>📄</span><h3>AI 简历生成器</h3></div>
        <div class="rv-form">
          <div class="rv-row"><span class="rv-label">姓名</span><input class="rv-input" id="rv-name" placeholder="你的名字"></div>
          <div class="rv-row"><span class="rv-label">岗位</span><input class="rv-input" id="rv-job" placeholder="目标岗位，如：前端工程师"></div>
          <div class="rv-row"><span class="rv-label">经验</span><input class="rv-input" id="rv-exp" placeholder="工作年限和关键经历"></div>
          <div class="rv-row"><span class="rv-label">技能</span><input class="rv-input" id="rv-skills" placeholder="核心技能，如：React, Python, 项目管理"></div>
          <div class="rv-row"><span class="rv-label">亮点</span><textarea class="rv-textarea" id="rv-highlights" placeholder="项目亮点、成就、数据（可选）"></textarea></div>
        </div>
        <button class="rv-go" id="rv-go">📄 生成简历</button>
        <div class="rv-output" id="rv-output"></div>
        <div class="rv-actions" id="rv-actions">
          <button class="rv-act" id="rv-copy">📋 复制</button>
        </div>
      `;
      container.appendChild(this.el);
      this.el.querySelector('#rv-go').addEventListener('click', () => this.go());
      this.el.querySelector('#rv-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(this.el.querySelector('#rv-output').textContent);
        const btn = this.el.querySelector('#rv-copy'); btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制', 1500);
      });
    }

    async go() {
      const name = this.el.querySelector('#rv-name').value.trim();
      const job = this.el.querySelector('#rv-job').value.trim();
      const exp = this.el.querySelector('#rv-exp').value.trim();
      const skills = this.el.querySelector('#rv-skills').value.trim();
      const highlights = this.el.querySelector('#rv-highlights').value.trim();
      if (!name || !job) { alert('请至少填写姓名和岗位'); return; }
      const outputEl = this.el.querySelector('#rv-output');
      const actionsEl = this.el.querySelector('#rv-actions');
      const goBtn = this.el.querySelector('#rv-go');
      goBtn.disabled = true; goBtn.textContent = '生成中...';
      outputEl.className = 'rv-output show'; outputEl.textContent = '正在生成简历...';
      actionsEl.classList.remove('show');

      let prompt = `请为"${name}"生成一份专业的${job}岗位简历。`;
      if (exp) prompt += `工作经历：${exp}。`;
      if (skills) prompt += `核心技能：${skills}。`;
      if (highlights) prompt += `亮点成就：${highlights}。`;
      prompt += `\n包含：个人信息、专业技能、工作经历、项目经验、教育背景。格式清晰专业，适合直接使用。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 1000 })
        });
        const data = await res.json();
        outputEl.textContent = data.choices?.[0]?.message?.content || '生成失败';
        actionsEl.classList.add('show');
      } catch (e) { outputEl.textContent = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '📄 生成简历';
    }
  }

  window.ResumeBuilder = ResumeBuilder;
  function init() { const el = document.getElementById('fish-resume'); if (!el) return; new ResumeBuilder().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
