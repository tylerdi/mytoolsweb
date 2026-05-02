/**
 * AI 起名助手 👶
 * 输入姓氏、性别、期望寓意，AI生成名字
 */
(function() {
  'use strict';

  class NamingHelper {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-naming';
      this.el.innerHTML = `
        <style>
          .fish-naming{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .nm-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .nm-header h3{font-size:1.1rem;margin:0}
          .nm-tabs{display:flex;gap:0.5rem;margin-bottom:1rem}
          .nm-tab{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.4rem 0.8rem;border-radius:8px;cursor:pointer;font-size:0.85rem;transition:all 0.2s}
          .nm-tab.active{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .nm-form{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:0.75rem}
          .nm-row{display:flex;gap:0.5rem;align-items:center}
          .nm-label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:50px}
          .nm-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:0.5rem 0.75rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .nm-input:focus{border-color:var(--accent,#646cff)}
          .nm-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;align-self:flex-end}
          .nm-go:disabled{opacity:0.5;cursor:not-allowed}
          .nm-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem}
          .nm-output.show{display:block}
          @media(max-width:640px){.fish-naming{padding:1rem}.nm-row{flex-direction:column;align-items:stretch}.nm-go{width:100%}}
        </style>
        <div class="nm-header"><span>👶</span><h3>AI 起名助手</h3></div>
        <div class="nm-tabs">
          <span class="nm-tab active" data-type="person">👶 人名</span>
          <span class="nm-tab" data-type="pet">🐱 宠物名</span>
          <span class="nm-tab" data-type="project">💡 项目名</span>
          <span class="nm-tab" data-type="company">🏢 公司名</span>
        </div>
        <div class="nm-form">
          <div class="nm-row"><span class="nm-label">姓氏</span><input class="nm-input" id="nm-surname" placeholder="如：张、李、王"></div>
          <div class="nm-row"><span class="nm-label">寓意</span><input class="nm-input" id="nm-meaning" placeholder="如：聪明、健康、大气、有诗意"></div>
          <div class="nm-row"><span class="nm-label">其他</span><input class="nm-input" id="nm-extra" placeholder="可选：辈分、避讳、风格偏好等"></div>
        </div>
        <button class="nm-go" id="nm-go">✨ 生成名字</button>
        <div class="nm-output" id="nm-output"></div>
      `;
      container.appendChild(this.el);

      this.type = 'person';
      this.el.querySelectorAll('.nm-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          this.el.querySelectorAll('.nm-tab').forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
          this.type = tab.dataset.type;
          const surname = this.el.querySelector('#nm-surname');
          const labels = { person: '姓氏', pet: '品种/类型', project: '项目方向', company: '行业' };
          surname.placeholder = { person: '如：张、李、王', pet: '如：橘猫、柯基', project: '如：AI工具、社交App', company: '如：科技、餐饮' }[this.type];
          this.el.querySelectorAll('.nm-label')[0].textContent = labels[this.type];
        });
      });
      this.el.querySelector('#nm-go').addEventListener('click', () => this.go());
    }

    async go() {
      const surname = this.el.querySelector('#nm-surname').value.trim();
      const meaning = this.el.querySelector('#nm-meaning').value.trim();
      const extra = this.el.querySelector('#nm-extra').value.trim();
      if (!surname) return;
      const outputEl = this.el.querySelector('#nm-output');
      const goBtn = this.el.querySelector('#nm-go');
      goBtn.disabled = true;
      goBtn.textContent = '生成中...';
      outputEl.className = 'nm-output show';
      outputEl.textContent = '正在生成...';

      const typeDesc = { person: '中文人名', pet: '宠物名字', project: '项目名称', company: '公司名称' }[this.type];
      let prompt = `请为我生成5个${typeDesc}。`;
      if (this.type === 'person') prompt += `姓"${surname}"。`;
      else prompt += `相关领域：${surname}。`;
      if (meaning) prompt += `期望寓意：${meaning}。`;
      if (extra) prompt += `其他要求：${extra}。`;
      prompt += `\n每个名字附带含义解释${this.type === 'person' ? '和诗词出处（如有）' : ''}。格式清晰，用emoji点缀。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 600 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '生成失败').replace(/\n/g, '<br>');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了，请重试'; }
      goBtn.disabled = false;
      goBtn.textContent = '✨ 生成名字';
    }
  }

  window.NamingHelper = NamingHelper;
  function init() { const el = document.getElementById('fish-naming'); if (!el) return; new NamingHelper().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
