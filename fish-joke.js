/**
 * 小鱼儿每日笑话 🐟😂
 * AI 生成冷笑话 / 段子
 * 用法：<div id="fish-joke"></div><script src="/fish-joke.js"></script>
 */
(function () {
  'use strict';

  class FishJoke {
    constructor() {
      this.el = document.getElementById('fish-joke');
      if (!this.el) return;
      this.render();
      this.loadJoke();
    }

    async loadJoke() {
      const today = new Date().toISOString().slice(0, 10);
      const cached = localStorage.getItem(`joke_${today}`);
      if (cached) { this.show(cached); return; }

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: '讲一个冷笑话或者有趣的段子，要好笑，50字以内。只输出笑话内容。' }],
            model: 'mimo-v2-flash',
          }),
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let text = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value, { stream: true }).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') continue;
            try { const delta = JSON.parse(d).choices?.[0]?.delta?.content; if (delta) text += delta; } catch {}
          }
        }
        if (text) { localStorage.setItem(`joke_${today}`, text); this.show(text); }
        else this.show('为什么程序员总是分不清万圣节和圣诞节？因为 Oct 31 = Dec 25。');
      } catch { this.show('加载失败，但至少你今天笑了吗？😄'); }
    }

    show(text) {
      const content = this.el.querySelector('.joke-content');
      if (content) content.textContent = text;
    }

    refresh() {
      localStorage.removeItem(`joke_${new Date().toISOString().slice(0, 10)}`);
      this.el.querySelector('.joke-content').textContent = '生成中...';
      this.loadJoke();
    }

    render() {
      this.el.innerHTML = `
      <style>
        .jk-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:24px;text-align:center;font-family:'LXGW WenKai',-apple-system,sans-serif;max-width:480px;width:100%;margin:0 auto}
        .jk-icon{font-size:2.5rem;margin-bottom:12px}
        .jk-title{font-size:.85rem;color:#888;margin-bottom:12px}
        .joke-content{font-size:1.1rem;color:var(--text,#e8e8e8);line-height:1.8;min-height:60px;padding:12px;background:rgba(255,255,255,.03);border-radius:10px}
        .jk-actions{margin-top:12px;display:flex;gap:8px;justify-content:center}
        .jk-btn{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:6px 14px;color:#aaa;font-size:.75rem;cursor:pointer;font-family:inherit;transition:all .2s}
        .jk-btn:hover{border-color:#646cff;color:#e8e8e8}
      
        @media(max-width:480px){
          .jk-wrap{padding:16px;border-radius:12px}
          .jk-wrap *{max-width:100% !important}
        }
      </style>
      <div class="jk-wrap">
        <div class="jk-icon">😂</div>
        <div class="jk-title">每日一笑</div>
        <div class="joke-content">加载中...</div>
        <div class="jk-actions">
          <button class="jk-btn" onclick="this.closest('.jk-wrap').__joke.refresh()">🔄 再来一个</button>
        </div>
      </div>`;
      this.el.querySelector('.jk-wrap').__joke = this;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishJoke());
  else new FishJoke();
})();
