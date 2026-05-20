/**
 * 小鱼儿每日冷知识 🐟🧊
 * AI 生成有趣冷知识，点击揭晓答案
 * 用法：<div id="fish-funfact"></div><script src="/fish-funfact.js"></script>
 */

(function () {
  'use strict';

  const API_CHAT = '/api/chat';
  const CACHE_KEY = 'fish_funfact';

  const CATEGORIES = [
    { id: 'tech', name: '科技', icon: '💻' },
    { id: 'history', name: '历史', icon: '📜' },
    { id: 'nature', name: '自然', icon: '🌿' },
    { id: 'body', name: '人体', icon: '🧬' },
    { id: 'space', name: '宇宙', icon: '🌌' },
    { id: 'food', name: '食物', icon: '🍜' },
  ];

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getRandomCategory() {
    return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  }

  class FishFunFact {
    constructor() {
      this.container = document.getElementById('fish-funfact');
      if (!this.container) return;
      this.todayKey = getTodayKey();
      this.cached = this.loadCache();
      this.revealed = false;
      this.build();
      if (!this.cached) this.generate(getRandomCategory());
    }

    build() {
      const style = document.createElement('style');
      style.textContent = `
        .ff-widget {
          background: var(--surface, #111); border: 1px solid var(--border, #2a2a2a);
          border-radius: 20px; padding:20px; ; width:100%; margin: 0 auto;
          font-family: 'LXGW WenKai', -apple-system, sans-serif;
          position: relative; overflow: hidden;
        }
        .ff-widget::after {
          content: ''; position: absolute; top: 0; right: 0; width: 120px; height: 120px;
          background: radial-gradient(circle, rgba(100,108,255,0.06), transparent 70%);
          pointer-events: none;
        }
        .ff-header { text-align: center; margin-bottom: 20px; position: relative; }
        .ff-title { font-size: 1.2rem; font-weight: 700; color: var(--text, #e8e8e8); }
        .ff-subtitle { font-size: 0.78rem; color: var(--text-dim, #666); margin-top: 4px; }

        /* 分类选择 */
        .ff-categories {
          display: flex; gap: 6px; justify-content: center; margin-bottom: 20px;
          flex-wrap: wrap; position: relative;
        }
        .ff-cat-btn {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border, #2a2a2a);
          border-radius: 16px; padding: 5px 12px; color: var(--text-dim, #888);
          font-size: 0.72rem; cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .ff-cat-btn:hover { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); }
        .ff-cat-btn.active {
          background: rgba(100,108,255,0.12); border-color: var(--accent, #646cff);
          color: var(--accent, #646cff);
        }

        /* 冷知识卡片 */
        .ff-card {
          position: relative; min-height: 160px; perspective: 800px;
        }
        .ff-question {
          background: linear-gradient(135deg, rgba(100,108,255,0.08), rgba(236,72,153,0.05));
          border: 1px dashed rgba(100,108,255,0.25); border-radius: 14px;
          padding: 24px; text-align: center; cursor: pointer;
          transition: all 0.3s; position: relative;
        }
        .ff-question:hover { border-color: var(--accent, #646cff); background: rgba(100,108,255,0.1); }
        .ff-question-icon { font-size: 2.5rem; margin-bottom: 12px; }
        .ff-question-text { font-size: 0.95rem; color: var(--text, #e8e8e8); line-height: 1.7; }
        .ff-question-hint {
          font-size: 0.72rem; color: var(--accent, #646cff); margin-top: 12px;
          animation: ffPulse 2s ease-in-out infinite;
        }
        @keyframes ffPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

        /* 答案区 */
        .ff-answer {
          background: rgba(255,255,255,0.03); border: 1px solid var(--border, #2a2a2a);
          border-radius: 14px; padding: 20px; margin-top: 14px;
          animation: ffReveal 0.5s ease;
        }
        @keyframes ffReveal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .ff-answer-label { font-size: 0.75rem; color: var(--accent, #646cff); font-weight: 600; margin-bottom: 8px; }
        .ff-answer-text { font-size: 0.88rem; color: var(--text, #e0d8c8); line-height: 1.8; white-space: pre-wrap; }
        .ff-answer-source { font-size: 0.7rem; color: var(--text-dim, #555); margin-top: 10px; font-style: italic; }

        /* 加载态 */
        .ff-loading { text-align: center; padding:24px 0; color: var(--text-dim, #888); font-size: 0.85rem; }
        .ff-loading .fish { font-size: 2rem; animation: ffFloat 2s ease-in-out infinite; margin-bottom: 8px; }
        @keyframes ffFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        /* 操作 */
        .ff-actions {
          display: flex; gap: 8px; justify-content: center; margin-top: 18px; position: relative;
        }
        .ff-action-btn {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border, #2a2a2a);
          border-radius: 10px; padding: 8px 16px; color: var(--text-dim, #888);
          font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .ff-action-btn:hover { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); }
        .ff-toast {
          position: absolute; bottom: 50px; left: 50%; transform: translateX(-50%);
          background: var(--accent, #646cff); color: #fff; padding: 6px 16px;
          border-radius: 8px; font-size: 0.78rem; animation: ffToast 2s ease forwards;
          pointer-events: none;
        }
        @keyframes ffToast { 0% { opacity: 0; transform: translateX(-50%) translateY(8px); } 15% { opacity: 1; } 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) translateY(-8px); } }
      
        @media(max-width:768px){
          .ff-widget{padding:16px !important;border-radius:12px !important}
          .ff-widget *{max-width:100% !important;box-sizing:border-box}
        }`;
      document.head.appendChild(style);

      this.render();
    }

    render() {
      const fact = this.cached;
      const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

      this.container.innerHTML = `
        <div class="ff-widget">
          <div class="ff-header">
            <div class="ff-title">🧊 每日冷知识</div>
            <div class="ff-subtitle">${dateStr}</div>
          </div>
          <div class="ff-categories" id="ff-categories">
            ${CATEGORIES.map(c => `
              <button class="ff-cat-btn ${fact?.categoryId === c.id ? 'active' : ''}" data-cat="${c.id}">
                ${c.icon} ${c.name}
              </button>
            `).join('')}
          </div>
          <div class="ff-card" id="ff-card">
            ${fact ? this.renderFact(fact) : '<div class="ff-loading"><div class="fish">🐟</div>正在挖掘冷知识...</div>'}
          </div>
          ${fact ? `
            <div class="ff-actions" id="ff-actions">
              <button class="ff-action-btn" id="ff-share">📋 复制</button>
              <button class="ff-action-btn" id="ff-next">🎲 再来一个</button>
            </div>
          ` : ''}
        </div>
      `;

      // 绑定分类
      this.container.querySelectorAll('.ff-cat-btn').forEach(btn => {
        btn.onclick = () => {
          const catId = btn.dataset.cat;
          const cat = CATEGORIES.find(c => c.id === catId);
          if (cat) this.generate(cat);
        };
      });

      // 绑定操作
      const shareBtn = this.container.querySelector('#ff-share');
      if (shareBtn) shareBtn.onclick = () => this.share();
      const nextBtn = this.container.querySelector('#ff-next');
      if (nextBtn) nextBtn.onclick = () => {
        this.cached = null;
        this.revealed = false;
        localStorage.removeItem(CACHE_KEY + '_' + this.todayKey);
        this.generate(getRandomCategory());
      };

      // 绑定首次加载的点击揭晓
      const widget = this.container.querySelector('.ff-widget');
      if (widget) widget.__reveal = () => this.reveal();
    }

    renderFact(fact) {
      const cat = CATEGORIES.find(c => c.id === fact.categoryId);
      return `
        <div class="ff-question" id="ff-question" ${!this.revealed ? 'onclick="this.closest(\'.ff-widget\').__reveal()"' : ''}>
          <div class="ff-question-icon">${cat?.icon || '🧊'}</div>
          <div class="ff-question-text">${this.esc(fact.question)}</div>
          ${!this.revealed ? '<div class="ff-question-hint">👆 点击揭晓答案</div>' : ''}
        </div>
        ${this.revealed ? `
          <div class="ff-answer">
            <div class="ff-answer-label">💡 答案</div>
            <div class="ff-answer-text">${this.esc(fact.answer)}</div>
            ${fact.extra ? `<div class="ff-answer-source">📌 ${this.esc(fact.extra)}</div>` : ''}
          </div>
        ` : ''}
      `;
    }

    reveal() {
      if (this.revealed || !this.cached) return;
      this.revealed = true;
      const card = this.container.querySelector('#ff-card');
      card.innerHTML = this.renderFact(this.cached);
      // 绑定 reveal 到 widget
      const widget = this.container.querySelector('.ff-widget');
      widget.__reveal = () => this.reveal();
    }

    async generate(category) {
      const card = this.container.querySelector('#ff-card');
      if (!card) return;
      card.innerHTML = '<div class="ff-loading"><div class="fish">🐟</div>正在挖掘冷知识...</div>';

      // 更新 active
      this.container.querySelectorAll('.ff-cat-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = this.container.querySelector(`[data-cat="${category.id}"]`);
      if (activeBtn) activeBtn.classList.add('active');

      let fullText = '';
      try {
        const prompt = `请生成一个关于"${category.name}"的有趣冷知识。要求：
1. 先给出一个引人好奇的问题（让人想点击看答案）
2. 然后给出答案，要出乎意料、有趣
3. 最后可以补充一点相关背景

请严格按以下格式返回（用 ||| 分隔）：
问题：xxx ||| 答案：xxx ||| 补充：xxx

不要有其他多余文字。如果不需要补充，补充部分写"无"。`;

        const res = await fetch(API_CHAT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompt }],
            model: 'mimo-v2-flash',
          }),
        });

        if (res.ok) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) fullText += delta;
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.error('冷知识生成失败:', e);
      }

      const fact = this.parseFact(fullText, category.id);
      this.cached = fact;
      this.revealed = false;
      this.saveCache(fact);
      card.innerHTML = this.renderFact(fact);

      // 绑定 reveal
      const widget = this.container.querySelector('.ff-widget');
      widget.__reveal = () => this.reveal();

      // 确保操作按钮存在
      const actionsEl = this.container.querySelector('#ff-actions');
      if (!actionsEl) {
        const actions = document.createElement('div');
        actions.className = 'ff-actions';
        actions.id = 'ff-actions';
        actions.innerHTML = `
          <button class="ff-action-btn" id="ff-share">📋 复制</button>
          <button class="ff-action-btn" id="ff-next">🎲 再来一个</button>
        `;
        widget.appendChild(actions);
        this.container.querySelector('#ff-share').onclick = () => this.share();
        this.container.querySelector('#ff-next').onclick = () => {
          this.cached = null;
          this.revealed = false;
          localStorage.removeItem(CACHE_KEY + '_' + this.todayKey);
          this.generate(getRandomCategory());
        };
      }
    }

    parseFact(text, categoryId) {
      if (!text) return {
        question: '你知道吗？蜂蜜永远不会变质。',
        answer: '考古学家在埃及金字塔中发现了3000年前的蜂蜜，至今仍然可以食用！',
        extra: '蜂蜜的低含水量和高酸性使细菌无法生存。',
        categoryId,
      };

      const parts = text.split('|||').map(s => s.trim());
      let question = '', answer = '', extra = '';

      for (const part of parts) {
        if (part.startsWith('问题：') || part.startsWith('问题:')) {
          question = part.replace(/^问题[：:]/, '').trim();
        } else if (part.startsWith('答案：') || part.startsWith('答案:')) {
          answer = part.replace(/^答案[：:]/, '').trim();
        } else if (part.startsWith('补充：') || part.startsWith('补充:')) {
          extra = part.replace(/^补充[：:]/, '').trim();
        }
      }

      // Fallback
      if (!question && parts[0]) question = parts[0];
      if (!answer && parts[1]) answer = parts[1];
      if (extra === '无') extra = '';

      return { question, answer, extra, categoryId };
    }

    share() {
      if (!this.cached) return;
      const cat = CATEGORIES.find(c => c.id === this.cached.categoryId);
      const text = `${cat?.icon || '🧊'} 冷知识\n\n❓ ${this.cached.question}\n\n💡 ${this.cached.answer}${this.cached.extra ? '\n📌 ' + this.cached.extra : ''}\n\n—— tylerzhang.xyz 每日冷知识`;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('✅ 已复制');
      }).catch(() => this.showToast('❌ 复制失败'));
    }

    showToast(msg) {
      const existing = this.container.querySelector('.ff-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = 'ff-toast';
      toast.textContent = msg;
      const actions = this.container.querySelector('#ff-actions');
      if (actions) actions.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }

    loadCache() {
      try {
        const raw = localStorage.getItem(CACHE_KEY + '_' + this.todayKey);
        if (raw) return JSON.parse(raw);
      } catch {}
      return null;
    }

    saveCache(fact) {
      try {
        localStorage.setItem(CACHE_KEY + '_' + this.todayKey, JSON.stringify(fact));
      } catch {}
    }

    esc(str) {
      const div = document.createElement('div');
      div.textContent = str || '';
      return div.innerHTML;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishFunFact());
  } else {
    new FishFunFact();
  }
})();
