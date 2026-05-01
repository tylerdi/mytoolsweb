/**
 * 小鱼儿心情日记 🐟📝
 * 用户记录心情 → AI 给出温暖回应
 * 用法：<div id="mood-diary"></div><script src="/fish-mood.js"></script>
 */

(function () {
  'use strict';

  const MOODS = [
    { emoji: '😊', label: '开心', color: '#4ade80' },
    { emoji: '😌', label: '平静', color: '#60a5fa' },
    { emoji: '😤', label: '烦躁', color: '#f97316' },
    { emoji: '😢', label: '难过', color: '#818cf8' },
    { emoji: '🤩', label: '兴奋', color: '#f472b6' },
    { emoji: '😴', label: '疲惫', color: '#94a3b8' },
    { emoji: '🤔', label: '迷茫', color: '#a78bfa' },
    { emoji: '🥰', label: '幸福', color: '#fb923c' },
  ];

  class MoodDiary {
    constructor() {
      this.todayKey = new Date().toISOString().slice(0, 10);
      this.saved = this.loadToday();
      this.build();
    }

    build() {
      const container = document.getElementById('mood-diary');
      if (!container) return;

      const style = document.createElement('style');
      style.textContent = `
        .mood-widget {
          background: #141414; border: 1px solid #2a2a2a; border-radius: 16px;
          padding: 20px; max-width: 480px; width:100%; margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .mood-title {
          font-size: 18px; font-weight: 700; color: #e8e8e8;
          margin-bottom: 4px; display: flex; align-items: center; gap: 8px;
        }
        .mood-subtitle { font-size: 13px; color: #888; margin-bottom: 20px; }
        .mood-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
          margin-bottom: 16px;
        }
        .mood-btn {
          background: #1a1a1a; border: 2px solid #2a2a2a; border-radius: 12px;
          padding: 12px 8px; cursor: pointer; transition: all 0.2s;
          text-align: center;
        }
        .mood-btn:hover { border-color: #646cff; transform: translateY(-2px); }
        .mood-btn.selected { border-color: var(--mood-color, #646cff); background: #1e1e2e; }
        .mood-btn .emoji { font-size: 28px; display: block; margin-bottom: 4px; }
        .mood-btn .label { font-size: 11px; color: #888; }
        .mood-btn.selected .label { color: #e8e8e8; }
        .mood-input-area { margin-bottom: 16px; }
        .mood-textarea {
          width: 100%; background: #0a0a0a; border: 1px solid #2a2a2a;
          border-radius: 10px; padding: 12px 14px; color: #e8e8e8;
          font-size: 14px; font-family: inherit; resize: none;
          min-height: 80px; outline: none;
        }
        .mood-textarea:focus { border-color: #646cff; }
        .mood-textarea::placeholder { color: #555; }
        .mood-submit {
          width: 100%; background: #646cff; border: none; border-radius: 10px;
          color: #fff; padding: 12px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .mood-submit:hover { background: #535bf2; }
        .mood-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .mood-response {
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 12px;
          padding: 16px; margin-top: 16px; display: none;
        }
        .mood-response.show { display: block; animation: moodFadeIn 0.4s ease; }
        @keyframes moodFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .mood-response .fish-icon { font-size: 20px; margin-bottom: 8px; }
        .mood-response .text { font-size: 14px; color: #e8e8e8; line-height: 1.7; }
        .mood-history {
          margin-top: 16px; padding-top: 16px; border-top: 1px solid #2a2a2a;
        }
        .mood-history-title { font-size: 12px; color: #888; margin-bottom: 10px; font-weight: 600; }
        .mood-history-list { display: flex; gap: 6px; flex-wrap: wrap; }
        .mood-history-item {
          font-size: 20px; cursor: default; position: relative;
        }
        .mood-history-item:hover::after {
          content: attr(data-date);
          position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
          background: #333; color: #fff; font-size: 10px; padding: 2px 6px;
          border-radius: 4px; white-space: nowrap;
        }
        .mood-streak {
          font-size: 12px; color: #646cff; margin-top: 8px; font-weight: 600;
        }
      
        @media(max-width:480px){
          .mood-widget{padding:16px !important;border-radius:12px !important}
          .mood-widget *{max-width:100% !important;box-sizing:border-box}
        }`;
      document.head.appendChild(style);

      const history = this.getHistory();
      const streak = this.getStreak(history);

      container.innerHTML = `
        <div class="mood-widget">
          <div class="mood-title">📝 今日心情</div>
          <div class="mood-subtitle">${this.todayKey} · 选一个最贴近你此刻的心情</div>
          <div class="mood-grid" id="mood-grid">
            ${MOODS.map((m, i) => `
              <div class="mood-btn ${this.saved?.moodIdx === i ? 'selected' : ''}"
                   data-idx="${i}" style="--mood-color: ${m.color}">
                <span class="emoji">${m.emoji}</span>
                <span class="label">${m.label}</span>
              </div>
            `).join('')}
          </div>
          <div class="mood-input-area">
            <textarea class="mood-textarea" id="mood-text"
              placeholder="今天发生了什么？有什么想说的？（可选）"
              maxlength="500">${this.saved?.text || ''}</textarea>
          </div>
          <button class="mood-submit" id="mood-submit">
            ${this.saved ? '✨ 更新心情' : '🐟 记录心情'}
          </button>
          <div class="mood-response ${this.saved?.response ? 'show' : ''}" id="mood-response">
            <div class="fish-icon">🐟</div>
            <div class="text">${this.saved?.response || ''}</div>
          </div>
          ${history.length > 0 ? `
            <div class="mood-history">
              <div class="mood-history-title">最近心情</div>
              <div class="mood-history-list">
                ${history.slice(-14).map(h => `
                  <span class="mood-history-item" data-date="${h.date}">${MOODS[h.moodIdx]?.emoji || '📝'}</span>
                `).join('')}
              </div>
              ${streak > 1 ? `<div class="mood-streak">🔥 已连续记录 ${streak} 天</div>` : ''}
            </div>
          ` : ''}
        </div>
      `;

      // 绑定事件
      let selectedIdx = this.saved?.moodIdx ?? null;
      container.querySelectorAll('.mood-btn').forEach(btn => {
        btn.onclick = () => {
          container.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          selectedIdx = parseInt(btn.dataset.idx);
        };
      });

      container.querySelector('#mood-submit').onclick = async () => {
        if (selectedIdx === null) return;
        const text = container.querySelector('#mood-text').value.trim();
        await this.submit(selectedIdx, text, container);
      };
    }

    async submit(moodIdx, text, container) {
      const btn = container.querySelector('#mood-submit');
      btn.disabled = true;
      btn.textContent = '🐟 小鱼儿正在想...';

      const mood = MOODS[moodIdx];
      let response = '';

      try {
        const prompt = text
          ? `用户今天的心情是"${mood.label}"，ta说：「${text}」。请用温暖、轻松的语气回应，给一点小建议或鼓励，50字以内。`
          : `用户今天的心情是"${mood.label}"，没有写具体内容。请用温暖的语气说一句安慰或鼓励的话，30字以内。`;

        const res = await fetch('/api/chat', {
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
                if (delta) response += delta;
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        console.error('Mood response error:', err);
      }

      if (!response) response = `${mood.emoji} 记录好了！每一天都值得被记住 💫`;

      // 显示回应
      const respEl = container.querySelector('#mood-response');
      respEl.querySelector('.text').textContent = response;
      respEl.classList.add('show');

      btn.disabled = false;
      btn.textContent = '✨ 更新心情';

      // 保存
      this.save(moodIdx, text, response);
    }

    save(moodIdx, text, response) {
      const data = { moodIdx, text, response, date: this.todayKey };
      localStorage.setItem(`mood_${this.todayKey}`, JSON.stringify(data));

      // 更新历史
      const history = this.getHistory();
      const existing = history.findIndex(h => h.date === this.todayKey);
      if (existing >= 0) {
        history[existing] = { date: this.todayKey, moodIdx };
      } else {
        history.push({ date: this.todayKey, moodIdx });
      }
      localStorage.setItem('mood_history', JSON.stringify(history.slice(-60)));
      this.saved = data;

      // 同步到 Supabase
      this.syncToServer(moodIdx, text, response);
    }

    async syncToServer(moodIdx, text, response) {
      try {
        const visitorId = localStorage.getItem('fish_visitor_id') || 'anonymous';
        await fetch('/api/mood', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitor_id: visitorId,
            mood: MOODS[moodIdx]?.emoji || '📝',
            note: text || '',
            ai_reply: response || '',
          }),
        });
      } catch (e) {
        console.warn('心情同步到服务器失败:', e);
      }
    }

    loadToday() {
      try {
        return JSON.parse(localStorage.getItem(`mood_${this.todayKey}`));
      } catch { return null; }
    }

    getHistory() {
      try {
        return JSON.parse(localStorage.getItem('mood_history')) || [];
      } catch { return []; }
    }

    getStreak(history) {
      if (history.length === 0) return 0;
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (history.some(h => h.date === key)) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      return streak;
    }
  }

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new MoodDiary());
  } else {
    new MoodDiary();
  }
})();
