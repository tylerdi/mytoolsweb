/**
 * AI 每日运势 🔮
 * 选择星座，AI生成今日运势
 */
(function() {
  'use strict';

  const SIGNS = [
    { name: '白羊座', emoji: '♈', dates: '3.21-4.19' },
    { name: '金牛座', emoji: '♉', dates: '4.20-5.20' },
    { name: '双子座', emoji: '♊', dates: '5.21-6.21' },
    { name: '巨蟹座', emoji: '♋', dates: '6.22-7.22' },
    { name: '狮子座', emoji: '♌', dates: '7.23-8.22' },
    { name: '处女座', emoji: '♍', dates: '8.23-9.22' },
    { name: '天秤座', emoji: '♎', dates: '9.23-10.23' },
    { name: '天蝎座', emoji: '♏', dates: '10.24-11.22' },
    { name: '射手座', emoji: '♐', dates: '11.23-12.21' },
    { name: '摩羯座', emoji: '♑', dates: '12.22-1.19' },
    { name: '水瓶座', emoji: '♒', dates: '1.20-2.18' },
    { name: '双鱼座', emoji: '♓', dates: '2.19-3.20' },
  ];

  class Horoscope {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-horoscope';
      this.el.innerHTML = `
        <style>
          .fish-horoscope{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .hz-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .hz-header h3{font-size:1.1rem;margin:0}
          .hz-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin-bottom:1rem}
          .hz-sign{background:rgba(100,108,255,0.06);border:1px solid rgba(100,108,255,0.15);border-radius:10px;padding:0.6rem;text-align:center;cursor:pointer;transition:all 0.2s}
          .hz-sign:hover,.hz-sign.active{background:rgba(100,108,255,0.2);border-color:var(--accent,#646cff);transform:translateY(-1px)}
          .hz-sign .emoji{font-size:1.5rem;display:block}
          .hz-sign .name{font-size:0.75rem;color:var(--text-secondary,#888);margin-top:0.2rem}
          .hz-result{display:none;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;line-height:1.8;font-size:0.9rem}
          .hz-result.show{display:block}
          .hz-result h4{margin-bottom:0.5rem;font-size:1rem}
          .hz-result .meta{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:0.75rem;font-size:0.8rem;color:var(--text-secondary,#888)}
          .hz-result .meta span{background:rgba(100,108,255,0.1);padding:0.2rem 0.5rem;border-radius:6px}
          .hz-loading{text-align:center;color:var(--text-secondary,#888);padding:1.5rem;font-size:0.85rem}
          @media(max-width:480px){.hz-grid{grid-template-columns:repeat(3,1fr)}.hz-sign{padding:0.4rem}.hz-sign .emoji{font-size:1.2rem}}
        </style>
        <div class="hz-header"><span>🔮</span><h3>AI 每日运势</h3></div>
        <div class="hz-grid" id="hz-grid"></div>
        <div class="hz-result" id="hz-result"></div>
      `;
      container.appendChild(this.el);

      const grid = this.el.querySelector('#hz-grid');
      SIGNS.forEach(s => {
        const btn = document.createElement('div');
        btn.className = 'hz-sign';
        btn.innerHTML = `<span class="emoji">${s.emoji}</span><span class="name">${s.name}</span>`;
        btn.addEventListener('click', () => this.getFortune(s, btn));
        grid.appendChild(btn);
      });
    }

    async getFortune(sign, btn) {
      this.el.querySelectorAll('.hz-sign').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const resultEl = this.el.querySelector('#hz-result');
      resultEl.className = 'hz-result show';
      resultEl.innerHTML = '<div class="hz-loading">🔮 占卜中...</div>';

      const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
      const prompt = `你是星座运势大师，请为${sign.name}生成今日（${today}）运势。要求有趣、轻松、不要太正经。请用以下JSON格式输出，不要输出其他内容：
{
  "overall": "综合运势一句话（带emoji）",
  "love": "爱情运势（1-2句）",
  "work": "事业运势（1-2句）",
  "money": "财运（1-2句）",
  "health": "健康运势（1-2句）",
  "lucky_color": "幸运色",
  "lucky_number": "幸运数字",
  "lucky_time": "幸运时段",
  "advice": "今日建议（一句话，有趣点）"
}`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 500 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || data.content || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const f = JSON.parse(jsonMatch[0]);
          resultEl.innerHTML = `
            <h4>${sign.emoji} ${sign.name} · ${today}</h4>
            <div class="meta">
              <span>🎨 ${f.lucky_color || '—'}</span>
              <span>🔢 ${f.lucky_number || '—'}</span>
              <span>⏰ ${f.lucky_time || '—'}</span>
            </div>
            <p><strong>${f.overall || ''}</strong></p>
            <p>💕 <strong>爱情：</strong>${f.love || ''}</p>
            <p>💼 <strong>事业：</strong>${f.work || ''}</p>
            <p>💰 <strong>财运：</strong>${f.money || ''}</p>
            <p>🏃 <strong>健康：</strong>${f.health || ''}</p>
            <p style="margin-top:0.5rem;color:var(--accent,#646cff)">💡 ${f.advice || ''}</p>
          `;
        } else {
          resultEl.innerHTML = text.replace(/\n/g, '<br>');
        }
      } catch (e) {
        resultEl.innerHTML = '⚠️ 占卜失败，再试一次？';
      }
    }
  }

  window.Horoscope = Horoscope;

  function initHoroscope() { const el = document.getElementById("fish-horoscope"); if (!el) return; new Horoscope().build(el); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initHoroscope);
  else initHoroscope();
})();
