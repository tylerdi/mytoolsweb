/**
 * AI 健身计划 💪
 * 输入目标，生成训练计划
 */
(function() {
  'use strict';

  class FitnessPlan {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-fitness';
      this.el.innerHTML = `
        <style>
          .fish-fitness{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .ft-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .ft-header h3{font-size:1.1rem;margin:0}
          .ft-presets{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .ft-preset{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:8px;cursor:pointer;font-size:0.78rem}
          .ft-preset:hover{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .ft-form{display:flex;flex-direction:column;gap:0.6rem;margin-bottom:0.75rem}
          .ft-row{display:flex;gap:0.5rem;align-items:center}
          .ft-label{font-size:0.8rem;color:var(--text-secondary,#888);min-width:50px}
          .ft-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:0.5rem 0.75rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .ft-input:focus{border-color:var(--accent,#646cff)}
          .ft-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem;width:100%}
          .ft-go:disabled{opacity:0.5;cursor:not-allowed}
          .ft-output{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem;max-height:500px;overflow-y:auto}
          .ft-output.show{display:block}
          .ft-output::-webkit-scrollbar{width:4px}
          .ft-output::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          @media(max-width:640px){.fish-fitness{padding:1rem}.ft-row{flex-direction:column;align-items:stretch}}
        </style>
        <div class="ft-header"><span>💪</span><h3>AI 健身计划</h3></div>
        <div class="ft-presets">
          <span class="ft-preset" data-v="减脂瘦身">🔥 减脂</span>
          <span class="ft-preset" data-v="增肌塑形">💪 增肌</span>
          <span class="ft-preset" data-v="改善体态">🧘 体态</span>
          <span class="ft-preset" data-v="提升体能">🏃 体能</span>
          <span class="ft-preset" data-v="居家健身">🏠 居家</span>
        </div>
        <div class="ft-form">
          <div class="ft-row"><span class="ft-label">目标</span><input class="ft-input" id="ft-goal" placeholder="如：减脂瘦身、增肌塑形"></div>
          <div class="ft-row"><span class="ft-label">时间</span><input class="ft-input" id="ft-time" placeholder="如：每天30分钟、每周3次" value="每天30分钟"></div>
          <div class="ft-row"><span class="ft-label">条件</span><input class="ft-input" id="ft-equip" placeholder="如：无器械/有哑铃/健身房（可留空）"></div>
        </div>
        <button class="ft-go" id="ft-go">💪 生成计划</button>
        <div class="ft-output" id="ft-output"></div>
      `;
      container.appendChild(this.el);
      const goal = this.el.querySelector('#ft-goal');
      this.el.querySelectorAll('.ft-preset').forEach(p => p.addEventListener('click', () => { goal.value = p.dataset.v; }));
      this.el.querySelector('#ft-go').addEventListener('click', () => this.go());
    }

    async go() {
      const goal = this.el.querySelector('#ft-goal').value.trim();
      const time = this.el.querySelector('#ft-time').value.trim();
      const equip = this.el.querySelector('#ft-equip').value.trim();
      if (!goal) return;
      const outputEl = this.el.querySelector('#ft-output');
      const goBtn = this.el.querySelector('#ft-go');
      goBtn.disabled = true; goBtn.textContent = '生成中...';
      outputEl.className = 'ft-output show'; outputEl.textContent = '正在制定计划...';

      let prompt = `请为我制定一个健身计划。目标：${goal}。可用时间：${time || '每天30分钟'}。`;
      if (equip) prompt += `器械条件：${equip}。`;
      prompt += `\n请给出：1）一周训练安排（每天练什么）；2）每个动作的组数、次数；3）饮食建议；4）注意事项。格式清晰，用emoji点缀。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 800 })
        });
        const data = await res.json();
        outputEl.innerHTML = (data.choices?.[0]?.message?.content || '生成失败').replace(/\n/g, '<br>');
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '💪 生成计划';
    }
  }

  window.FitnessPlan = FitnessPlan;
  function init() { const el = document.getElementById('fish-fitness'); if (!el) return; new FitnessPlan().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
