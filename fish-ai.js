/**
 * 小鱼儿 AI 组件 🐟
 * - 听文章 TTS 按钮
 * - AI 聊天小助手
 * 用法：<script src="/fish-ai.js"></script>
 */

(function () {
  'use strict';

  const API_BASE = '/api';

  // ==================== TTS 听文章 ====================
  class ListenButton {
    constructor(container, text) {
      this.text = text;
      this.audio = null;
      this.playing = false;
      this.loading = false;

      this.btn = document.createElement('button');
      this.btn.className = 'fish-listen-btn';
      this.btn.innerHTML = '🔊 听文章';
      this.btn.onclick = () => this.toggle();
      container.appendChild(this.btn);
    }

    async toggle() {
      if (this.playing) {
        this.stop();
        return;
      }
      if (this.audio) {
        this.play();
        return;
      }
      await this.generate();
    }

    // 浏览器原生 TTS 兜底
    fallbackSpeak() {
      if (!('speechSynthesis' in window)) {
        this.btn.innerHTML = '❌ 浏览器不支持语音';
        return;
      }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(this.text.slice(0, 500));
      utter.lang = 'zh-CN';
      utter.rate = 1.0;
      utter.onstart = () => {
        this.playing = true;
        this.btn.innerHTML = '⏸️ 暂停（浏览器朗读）';
      };
      utter.onend = () => this.stop();
      utter.onerror = () => {
        this.btn.innerHTML = '❌ 朗读失败';
        this.playing = false;
      };
      window.speechSynthesis.speak(utter);
    }

    async generate() {
      this.loading = true;
      this.btn.innerHTML = '⏳ 生成中...';
      this.btn.disabled = true;

      try {
        console.log('[TTS] 开始生成，文字长度:', this.text.length);

        const res = await fetch(`${API_BASE}/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: this.text, voice: 'nova', speed: 1.0 }),
        });

        console.log('[TTS] 响应状态:', res.status, res.statusText);

        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const err = await res.json();
            msg = err.error || msg;
          } catch {}
          throw new Error(msg);
        }

        const blob = await res.blob();
        console.log('[TTS] blob 大小:', blob.size, '类型:', blob.type);

        if (blob.size < 100) {
          throw new Error('音频数据为空');
        }

        // 用 base64 data URL 代替 blob URL（兼容性更好）
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        console.log('[TTS] data URL 长度:', dataUrl.length);

        this.audio = new Audio();
        this.audio.preload = 'auto';

        const playOnce = () => {
          console.log('[TTS] 音频就绪，开始播放');
          this.play();
        };

        this.audio.addEventListener('canplaythrough', playOnce, { once: true });

        this.audio.addEventListener('error', (e) => {
          const err = this.audio.error;
          console.error('[TTS] 音频错误:', err?.code, err?.message);
          // 尝试浏览器原生 TTS
          this.btn.innerHTML = '🔄 切换浏览器朗读...';
          setTimeout(() => this.fallbackSpeak(), 300);
        }, { once: true });

        this.audio.onended = () => this.stop();
        this.audio.src = dataUrl;

      } catch (err) {
        console.error('[TTS] 错误:', err);
        // 尝试浏览器原生 TTS
        this.btn.innerHTML = '🔄 切换浏览器朗读...';
        setTimeout(() => this.fallbackSpeak(), 300);
      }
    }

    play() {
      this.playing = true;
      this.btn.innerHTML = '⏸️ 暂停';
      this.btn.disabled = false;
      this.audio.play();
    }

    stop() {
      this.playing = false;
      if (this.audio) this.audio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.btn.innerHTML = '🔊 听文章';
      this.btn.disabled = false;
      this.loading = false;
    }
  }

  // ==================== AI 聊天小助手 ====================
  class ChatWidget {
    constructor() {
      this.messages = [];
      this.open = false;
      this.build();
    }

    build() {
      // 注入样式
      const style = document.createElement('style');
      style.textContent = `
        .fish-chat-fab {
          position: fixed; bottom: 24px; right: 24px; z-index: 9999;
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #646cff, #ff6b9d);
          border: none; cursor: pointer; font-size: 28px;
          box-shadow: 0 4px 20px rgba(100,108,255,0.4);
          transition: transform 0.2s;
          display: flex; align-items: center; justify-content: center;
        }
        .fish-chat-fab:hover { transform: scale(1.1); }
        .fish-chat-fab.open { transform: rotate(90deg); }

        .fish-chat-window {
          position: fixed; bottom: 90px; right: 24px; z-index: 9998;
          width: 360px; max-height: 500px;
          background: #141414; border: 1px solid #2a2a2a;
          border-radius: 16px; overflow: hidden;
          box-shadow: 0 8px 40px rgba(0,0,0,0.5);
          display: none; flex-direction: column;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }
        .fish-chat-window.show { display: flex; animation: fishSlideUp 0.3s ease; }
        @keyframes fishSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }

        .fish-chat-header {
          padding: 14px 16px; background: #1a1a1a;
          border-bottom: 1px solid #2a2a2a;
          display: flex; align-items: center; gap: 10px;
        }
        .fish-chat-header .avatar { font-size: 24px; }
        .fish-chat-header .info h3 { font-size: 14px; color: #e8e8e8; margin: 0; }
        .fish-chat-header .info p { font-size: 11px; color: #888; margin: 0; }

        .fish-chat-messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 12px;
          max-height: 340px;
        }
        .fish-chat-msg {
          max-width: 85%; padding: 10px 14px;
          border-radius: 14px; font-size: 13px; line-height: 1.6;
          word-break: break-word;
        }
        .fish-chat-msg.user {
          align-self: flex-end;
          background: #646cff; color: #fff;
          border-bottom-right-radius: 4px;
        }
        .fish-chat-msg.ai {
          align-self: flex-start;
          background: #1e1e1e; color: #e8e8e8;
          border: 1px solid #2a2a2a;
          border-bottom-left-radius: 4px;
        }
        .fish-chat-msg.ai .label { font-size: 11px; color: #646cff; margin-bottom: 4px; }

        .fish-chat-input-area {
          padding: 12px 16px; border-top: 1px solid #2a2a2a;
          display: flex; gap: 8px; background: #1a1a1a;
        }
        .fish-chat-input {
          flex: 1; background: #0a0a0a; border: 1px solid #2a2a2a;
          border-radius: 10px; padding: 10px 14px; color: #e8e8e8;
          font-size: 13px; outline: none; resize: none;
          font-family: inherit;
        }
        .fish-chat-input:focus { border-color: #646cff; }
        .fish-chat-send {
          background: #646cff; border: none; border-radius: 10px;
          color: #fff; padding: 10px 16px; cursor: pointer;
          font-size: 14px; transition: background 0.2s;
        }
        .fish-chat-send:hover { background: #535bf2; }
        .fish-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

        .fish-chat-messages::-webkit-scrollbar { width: 4px; }
        .fish-chat-messages::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }

        @media (max-width: 420px) {
          .fish-chat-window { right: 8px; left: 8px; width: auto; bottom: 80px; }
        }
      `;
      document.head.appendChild(style);

      // FAB 按钮
      this.fab = document.createElement('button');
      this.fab.className = 'fish-chat-fab';
      this.fab.innerHTML = '🐟';
      this.fab.title = '和小鱼儿聊天';
      this.fab.onclick = () => this.toggle();
      document.body.appendChild(this.fab);

      // 聊天窗口
      this.win = document.createElement('div');
      this.win.className = 'fish-chat-window';
      this.win.innerHTML = `
        <div class="fish-chat-header">
          <span class="avatar">🐟</span>
          <div class="info">
            <h3>小鱼儿</h3>
            <p>AI 助手 · 随时为你服务</p>
          </div>
        </div>
        <div class="fish-chat-messages" id="fish-chat-msgs">
          <div class="fish-chat-msg ai">
            <div class="label">🐟 小鱼儿</div>
            你好呀！有什么想聊的？我可以推荐文章、介绍网站，或者随便聊聊 ✨
          </div>
        </div>
        <div class="fish-chat-input-area">
          <input class="fish-chat-input" placeholder="说点什么..." id="fish-chat-input" />
          <button class="fish-chat-send" id="fish-chat-send">➤</button>
        </div>
      `;
      document.body.appendChild(this.win);

      // 事件绑定
      const input = this.win.querySelector('#fish-chat-input');
      const sendBtn = this.win.querySelector('#fish-chat-send');
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.send();
        }
      });
      sendBtn.onclick = () => this.send();
    }

    toggle() {
      this.open = !this.open;
      this.win.classList.toggle('show', this.open);
      this.fab.classList.toggle('open', this.open);
      if (this.open) {
        this.win.querySelector('#fish-chat-input').focus();
      }
    }

    async send() {
      const input = this.win.querySelector('#fish-chat-input');
      const text = input.value.trim();
      if (!text) return;

      input.value = '';
      this.addMsg(text, 'user');
      this.messages.push({ role: 'user', content: text });

      // 禁用输入
      input.disabled = true;
      this.win.querySelector('#fish-chat-send').disabled = true;

      try {
        const res = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: this.messages }),
        });

        if (!res.ok) throw new Error('Chat 请求失败');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiText = '';
        const aiEl = this.addMsg('', 'ai', true);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                aiText += delta;
                aiEl.querySelector('.text').textContent = aiText;
                this.scrollBottom();
              }
            } catch (e) {
              // skip invalid JSON
            }
          }
        }

        if (aiText) {
          this.messages.push({ role: 'assistant', content: aiText });
        }
      } catch (err) {
        console.error('Chat error:', err);
        this.addMsg('抱歉，出了点问题 😅 稍后再试试？', 'ai');
      }

      input.disabled = false;
      this.win.querySelector('#fish-chat-send').disabled = false;
      input.focus();
    }

    addMsg(text, role, streaming = false) {
      const container = this.win.querySelector('#fish-chat-msgs');
      const el = document.createElement('div');
      el.className = `fish-chat-msg ${role}`;

      if (role === 'ai') {
        el.innerHTML = `<div class="label">🐟 小鱼儿</div><span class="text">${text}</span>`;
      } else {
        el.textContent = text;
      }

      container.appendChild(el);
      this.scrollBottom();
      return el;
    }

    scrollBottom() {
      const container = this.win.querySelector('#fish-chat-msgs');
      container.scrollTop = container.scrollHeight;
    }
  }

  // ==================== 自动初始化 ====================
  function init() {
    // TTS：为所有 .fish-tts 元素添加听文章按钮
    document.querySelectorAll('.fish-tts').forEach((el) => {
      let text = el.dataset.text || el.textContent.trim();
      // 如果元素本身没有文字，尝试从相邻的 .post-content 提取
      if (!text) {
        const postContent = el.closest('.container')?.querySelector('.post-content')
          || document.querySelector('.post-content');
        if (postContent) {
          text = postContent.textContent.replace(/\s+/g, ' ').trim().slice(0, 2000);
        }
      }
      if (!text) {
        console.warn('fish-tts: 未找到可朗读的文字内容');
        return;
      }
      new ListenButton(el, text);
    });

    // 聊天小助手（全局唯一）
    if (!window.__fishChat) {
      window.__fishChat = new ChatWidget();
    }
  }

  // 等待 DOM 就绪
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
