/**
 * 小鱼儿留言板 🐟💬
 * 访客留言 + AI 自动回复
 * 用法：<div id="fish-guestbook"></div><script src="/fish-guestbook.js"></script>
 */

(function () {
  'use strict';

  const API_GUESTBOOK = '/api/guestbook';
  const API_CHAT = '/api/chat';
  const PAGE_SIZE = 20;

  function getVisitorId() {
    let id = localStorage.getItem('fish_visitor_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('fish_visitor_id', id);
    }
    return id;
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '刚刚';
    if (mins < 60) return `${mins} 分钟前`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} 小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} 天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
  }

  class FishGuestbook {
    constructor() {
      this.container = document.getElementById('fish-guestbook');
      if (!this.container) return;
      this.visitorId = getVisitorId();
      this.messages = [];
      this.page = 0;
      this.hasMore = true;
      this.loading = false;
      this.build();
      this.loadMessages();
    }

    build() {
      const style = document.createElement('style');
      style.textContent = `
        .gb-widget {
          background: rgba(20, 20, 20, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding:20px; max-width: 560px; width:100%; margin: 0 auto;
          font-family: 'LXGW WenKai', -apple-system, sans-serif;
        }
        .gb-header { text-align: center; margin-bottom: 24px; }
        .gb-title { font-size: 1.25rem; font-weight: 700; color: var(--text, #e8e8e8); display: flex; align-items: center; justify-content: center; gap: 8px; }
        .gb-subtitle { font-size: 0.8rem; color: var(--text-dim, #888); margin-top: 4px; }

        /* 输入区 */
        .gb-form { margin-bottom: 24px; }
        .gb-input-row { display: flex; gap: 8px; margin-bottom: 10px; }
        .gb-input, .gb-textarea {
          background: var(--bg, #0a0a0a); border: 1px solid var(--border, #2a2a2a);
          border-radius: 10px; padding: 10px 14px; color: var(--text, #e8e8e8);
          font-size: 0.85rem; font-family: inherit; outline: none; transition: border-color 0.2s;
        }
        .gb-input { flex: 1; }
        .gb-textarea { width: 100%; min-height: 72px; resize: none; }
        .gb-input:focus, .gb-textarea:focus { border-color: var(--accent, #646cff); }
        .gb-input::placeholder, .gb-textarea::placeholder { color: #555; }
        .gb-submit {
          width: 100%; background: linear-gradient(135deg, var(--accent, #646cff), #8b5cf6);
          border: none; border-radius: 10px; color: #fff; padding: 12px;
          font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: all 0.25s;
          font-family: inherit;
        }
        .gb-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(100,108,255,0.3); }
        .gb-submit:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        /* 留言列表 */
        .gb-messages { display: flex; flex-direction: column; gap: 12px; }
        .gb-msg {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px; padding: 16px; animation: gbFadeIn 0.4s ease;
        }
        @keyframes gbFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .gb-msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .gb-msg-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent, #646cff), #ec4899);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; color: #fff; font-weight: 700; flex-shrink: 0;
        }
        .gb-msg-name { font-size: 0.85rem; font-weight: 600; color: var(--text, #e8e8e8); }
        .gb-msg-time { font-size: 0.7rem; color: var(--text-dim, #666); margin-left: auto; }
        .gb-msg-content { font-size: 0.85rem; color: var(--text, #ccc); line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
        .gb-msg-reply {
          margin-top: 10px; padding: 10px 12px; background: rgba(100,108,255,0.06);
          border-left: 3px solid var(--accent, #646cff); border-radius: 0 8px 8px 0;
          font-size: 0.8rem; color: #aaa; line-height: 1.6;
        }
        .gb-msg-reply .reply-label { font-weight: 600; color: var(--accent, #646cff); margin-bottom: 2px; font-size: 0.75rem; }
        .gb-msg-reply-streaming::after {
          content: '▋'; animation: gbBlink 0.8s infinite; color: var(--accent, #646cff);
        }
        @keyframes gbBlink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .gb-load-more {
          width: 100%; background: transparent; border: 1px solid var(--border, #2a2a2a);
          border-radius: 10px; color: var(--text-dim, #888); padding: 10px;
          font-size: 0.8rem; cursor: pointer; transition: all 0.2s; font-family: inherit;
          margin-top: 8px;
        }
        .gb-load-more:hover { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); }
        .gb-empty { text-align: center; padding:24px 0; color: var(--text-dim, #666); font-size: 0.85rem; }
        .gb-empty .fish { font-size: 2rem; margin-bottom: 8px; }
        .gb-count { text-align: center; font-size: 0.75rem; color: var(--text-dim, #555); margin-top: 16px; }
      
        @media(max-width:480px){
          .gb-widget{padding:16px !important;border-radius:12px !important}
          .gb-widget *{max-width:100% !important;box-sizing:border-box}
        }`;
      document.head.appendChild(style);

      this.container.innerHTML = `
        <div class="gb-widget">
          <div class="gb-header">
            <div class="gb-title">💬 留言板</div>
            <div class="gb-subtitle">写下你的足迹，小鱼儿会回复每一条留言 🐟</div>
          </div>
          <div class="gb-form">
            <div class="gb-input-row">
              <input class="gb-input" id="gb-nickname" placeholder="你的昵称（选填）" maxlength="20" />
            </div>
            <textarea class="gb-textarea" id="gb-content" placeholder="说点什么吧..." maxlength="500"></textarea>
            <button class="gb-submit" id="gb-submit">🐟 发送留言</button>
          </div>
          <div class="gb-messages" id="gb-messages">
            <div class="gb-empty"><div class="fish">🐟</div>还没有留言，来做第一个吧~</div>
          </div>
        </div>
      `;

      this.container.querySelector('#gb-submit').onclick = () => this.submit();
      this.container.querySelector('#gb-content').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.submit(); }
      });
    }

    async loadMessages() {
      try {
        const res = await fetch(`${API_GUESTBOOK}?limit=${PAGE_SIZE}&offset=${this.page * PAGE_SIZE}`);
        const data = await res.json();
        if (data.ok && data.messages) {
          this.messages = this.page === 0 ? data.messages : [...this.messages, ...data.messages];
          this.hasMore = data.messages.length >= PAGE_SIZE;
          this.renderMessages();
        }
      } catch (e) {
        console.warn('加载留言失败:', e);
      }
    }

    renderMessages() {
      const el = this.container.querySelector('#gb-messages');
      if (this.messages.length === 0) {
        el.innerHTML = '<div class="gb-empty"><div class="fish">🐟</div>还没有留言，来做第一个吧~</div>';
        return;
      }

      el.innerHTML = this.messages.map((msg, i) => `
        <div class="gb-msg" style="animation-delay: ${i * 0.05}s">
          <div class="gb-msg-header">
            <div class="gb-msg-avatar">${(msg.nickname || '匿')[0]}</div>
            <span class="gb-msg-name">${this.esc(msg.nickname || '匿名访客')}</span>
            <span class="gb-msg-time">${timeAgo(msg.created_at)}</span>
          </div>
          <div class="gb-msg-content">${this.esc(msg.content)}</div>
          ${msg.ai_reply ? `
            <div class="gb-msg-reply">
              <div class="reply-label">🐟 小鱼儿回复</div>
              <div>${this.esc(msg.ai_reply)}</div>
            </div>
          ` : `<div class="gb-msg-reply" id="gb-reply-${msg.id}" style="display:none">
            <div class="reply-label">🐟 小鱼儿回复</div>
            <div class="gb-reply-text"></div>
          </div>`}
        </div>
      `).join('');

      if (this.hasMore) {
        el.innerHTML += '<button class="gb-load-more" id="gb-load-more">加载更多</button>';
        this.container.querySelector('#gb-load-more').onclick = () => {
          this.page++;
          this.loadMessages();
        };
      }
    }

    async submit() {
      const nicknameEl = this.container.querySelector('#gb-nickname');
      const contentEl = this.container.querySelector('#gb-content');
      const btn = this.container.querySelector('#gb-submit');
      const content = contentEl.value.trim();
      if (!content || this.loading) return;

      this.loading = true;
      btn.disabled = true;
      btn.textContent = '🐟 发送中...';

      const nickname = nicknameEl.value.trim() || '匿名访客';

      try {
        const res = await fetch(API_GUESTBOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitor_id: this.visitorId, nickname, content }),
        });
        const data = await res.json();

        if (data.ok) {
          contentEl.value = '';
          const msg = data.message;
          this.messages.unshift(msg);
          this.renderMessages();

          // AI 自动回复
          this.getAiReply(msg);
        }
      } catch (e) {
        console.error('留言失败:', e);
      }

      this.loading = false;
      btn.disabled = false;
      btn.textContent = '🐟 发送留言';
    }

    async getAiReply(msg) {
      const replyEl = this.container.querySelector(`#gb-reply-${msg.id}`);
      if (!replyEl) return;
      replyEl.style.display = 'block';
      const textEl = replyEl.querySelector('.gb-reply-text');
      replyEl.classList.add('gb-msg-reply-streaming');

      let reply = '';
      try {
        const prompt = `你在网站留言板上收到一条访客留言。昵称：「${msg.nickname}」，内容：「${msg.content}」。请以网站小助手"小鱼儿"的身份，用温暖轻松的语气回复，30-80字。`;

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
                if (delta) {
                  reply += delta;
                  textEl.textContent = reply;
                }
              } catch (e) {}
            }
          }
        }
      } catch (e) {
        console.warn('AI 回复失败:', e);
      }

      replyEl.classList.remove('gb-msg-reply-streaming');
      if (!reply) {
        textEl.textContent = '🐟 谢谢你的留言~';
        reply = '🐟 谢谢你的留言~';
      }

      // 保存 AI 回复到后端（静默）
      try {
        await fetch(API_GUESTBOOK, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: msg.id, ai_reply: reply }),
        });
      } catch (e) {}
    }

    esc(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishGuestbook());
  } else {
    new FishGuestbook();
  }
})();
