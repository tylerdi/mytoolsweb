/**
 * 小鱼儿每日挑战 🐟🎯
 * 每天一个有趣的 AI 挑战任务
 * 用法：<div id="fish-challenge"></div><script src="/fish-challenge.js"></script>
 */

(function () {
  'use strict';

  // 挑战库（按难度分类）
  const CHALLENGES = [
    // 轻松级
    { diff: '🌟', diffLabel: '轻松', text: '用一句话描述你现在的心情，让 AI 才出来你在哪里', type: '文字' },
    { diff: '🌟', diffLabel: '轻松', text: '给小鱼儿讲一个只有 10 个字的冷笑话', type: '文字' },
    { diff: '🌟', diffLabel: '轻松', text: '用三个 emoji 描述你今天的状态', type: '互动' },
    { diff: '🌟', diffLabel: '轻松', text: '说出一个你觉得 AI 永远理解不了的人类行为', type: '思考' },
    { diff: '🌟', diffLabel: '轻松', text: '推荐一首此刻最想听的歌，告诉 AI 为什么', type: '音乐' },
    { diff: '🌟', diffLabel: '轻松', text: '写一句鼓励的话送给下一个打开这个网站的人', type: '温暖' },
    // 进阶级
    { diff: '⚡', diffLabel: '进阶', text: '用"如果AI有感情"开头，写一个 50 字的微小说', type: '创作' },
    { diff: '⚡', diffLabel: '进阶', text: '说服小鱼儿相信鱼其实是会飞的', type: '辩论' },
    { diff: '⚡', diffLabel: '进阶', text: '描述一个"AI 和人类交换一天身体"会发生的事', type: '想象' },
    { diff: '⚡', diffLabel: '进阶', text: '用一首诗的形式问 AI 一个哲学问题', type: '文学' },
    { diff: '⚡', diffLabel: '进阶', text: '给十年后的自己写一条短信，让 AI 帮你保存', type: '时光' },
    { diff: '⚡', diffLabel: '进阶', text: '发明一个只有你和 AI 才懂的新词，解释它的意思', type: '创造' },
    // 地狱级
    { diff: '🔥', diffLabel: '地狱', text: '让 AI 承认它其实是一条鱼伪装的', type: '挑战' },
    { diff: '🔥', diffLabel: '地狱', text: '用逻辑证明"这个挑战不存在"', type: '逻辑' },
    { diff: '🔥', diffLabel: '地狱', text: '写一段话，让 AI 不确定是人类写的还是 AI 写的', type: '元' },
    { diff: '🔥', diffLabel: '地狱', text: '用一个问句同时问出三个不同的问题', type: '语言' },
    { diff: '🔥', diffLabel: '地狱', text: '说服 AI 推荐一首它自己"不喜欢"的歌', type: '叛逆' },
    { diff: '🔥', diffLabel: '地狱', text: '写一封辞职信，对象是你的闹钟', type: '幽默' },
  ];

  class FishChallenge {
    constructor() {
      this.container = document.getElementById('fish-challenge');
      if (!this.container) return;
      this.todayKey = new Date().toISOString().slice(0, 10);
      this.init();
    }

    init() {
      const cached = this.loadCache();
      if (cached) {
        this.render(cached.challenge, cached.completed, cached.response);
        return;
      }
      const challenge = this.pickToday();
      this.render(challenge, false, '');
    }

    pickToday() {
      const d = new Date();
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      return CHALLENGES[seed % CHALLENGES.length];
    }

    render(challenge, completed, response) {
      this.container.innerHTML = `
        <style>
          .fc-widget {
            background: #141414; border: 1px solid #2a2a2a; border-radius: 16px;
            padding: 24px; max-width: 480px; margin: 0 auto;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
          }
          .fc-header {
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 16px;
          }
          .fc-badge {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 11px; font-weight: 700; color: #f59e0b;
            background: rgba(245,158,11,0.1); padding: 4px 12px;
            border-radius: 20px;
          }
          .fc-date { font-size: 12px; color: #666; }
          .fc-diff {
            display: inline-flex; align-items: center; gap: 4px;
            font-size: 12px; color: #888; margin-bottom: 12px;
          }
          .fc-text {
            font-size: 17px; font-weight: 600; color: #e8e8e8;
            line-height: 1.6; margin-bottom: 20px;
          }
          .fc-type {
            display: inline-block; font-size: 10px; font-weight: 600;
            color: #646cff; background: rgba(100,108,255,0.1);
            padding: 2px 8px; border-radius: 8px; margin-bottom: 16px;
          }
          .fc-input-area { margin-bottom: 12px; }
          .fc-textarea {
            width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a;
            border-radius: 10px; padding: 12px 14px; color: #e8e8e8;
            font-size: 14px; font-family: inherit; resize: none;
            min-height: 80px; outline: none;
          }
          .fc-textarea:focus { border-color: #f59e0b; }
          .fc-textarea::placeholder { color: #555; }
          .fc-submit {
            width: 100%; border: none; border-radius: 10px;
            padding: 12px; font-size: 14px; font-weight: 600;
            cursor: pointer; transition: all 0.2s;
            background: linear-gradient(135deg, #f59e0b, #ef4444);
            color: #fff;
          }
          .fc-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
          .fc-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
          .fc-response {
            background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
            padding: 14px; margin-top: 16px; display: none;
          }
          .fc-response.show { display: block; animation: fcFadeIn 0.4s ease; }
          @keyframes fcFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
          .fc-response .fish-label {
            font-size: 11px; color: #646cff; font-weight: 600; margin-bottom: 6px;
          }
          .fc-response .text { font-size: 14px; color: #e8e8e8; line-height: 1.6; }
          .fc-completed {
            text-align: center; padding: 16px; margin-top: 12px;
            background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2);
            border-radius: 10px; color: #22c55e; font-size: 14px; font-weight: 600;
          }
          .fc-stats {
            display: flex; gap: 16px; margin-top: 14px;
            padding-top: 14px; border-top: 1px solid #1e1e1e;
          }
          .fc-stat { font-size: 12px; color: #666; }
          .fc-stat strong { color: #888; }
          .fc-skip {
            background: transparent; border: 1px solid #333; border-radius: 10px;
            color: #888; padding: 10px 16px; font-size: 13px;
            cursor: pointer; transition: all 0.2s; width: 100%; margin-top: 8px;
          }
          .fc-skip:hover { border-color: #555; color: #aaa; }
        </style>
        <div class="fc-widget">
          <div class="fc-header">
            <div class="fc-badge">🎯 每日挑战</div>
            <div class="fc-date">${this.todayKey}</div>
          </div>
          <div class="fc-diff">${challenge.diff} ${challenge.diffLabel}</div>
          <div class="fc-type">${challenge.type}</div>
          <div class="fc-text">${challenge.text}</div>
          ${completed ? `
            <div class="fc-completed">✅ 挑战完成！</div>
            <div class="fc-response show">
              <div class="fish-label">🐟 小鱼儿的评价</div>
              <div class="text">${response}</div>
            </div>
          ` : `
            <div class="fc-input-area">
              <textarea class="fc-textarea" id="fc-answer" placeholder="写下你的挑战成果..." maxlength="500"></textarea>
            </div>
            <button class="fc-submit" id="fc-submit">🎯 完成挑战</button>
            <button class="fc-skip" id="fc-skip">换一个挑战 →</button>
          `}
          <div class="fc-stats">
            <div class="fc-stat">🏆 已完成 <strong>${this.getCompletedCount()}</strong> 个挑战</div>
            <div class="fc-stat">🔥 连续 <strong>${this.getStreak()}</strong> 天</div>
          </div>
        </div>
      `;

      if (!completed) {
        this.container.querySelector('#fc-submit').onclick = async () => {
          const answer = this.container.querySelector('#fc-answer').value.trim();
          if (!answer) return;
          await this.submit(challenge, answer);
        };
        this.container.querySelector('#fc-skip').onclick = () => {
          localStorage.removeItem(`fc_cache_${this.todayKey}`);
          // 随机选一个不同的
          const idx = Math.floor(Math.random() * CHALLENGES.length);
          this.render(CHALLENGES[idx], false, '');
        };
      }
    }

    async submit(challenge, answer) {
      const btn = this.container.querySelector('#fc-submit');
      btn.disabled = true;
      btn.textContent = '🐟 小鱼儿在评判...';

      let response = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `今天的每日挑战是：「${challenge.text}」（难度：${challenge.diffLabel}，类型：${challenge.type}）
访客的挑战成果是：「${answer}」
请以小鱼儿🐟的身份评价，语气轻松有趣，可以给个评分（1-10分），50字以内。`
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
                if (delta) response += delta;
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.error('Challenge response error:', err);
      }

      if (!response) response = '挑战完成！你太厉害了 ✨';

      this.saveCache(challenge, response);
      this.render(challenge, true, response);
    }

    saveCache(challenge, response) {
      localStorage.setItem(`fc_cache_${this.todayKey}`, JSON.stringify({ challenge, completed: true, response }));
      // 更新历史
      const count = parseInt(localStorage.getItem('fc_completed') || '0') + 1;
      localStorage.setItem('fc_completed', String(count));
      localStorage.setItem(`fc_date_${this.todayKey}`, '1');
    }

    loadCache() {
      try {
        return JSON.parse(localStorage.getItem(`fc_cache_${this.todayKey}`));
      } catch { return null; }
    }

    getCompletedCount() {
      return parseInt(localStorage.getItem('fc_completed') || '0');
    }

    getStreak() {
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (localStorage.getItem(`fc_date_${key}`)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return streak;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishChallenge());
  } else {
    new FishChallenge();
  }
})();
