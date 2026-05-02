/**
 * AI 年度报告 📊
 * 生成你的个人年度报告
 */
(function() {
  'use strict';

  class AnnualReport {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-annual';
      this.el.innerHTML = `
        <style>
          .fish-annual{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .ar-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .ar-header h3{font-size:1.1rem;margin:0}
          .ar-form{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:0.75rem}
          .ar-row{display:flex;gap:0.5rem;align-items:center}
          .ar-label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:60px}
          .ar-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:0.5rem 0.75rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .ar-input:focus{border-color:var(--accent,#646cff)}
          .ar-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;width:100%}
          .ar-go:disabled{opacity:0.5;cursor:not-allowed}
          .ar-output{display:none;padding:1.5rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;max-height:600px;overflow-y:auto}
          .ar-output.show{display:block}
          .ar-output::-webkit-scrollbar{width:4px}
          .ar-output::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          .ar-act{display:none;gap:0.5rem;margin-top:0.75rem}
          .ar-act.show{display:flex}
          .ar-act-btn{flex:1;background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.4rem;border-radius:8px;cursor:pointer;font-size:0.8rem;text-align:center}
          .ar-act-btn:hover{border-color:var(--accent,#646cff);color:var(--accent,#646cff)}
          @media(max-width:640px){.fish-annual{padding:1rem}.ar-row{flex-direction:column;align-items:stretch}}
        </style>
        <div class="ar-header"><span>📊</span><h3>AI 年度报告</h3></div>
        <div class="ar-form">
          <div class="ar-row"><span class="ar-label">职业</span><input class="ar-input" id="ar-job" placeholder="如：程序员/学生/设计师"></div>
          <div class="ar-row"><span class="ar-label">今年做了</span><input class="ar-input" id="ar-did" placeholder="今年印象最深的事"></div>
          <div class="ar-row"><span class="ar-label">关键词</span><input class="ar-input" id="ar-key" placeholder="3个关键词概括今年（可留空）"></div>
        </div>
        <button class="ar-go" id="ar-go">📊 生成年度报告</button>
        <div class="ar-output" id="ar-output"></div>
        <div class="ar-act" id="ar-act">
          <button class="ar-act-btn" id="ar-copy">📋 复制报告</button>
        </div>
      `;
      container.appendChild(this.el);
      this.el.querySelector('#ar-go').addEventListener('click', () => this.go());
      this.el.querySelector('#ar-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(this.el.querySelector('#ar-output').textContent);
        const btn = this.el.querySelector('#ar-copy'); btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制报告', 1500);
      });
    }

    async go() {
      const job = this.el.querySelector('#ar-job').value.trim();
      const did = this.el.querySelector('#ar-did').value.trim();
      const key = this.el.querySelector('#ar-key').value.trim();
      if (!job) { alert('请填写职业'); return; }
      const outputEl = this.el.querySelector('#ar-output');
      const actEl = this.el.querySelector('#ar-act');
      const goBtn = this.el.querySelector('#ar-go');
      goBtn.disabled = true; goBtn.textContent = '生成中...';
      outputEl.className = 'ar-output show'; outputEl.textContent = '正在生成报告...';
      actEl.classList.remove('show');

      const year = new Date().getFullYear();
      let prompt = `请为一个${job}生成${year}年度个人报告。风格参考网易云年度报告，有趣、有数据感、有温度。`;
      if (did) prompt += `今年印象深刻的事：${did}。`;
      if (key) prompt += `关键词：${key}。`;
      prompt += `\n包含：1）年度关键词；2）年度数据（用有趣的虚拟数据，如"今年你说了XX次'好的'"）；3）年度成就；4）年度遗憾；5）新年寄语。用emoji点缀，有仪式感。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 800 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '生成失败').replace(/\n/g, '<br>');
        actEl.classList.add('show');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '📊 生成年度报告';
    }
  }

  window.AnnualReport = AnnualReport;
  function init() { const el = document.getElementById('fish-annual-report'); if (!el) return; new AnnualReport().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
