/**
 * 小鱼儿每日AI诗词 🐟📜
 * AI 每日生成一首中文诗词，书法风格展示
 * 用法：<div id="fish-daily-poem"></div><script src="/fish-daily-poem.js"></script>
 */

(function () {
  'use strict';

  const API_CHAT = '/api/chat';
  const CACHE_KEY = 'fish_daily_poem';

  const STYLES = [
    { id: 'tangshi', name: '唐诗', icon: '🏛️', desc: '五言或七言绝句/律诗' },
    { id: 'songci', name: '宋词', icon: '🎵', desc: '词牌填词，婉约或豪放' },
    { id: 'modern', name: '现代诗', icon: '🌊', desc: '自由体，意象丰富' },
    { id: 'haiku', name: '俳句', icon: '🍃', desc: '三行，5-7-5音节' },
  ];

  const POEM_THEMES = [
    '春日', '山川', '明月', '江河', '离别', '思乡', '友情', '秋风',
    '竹林', '落花', '星空', '夜雨', '清晨', '归途', '浮云', '远行',
  ];

  function getTodayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function getRandomTheme() {
    return POEM_THEMES[Math.floor(Math.random() * POEM_THEMES.length)];
  }

  class FishDailyPoem {
    constructor() {
      this.container = document.getElementById('fish-daily-poem');
      if (!this.container) return;
      this.todayKey = getTodayKey();
      this.cached = this.loadCache();
      this.build();
      if (!this.cached) this.generate(STYLES[0]);
    }

    build() {
      const style = document.createElement('style');
      style.textContent = `
        .dp-widget {
          background: var(--surface, #111); border: 1px solid var(--border, #2a2a2a);
          border-radius: 20px; padding: 28px; max-width: 500px; margin: 0 auto;
          font-family: 'LXGW WenKai', -apple-system, sans-serif;
          position: relative; overflow: hidden;
        }
        .dp-widget::before {
          content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
          background: radial-gradient(circle at 30% 30%, rgba(100,108,255,0.04), transparent 50%),
                      radial-gradient(circle at 70% 70%, rgba(236,72,153,0.03), transparent 50%);
          pointer-events: none;
        }
        .dp-header { text-align: center; margin-bottom: 20px; position: relative; }
        .dp-title { font-size: 1.2rem; font-weight: 700; color: var(--text, #e8e8e8); }
        .dp-date { font-size: 0.75rem; color: var(--text-dim, #666); margin-top: 4px; }

        /* 风格选择 */
        .dp-styles {
          display: flex; gap: 6px; justify-content: center; margin-bottom: 20px;
          position: relative; flex-wrap: wrap;
        }
        .dp-style-btn {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border, #2a2a2a);
          border-radius: 20px; padding: 6px 14px; color: var(--text-dim, #888);
          font-size: 0.75rem; cursor: pointer; transition: all 0.2s;
          font-family: inherit; display: flex; align-items: center; gap: 4px;
        }
        .dp-style-btn:hover { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); }
        .dp-style-btn.active {
          background: rgba(100,108,255,0.12); border-color: var(--accent, #646cff);
          color: var(--accent, #646cff);
        }

        /* 诗词展示区 */
        .dp-poem-area {
          position: relative; min-height: 200px; display: flex;
          align-items: center; justify-content: center; padding: 20px 0;
        }
        .dp-poem-card {
          text-align: center; max-width: 360px; animation: dpFadeIn 0.8s ease;
        }
        @keyframes dpFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

        .dp-poem-title {
          font-size: 1.1rem; font-weight: 700; color: var(--text, #e8e8e8);
          margin-bottom: 16px; letter-spacing: 2px;
        }
        .dp-poem-lines {
          font-size: 1.15rem; color: var(--text, #e0d8c8); line-height: 2.2;
          letter-spacing: 1px; white-space: pre-line;
        }
        .dp-poem-author {
          font-size: 0.8rem; color: var(--text-dim, #888); margin-top: 16px;
          font-style: italic;
        }
        .dp-poem-translation {
          font-size: 0.78rem; color: var(--text-dim, #777); margin-top: 12px;
          line-height: 1.7; padding: 10px 14px; background: rgba(255,255,255,0.03);
          border-radius: 10px; text-align: left;
        }

        /* 加载态 */
        .dp-loading {
          text-align: center; color: var(--text-dim, #888); font-size: 0.85rem;
        }
        .dp-loading .fish { font-size: 2rem; animation: dpFloat 2s ease-in-out infinite; margin-bottom: 8px; }
        @keyframes dpFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        /* 操作按钮 */
        .dp-actions {
          display: flex; gap: 8px; justify-content: center; margin-top: 20px;
          position: relative;
        }
        .dp-action-btn {
          background: rgba(255,255,255,0.04); border: 1px solid var(--border, #2a2a2a);
          border-radius: 10px; padding: 8px 16px; color: var(--text-dim, #888);
          font-size: 0.78rem; cursor: pointer; transition: all 0.2s;
          font-family: inherit;
        }
        .dp-action-btn:hover { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); }
        .dp-toast {
          position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
          background: var(--accent, #646cff); color: #fff; padding: 6px 16px;
          border-radius: 8px; font-size: 0.78rem; animation: dpToast 2s ease forwards;
          pointer-events: none; white-space: nowrap;
        }
        @keyframes dpToast { 0% { opacity: 0; transform: translateX(-50%) translateY(8px); } 15% { opacity: 1; transform: translateX(-50%) translateY(0); } 85% { opacity: 1; } 100% { opacity: 0; transform: translateX(-50%) translateY(-8px); } }

        .dp-decor {
          position: absolute; font-size: 4rem; opacity: 0.04; pointer-events: none;
          font-family: 'LXGW WenKai', serif;
        }
        .dp-decor-tl { top: 10px; left: 15px; }
        .dp-decor-br { bottom: 10px; right: 15px; transform: rotate(180deg); }
      `;
      document.head.appendChild(style);

      this.render();
    }

    render() {
      const poem = this.cached;
      const dateStr = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

      this.container.innerHTML = `
        <div class="dp-widget">
          <div class="dp-decor dp-decor-tl">詩</div>
          <div class="dp-decor dp-decor-br">詞</div>
          <div class="dp-header">
            <div class="dp-title">📜 每日诗词</div>
            <div class="dp-date">${dateStr}</div>
          </div>
          <div class="dp-styles" id="dp-styles">
            ${STYLES.map(s => `
              <button class="dp-style-btn ${poem?.styleId === s.id || (!poem && s.id === 'tangshi') ? 'active' : ''}" data-style="${s.id}">
                ${s.icon} ${s.name}
              </button>
            `).join('')}
          </div>
          <div class="dp-poem-area" id="dp-poem-area">
            ${poem ? this.renderPoem(poem) : '<div class="dp-loading"><div class="fish">🐟</div>正在为你赋诗...</div>'}
          </div>
          ${poem ? `
            <div class="dp-actions" id="dp-actions">
              <button class="dp-action-btn" id="dp-copy">📋 复制</button>
              <button class="dp-action-btn" id="dp-refresh">🔄 换一首</button>
            </div>
          ` : ''}
        </div>
      `;

      // 绑定风格切换
      this.container.querySelectorAll('.dp-style-btn').forEach(btn => {
        btn.onclick = () => {
          const styleId = btn.dataset.style;
          const style = STYLES.find(s => s.id === styleId);
          if (style) this.generate(style);
        };
      });

      // 绑定操作
      const copyBtn = this.container.querySelector('#dp-copy');
      if (copyBtn) copyBtn.onclick = () => this.copyPoem();
      const refreshBtn = this.container.querySelector('#dp-refresh');
      if (refreshBtn) refreshBtn.onclick = () => {
        const activeBtn = this.container.querySelector('.dp-style-btn.active');
        const styleId = activeBtn?.dataset.style || 'tangshi';
        const style = STYLES.find(s => s.id === styleId);
        this.cached = null;
        localStorage.removeItem(CACHE_KEY + '_' + this.todayKey);
        this.generate(style);
      };
    }

    renderPoem(poem) {
      return `
        <div class="dp-poem-card">
          <div class="dp-poem-title">${this.esc(poem.title)}</div>
          <div class="dp-poem-lines">${this.esc(poem.content)}</div>
          ${poem.author ? `<div class="dp-poem-author">—— ${this.esc(poem.author)}</div>` : ''}
          ${poem.translation ? `<div class="dp-poem-translation">💡 ${this.esc(poem.translation)}</div>` : ''}
        </div>
      `;
    }

    async generate(style) {
      const area = this.container.querySelector('#dp-poem-area');
      if (!area) return;
      area.innerHTML = '<div class="dp-loading"><div class="fish">🐟</div>正在为你赋诗...</div>';

      // 更新 active 状态
      this.container.querySelectorAll('.dp-style-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = this.container.querySelector(`[data-style="${style.id}"]`);
      if (activeBtn) activeBtn.classList.add('active');

      const theme = getRandomTheme();
      const prompts = {
        tangshi: `请创作一首以"${theme}"为主题的唐诗（五言或七言绝句/律诗）。要求：意境优美，对仗工整。返回格式：第一行是标题，第二行开始是诗句，最后一行是"—— AI小鱼儿"。不要有多余解释。`,
        songci: `请创作一首以"${theme}"为主题的宋词，选一个合适的词牌名。要求：意境深远，韵律和谐。返回格式：第一行是"词牌名·标题"，第二行开始是词句，最后一行是"—— AI小鱼儿"。不要有多余解释。`,
        modern: `请创作一首以"${theme}"为主题的现代诗。要求：意象丰富，语言优美，3-6行。返回格式：第一行是标题，空一行后是诗句，最后一行是"—— AI小鱼儿"。不要有多余解释。`,
        haiku: `请创作一首以"${theme}"为主题的中文俳句。要求：三行，意境空灵，接近5-7-5音节。返回格式：第一行是标题，第二行开始是俳句，最后一行是"—— AI小鱼儿"。不要有多余解释。`,
      };

      let fullText = '';
      try {
        const res = await fetch(API_CHAT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: prompts[style.id] }],
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
        console.error('诗词生成失败:', e);
      }

      if (!fullText) {
        fullText = '春风不度玉门关\n一片孤城万仞山\n—— AI小鱼儿';
      }

      const poem = this.parsePoem(fullText, style.id);
      this.cached = poem;
      this.saveCache(poem);
      area.innerHTML = this.renderPoem(poem);

      // 确保操作按钮存在
      const actionsEl = this.container.querySelector('#dp-actions');
      if (!actionsEl) {
        const widget = this.container.querySelector('.dp-widget');
        const actions = document.createElement('div');
        actions.className = 'dp-actions';
        actions.id = 'dp-actions';
        actions.innerHTML = `
          <button class="dp-action-btn" id="dp-copy">📋 复制</button>
          <button class="dp-action-btn" id="dp-refresh">🔄 换一首</button>
        `;
        widget.appendChild(actions);
        this.container.querySelector('#dp-copy').onclick = () => this.copyPoem();
        this.container.querySelector('#dp-refresh').onclick = () => {
          this.cached = null;
          localStorage.removeItem(CACHE_KEY + '_' + this.todayKey);
          this.generate(style);
        };
      }
    }

    parsePoem(text, styleId) {
      const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
      let title = styleId === 'songci' ? '词' : '诗';
      let content = '';
      let author = '';

      if (lines.length >= 2) {
        // 第一行通常是标题
        const firstLine = lines[0];
        if (!firstLine.includes('——') && firstLine.length < 20) {
          title = firstLine;
          const rest = lines.slice(1);
          // 最后一行可能是作者
          const lastLine = rest[rest.length - 1];
          if (lastLine && lastLine.includes('——')) {
            author = lastLine.replace('——', '').trim();
            content = rest.slice(0, -1).join('\n');
          } else {
            content = rest.join('\n');
          }
        } else {
          const lastLine = lines[lines.length - 1];
          if (lastLine && lastLine.includes('——')) {
            author = lastLine.replace('——', '').trim();
            content = lines.slice(0, -1).join('\n');
          } else {
            content = lines.join('\n');
          }
        }
      } else {
        content = text;
      }

      return { title, content, author, styleId, theme: '', date: this.todayKey };
    }

    copyPoem() {
      if (!this.cached) return;
      const text = `${this.cached.title}\n\n${this.cached.content}${this.cached.author ? '\n—— ' + this.cached.author : ''}\n\n📜 来自 tylerzhang.xyz 每日诗词`;
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('✅ 已复制到剪贴板');
      }).catch(() => {
        this.showToast('❌ 复制失败');
      });
    }

    showToast(msg) {
      const existing = this.container.querySelector('.dp-toast');
      if (existing) existing.remove();
      const toast = document.createElement('div');
      toast.className = 'dp-toast';
      toast.textContent = msg;
      const actions = this.container.querySelector('#dp-actions');
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

    saveCache(poem) {
      try {
        localStorage.setItem(CACHE_KEY + '_' + this.todayKey, JSON.stringify(poem));
      } catch {}
    }

    esc(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishDailyPoem());
  } else {
    new FishDailyPoem();
  }
})();
