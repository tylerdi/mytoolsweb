/**
 * 小鱼儿 AI 解梦 🐟🌙
 * 告诉 AI 你的梦，它帮你解
 * 用法：<div id="fish-dream"></div><script src="/fish-dream.js"></script>
 */
(function () {
  'use strict';

  class FishDream {
    constructor() {
      this.el = document.getElementById('fish-dream');
      if (!this.el) return;
      this.render();
    }

    async interpret() {
      const input = this.el.querySelector('.dm-input');
      const text = input.value.trim();
      if (!text) return;

      const resultEl = this.el.querySelector('.dm-result');
      resultEl.innerHTML = '<div style="text-align:center;color:#888"><div class="dm-spinner"></div>解梦中...</div>';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `请用轻松有趣的语气解梦。梦境描述：${text}。请从心理学和民俗两个角度解读，100字以内。`
            }],
            model: 'mimo-v2-flash',
          }),
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiText = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value, { stream: true }).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') continue;
            try { const delta = JSON.parse(d).choices?.[0]?.delta?.content; if (delta) aiText += delta; } catch {}
          }
        }
        resultEl.innerHTML = `<div style="font-size:.9rem;line-height:1.8;color:var(--text,#e8e8e8)">${aiText || '这个梦很特别，需要更多细节才能解读哦~'}</div>`;
        // Save to database
        this._saveToDb(text, aiText);
      } catch {
        resultEl.innerHTML = '<div style="color:#ff6b9d">解梦失败，请稍后再试</div>';
      }
    }

    _getVisitorId() { let id=localStorage.getItem('vid'); if(!id){id='v_'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('vid',id);} return id; }
    async _saveToDb(dream_text, interpretation) { try { await fetch('/api/dreams',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor_id:this._getVisitorId(),dream_text,interpretation})}); } catch{} }
    render() {
      this.el.innerHTML = `
      <style>
        .dm-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:24px;font-family:'LXGW WenKai',-apple-system,sans-serif;;width:100%;margin:0 auto}
        .dm-title{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .dm-input{width:100%;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;padding:12px;color:#e8e8e8;font-size:.85rem;font-family:inherit;outline:none;resize:none;min-height:80px}
        .dm-input:focus{border-color:#646cff}
        .dm-btn{background:linear-gradient(135deg,#646cff,#a855f7);border:none;border-radius:10px;padding:10px 24px;color:#fff;font-size:.85rem;cursor:pointer;font-family:inherit;font-weight:600;margin-top:12px;width:100%}
        .dm-result{margin-top:16px;padding:16px;background:rgba(255,255,255,.02);border-radius:10px;min-height:60px;line-height:1.8}
        .dm-spinner{width:24px;height:24px;border:2px solid #2a2a2a;border-top-color:#a855f7;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 8px}
        @keyframes spin{to{transform:rotate(360deg)}}
      
        @media(){
          .dm-wrap{padding:16px;border-radius:12px}
          .dm-wrap *{max-width:100% !important}
        }
      </style>
      <div class="dm-wrap">
        <div class="dm-title">🌙 AI 解梦</div>
        <textarea class="dm-input" placeholder="描述你的梦... 梦见了什么？什么场景？什么感觉？"></textarea>
        <button class="dm-btn" onclick="this.closest('.dm-wrap').__dream.interpret()">🔮 开始解梦</button>
        <div class="dm-result" style="color:#555;text-align:center;font-size:.85rem">输入梦境描述，让 AI 为你解读</div>
      </div>`;
      this.el.querySelector('.dm-wrap').__dream = this;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishDream());
  else new FishDream();
})();
