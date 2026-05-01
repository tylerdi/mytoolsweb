/**
 * 每日一问 ❓🐟
 * AI 每天抛出一个有趣的问题，访客可以写下回答
 * 用法：<div id="daily-question"></div><script src="/fish-question.js"></script>
 */

(function () {
  'use strict';

  class DailyQuestion {
    constructor() {
      this.todayKey = new Date().toISOString().slice(0, 10);
      this.container = document.getElementById('daily-question');
      if (!this.container) return;
      this.init();
    }

    async init() {
      // 检查本地缓存
      const cached = this.loadCache();
      if (cached) {
        this.render(cached.question, cached.answers || []);
        return;
      }
      // 生成今日问题
      await this.generate();
    }

    async generate() {
      this.container.innerHTML = `
        <div class="dq-widget">
          <div class="dq-loading">🐟 正在思考今天问你什么...</div>
        </div>
      `;

      const categories = [
        '关于生活哲学', '关于科技与未来', '关于人际关系',
        '关于自我成长', '关于奇思妙想', '关于选择与遗憾',
        '关于快乐与幸福', '关于时间与记忆'
      ];
      const cat = categories[Math.floor(Math.random() * categories.length)];

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `请生成一个有趣的、引人深思的中文问题，分类是"${cat}"。要求：简短（20字以内），有深度，适合陌生人之间互动讨论。只输出问题本身，不要任何解释。`
            }],
            model: 'mimo-v2-flash',
          }),
        });

        let question = '';
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
                if (delta) question += delta;
              } catch (e) {}
            }
          }
        }

        question = question.replace(/[""「」]/g, '').trim();
        if (!question) question = '如果可以重来一天，你会选择哪一天？';

        this.cache(question);
        this.render(question, []);
      } catch (err) {
        console.error('Question gen error:', err);
        this.render('如果可以重来一天，你会选择哪一天？', []);
      }
    }

    render(question, answers) {
      const savedAnswer = this.getMyAnswer();

      this.container.innerHTML = `
        <style>
          .dq-widget {
            background: #141414; border: 1px solid #2a2a2a; border-radius: 16px;
            padding: 24px; max-width: 480px; width:100%; margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .dq-header {
            display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
          }
          .dq-badge {
            font-size: 11px; font-weight: 700; color: #f472b6;
            background: rgba(244,114,182,0.1); padding: 3px 10px;
            border-radius: 20px; letter-spacing: 0.5px;
          }
          .dq-date { font-size: 12px; color: #666; }
          .dq-question {
            font-size: 20px; font-weight: 700; color: #e8e8e8;
            line-height: 1.5; margin-bottom: 20px;
          }
          .dq-question::before { content: '❓ '; }
          .dq-input-area { margin-bottom: 12px; }
          .dq-textarea {
            width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a;
            border-radius: 10px; padding: 12px 14px; color: #e8e8e8;
            font-size: 14px; font-family: inherit; resize: none;
            min-height: 70px; outline: none;
          }
          .dq-textarea:focus { border-color: #f472b6; }
          .dq-textarea::placeholder { color: #555; }
          .dq-actions { display: flex; gap: 10px; }
          .dq-submit {
            flex: 1; background: linear-gradient(135deg, #f472b6, #646cff);
            border: none; border-radius: 10px; color: #fff;
            padding: 11px; font-size: 14px; font-weight: 600;
            cursor: pointer; transition: all 0.2s;
          }
          .dq-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(244,114,182,0.3); }
          .dq-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
          .dq-skip {
            background: transparent; border: 1px solid #333; border-radius: 10px;
            color: #888; padding: 11px 16px; font-size: 13px; cursor: pointer;
            transition: all 0.2s;
          }
          .dq-skip:hover { border-color: #555; color: #aaa; }
          .dq-my-answer {
            background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
            padding: 14px; margin-top: 16px; display: none;
          }
          .dq-my-answer.show { display: block; animation: dqFadeIn 0.3s ease; }
          @keyframes dqFadeIn { from { opacity:0; } to { opacity:1; } }
          .dq-my-answer .label {
            font-size: 11px; color: #f472b6; font-weight: 600;
            margin-bottom: 6px;
          }
          .dq-my-answer .content {
            font-size: 14px; color: #e8e8e8; line-height: 1.6;
          }
          .dq-thoughts {
            background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
            padding: 14px; margin-top: 12px; display: none;
          }
          .dq-thoughts.show { display: block; animation: dqFadeIn 0.3s ease 0.2s both; }
          .dq-thoughts .fish-label {
            font-size: 11px; color: #646cff; font-weight: 600;
            margin-bottom: 6px;
          }
          .dq-thoughts .text {
            font-size: 13px; color: #ccc; line-height: 1.6;
          }
          .dq-stats {
            display: flex; gap: 16px; margin-top: 14px;
            padding-top: 14px; border-top: 1px solid #1e1e1e;
          }
          .dq-stat {
            font-size: 12px; color: #666;
          }
          .dq-stat strong { color: #888; }
          .dq-loading {
            text-align: center; color: #888; padding:24px 0;
            font-size: 14px;
          }
        
        @media(max-width:480px){
          .dq-widget{padding:16px !important;border-radius:12px !important}
          .dq-widget *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
        <div class="dq-widget">
          <div class="dq-header">
            <span class="dq-badge">每日一问</span>
            <span class="dq-date">${this.todayKey}</span>
          </div>
          <div class="dq-question">${question}</div>
          <div class="dq-input-area">
            <textarea class="dq-textarea" id="dq-answer"
              placeholder="写下你的想法..." maxlength="300"
            >${savedAnswer || ''}</textarea>
          </div>
          <div class="dq-actions">
            <button class="dq-submit" id="dq-submit" ${savedAnswer ? '' : ''}>
              ${savedAnswer ? '✨ 更新回答' : '💭 写下答案'}
            </button>
            <button class="dq-skip" id="dq-skip">换一个问题 →</button>
          </div>
          <div class="dq-my-answer ${savedAnswer ? 'show' : ''}" id="dq-my-answer">
            <div class="label">💭 我的回答</div>
            <div class="content">${savedAnswer || ''}</div>
          </div>
          <div class="dq-thoughts" id="dq-thoughts">
            <div class="fish-label">🐟 小鱼儿的想法</div>
            <div class="text" id="dq-thoughts-text"></div>
          </div>
          <div class="dq-stats">
            <div class="dq-stat">📅 第 <strong>${this.getDayCount()}</strong> 天提问</div>
            <div class="dq-stat">✍️ 已回答 <strong>${answers.length}</strong> 次</div>
          </div>
        </div>
      `;

      // 绑定事件
      const submitBtn = this.container.querySelector('#dq-submit');
      const skipBtn = this.container.querySelector('#dq-skip');

      submitBtn.onclick = async () => {
        const answer = this.container.querySelector('#dq-answer').value.trim();
        if (!answer) return;
        submitBtn.disabled = true;
        submitBtn.textContent = '🐟 小鱼儿在想...';

        // 保存回答
        this.saveAnswer(answer);
        const myAnswer = this.container.querySelector('#dq-my-answer');
        myAnswer.querySelector('.content').textContent = answer;
        myAnswer.classList.add('show');

        // AI 回应
        await this.getThoughts(question, answer);

        submitBtn.disabled = false;
        submitBtn.textContent = '✨ 更新回答';
      };

      skipBtn.onclick = () => {
        localStorage.removeItem(`dq_cache_${this.todayKey}`);
        this.generate();
      };
    }

    async getThoughts(question, answer) {
      const thoughtsEl = this.container.querySelector('#dq-thoughts');
      const textEl = this.container.querySelector('#dq-thoughts-text');
      thoughtsEl.classList.add('show');
      textEl.textContent = '';

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `今天的每日一问是：「${question}」
访客的回答是：「${answer}」
请以小鱼儿🐟的身份，用温暖、有趣的语气回应，可以分享你的看法或追问，50字以内。`
            }],
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
                if (delta) textEl.textContent += delta;
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        textEl.textContent = '好有趣的想法！💫';
      }
    }

    cache(question) {
      localStorage.setItem(`dq_cache_${this.todayKey}`, JSON.stringify({ question, ts: Date.now() }));
    }

    loadCache() {
      try {
        const raw = localStorage.getItem(`dq_cache_${this.todayKey}`);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch { return null; }
    }

    saveAnswer(answer) {
      localStorage.setItem(`dq_answer_${this.todayKey}`, answer);
      // 更新总回答次数
      const count = parseInt(localStorage.getItem('dq_total_answers') || '0') + 1;
      localStorage.setItem('dq_total_answers', String(count));
    }

    getMyAnswer() {
      return localStorage.getItem(`dq_answer_${this.todayKey}`);
    }

    getDayCount() {
      // 从 2026-05-01 开始计算
      const start = new Date('2026-05-01');
      const today = new Date();
      return Math.max(1, Math.ceil((today - start) / 86400000));
    }
  }

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new DailyQuestion());
  } else {
    new DailyQuestion();
  }
})();
