/**
 * 小鱼儿 AI 组件 🐟
 * - TTS 朗读（流式分段 + 预加载，无缝衔接）
 * - AI 聊天小助手
 * 用法：<script src="/fish-ai.js"></script>
 */

(function () {
  'use strict';

  const API_BASE = '/api';
  const CHUNK_SIZE = 100; // 每段约100字
  const PRELOAD_AHEAD = 1; // 提前预加载几段

  // ==================== TTS 流式引擎 ====================
  class TTSEngine {
    constructor() {
      this.chunks = [];
      this.audioCache = new Map(); // idx -> Audio 对象
      this.currentIdx = 0;
      this.isPlaying = false;
      this.isPaused = false;
      this.onProgress = null; // (idx, total, status) => void
      this.onEnd = null;
      this.mode = 'mimo'; // 'mimo' | 'browser'
      this.mimoFailed = false;
      this.rate = 1.0;
      this._abort = false;
    }

    /**
     * 智能分段：按标点/换行切分，每段约 CHUNK_SIZE 字
     */
    splitText(text) {
      const chunks = [];
      const paragraphs = text.split(/\n+/);

      for (const para of paragraphs) {
        if (!para.trim()) continue;
        if (para.length <= CHUNK_SIZE) {
          chunks.push(para.trim());
          continue;
        }
        // 按标点分句
        const sentences = para.match(/[^。！？.!?\n,，；;]+[。！？.!?\n,，；;]?/g) || [para];
        let buf = '';
        for (const s of sentences) {
          if (buf.length + s.length > CHUNK_SIZE && buf.length > 0) {
            chunks.push(buf.trim());
            buf = s;
          } else {
            buf += s;
          }
        }
        if (buf.trim()) chunks.push(buf.trim());
      }

      // 合并过短的段
      const merged = [];
      for (const c of chunks) {
        if (merged.length && merged[merged.length - 1].length + c.length < CHUNK_SIZE * 0.6) {
          merged[merged.length - 1] += c;
        } else {
          merged.push(c);
        }
      }
      return merged.filter(c => c.length > 0);
    }

    /**
     * 开始播放文本（立即返回，后台生成第一段）
     */
    async play(text, opts = {}) {
      this.stop();
      if (!text?.trim()) return;

      this.rate = opts.rate || 1.0;
      this.chunks = this.splitText(text);
      this.currentIdx = 0;
      this.isPlaying = true;
      this._abort = false;

      this._notify('generating');

      // 立即开始生成第一段
      await this._generateAndPlay(0);

      // 后台预加载后续段
      this._preloadAhead(1);
    }

    /**
     * 生成并播放指定段落
     */
    async _generateAndPlay(idx) {
      if (idx >= this.chunks.length || this._abort) {
        this.isPlaying = false;
        this._notify('ended');
        this.onEnd?.();
        return;
      }

      this.currentIdx = idx;
      this._notify('playing');

      // 如果缓存已有，直接播
      let audio = this.audioCache.get(idx);
      if (!audio) {
        // 生成
        audio = await this._generateChunk(idx);
        if (!audio || this._abort) return;
        this.audioCache.set(idx, audio);
      }

      // 播放
      if (this._abort) return;
      audio.currentTime = 0;
      audio.onended = () => {
        // 当前段播完，无缝播下一段
        this._generateAndPlay(idx + 1);
      };
      audio.onerror = () => {
        // 出错跳过
        this._generateAndPlay(idx + 1);
      };

      try {
        await audio.play();
      } catch (e) {
        console.error('[TTS] play error:', e);
        this._generateAndPlay(idx + 1);
      }
    }

    /**
     * 生成单段音频，返回 Audio 对象
     */
    async _generateChunk(idx) {
      const text = this.chunks[idx];
      if (!text) return null;

      // 优先 MIMO
      if (!this.mimoFailed && this.mode === 'mimo') {
        try {
          const res = await fetch(`${API_BASE}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, speed: this.rate }),
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          if (blob.size < 100) throw new Error('empty audio');
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = 'auto';
          // 等 canplaythrough 再返回
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            setTimeout(resolve, 3000); // 超时兜底
          });
          return audio;
        } catch (e) {
          console.warn('[TTS] MIMO chunk failed:', e.message);
          this.mimoFailed = true;
          this.mode = 'browser';
        }
      }

      // 浏览器 TTS 兜底
      return this._browserChunk(text);
    }

    /**
     * 浏览器 TTS 包装成 Audio-like 对象
     */
    _browserChunk(text) {
      if (!('speechSynthesis' in window)) return null;
      const audio = {
        currentTime: 0, duration: 0, _playing: false,
        play() {
          return new Promise((resolve, reject) => {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(text);
            utter.lang = 'zh-CN';
            utter.rate = this._rate || 1.0;
            utter.onstart = () => { this._playing = true; resolve(); };
            utter.onend = () => { this._playing = false; this.onended?.(); };
            utter.onerror = (e) => { this._playing = false; if (e.error !== 'canceled') this.onerror?.(); };
            setTimeout(() => window.speechSynthesis.speak(utter), 50);
          });
        },
        pause() { window.speechSynthesis.pause(); },
        stop() { window.speechSynthesis.cancel(); this._playing = false; },
      };
      audio._rate = this.rate;
      return audio;
    }

    /**
     * 后台预加载后续段落
     */
    async _preloadAhead(fromIdx) {
      for (let i = 0; i < PRELOAD_AHEAD; i++) {
        const idx = fromIdx + i;
        if (idx >= this.chunks.length || this._abort) break;
        if (this.audioCache.has(idx)) continue;
        try {
          const audio = await this._generateChunk(idx);
          if (audio && !this._abort) {
            this.audioCache.set(idx, audio);
          }
        } catch {}
      }
    }

    pause() {
      if (!this.isPlaying) return;
      this.isPaused = true;
      const audio = this.audioCache.get(this.currentIdx);
      if (audio?.pause) audio.pause();
      this._notify('paused');
    }

    resume() {
      if (!this.isPaused) return;
      this.isPaused = false;
      const audio = this.audioCache.get(this.currentIdx);
      if (audio?.play) audio.play().catch(() => {});
      this._notify('playing');
    }

    togglePause() {
      if (this.isPaused) this.resume(); else this.pause();
    }

    stop() {
      this._abort = true;
      // 停止所有缓存的音频
      for (const [, audio] of this.audioCache) {
        try { audio.pause(); audio.currentTime = 0; } catch {}
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentIdx = 0;
      // 清理 blob URLs
      for (const [, audio] of this.audioCache) {
        try { if (audio.src?.startsWith('blob:')) URL.revokeObjectURL(audio.src); } catch {}
      }
      this.audioCache.clear();
      this.chunks = [];
      this._notify('stopped');
    }

    seekTo(idx) {
      if (idx < 0 || idx >= this.chunks.length) return;
      // 停止当前段
      const cur = this.audioCache.get(this.currentIdx);
      if (cur) { try { cur.pause(); cur.currentTime = 0; } catch {} }
      this._abort = false;
      this._generateAndPlay(idx);
      this._preloadAhead(idx + 1);
    }

    prev() { if (this.currentIdx > 0) this.seekTo(this.currentIdx - 1); }
    next() { if (this.currentIdx < this.chunks.length - 1) this.seekTo(this.currentIdx + 1); }

    setRate(r) { this.rate = parseFloat(r); }

    _notify(status) {
      this.onProgress?.(this.currentIdx, this.chunks.length, status);
    }
  }

  // ==================== TTS 听文章按钮 ====================
  class ListenButton {
    constructor(container, text) {
      this.text = text;
      this.engine = new TTSEngine();

      this.btn = document.createElement('button');
      this.btn.className = 'fish-listen-btn';
      this.btn.innerHTML = '🔊 听文章';
      this.btn.onclick = () => this.toggle();
      container.appendChild(this.btn);

      this.engine.onProgress = (idx, total, status) => {
        if (status === 'generating') {
          this.btn.innerHTML = '⏳ 准备中...';
          this.btn.disabled = true;
        } else if (status === 'playing') {
          this.btn.innerHTML = `⏸️ 暂停 (${idx + 1}/${total})`;
          this.btn.disabled = false;
        } else if (status === 'paused') {
          this.btn.innerHTML = `▶️ 继续 (${idx + 1}/${total})`;
          this.btn.disabled = false;
        } else if (status === 'stopped' || status === 'ended') {
          this.btn.innerHTML = '🔊 听文章';
          this.btn.disabled = false;
        }
      };
    }

    async toggle() {
      if (this.engine.isPlaying) {
        if (this.engine.isPaused) this.engine.resume();
        else this.engine.pause();
      } else {
        // 立即播放，不等待
        this.engine.play(this.text);
      }
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
      const style = document.createElement('style');
      style.textContent = `
        .fish-chat-fab{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;cursor:pointer;font-size:28px;box-shadow:0 4px 20px rgba(100,108,255,.4);transition:transform .2s;display:flex;align-items:center;justify-content:center}
        .fish-chat-fab:hover{transform:scale(1.1)}
        .fish-chat-fab.open{transform:rotate(90deg)}
        .fish-chat-window{position:fixed;bottom:90px;right:24px;z-index:9998;width:360px;max-height:500px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5);display:none;flex-direction:column;font-family:'LXGW WenKai',-apple-system,sans-serif}
        .fish-chat-window.show{display:flex;animation:fishSlideUp .3s ease}
        @keyframes fishSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fish-chat-header{padding:14px 16px;background:#1a1a1a;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px}
        .fish-chat-header .avatar{font-size:24px}
        .fish-chat-header .info h3{font-size:14px;color:#e8e8e8;margin:0}
        .fish-chat-header .info p{font-size:11px;color:#888;margin:0}
        .fish-chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;max-height:340px}
        .fish-chat-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.6;word-break:break-word}
        .fish-chat-msg.user{align-self:flex-end;background:#646cff;color:#fff;border-bottom-right-radius:4px}
        .fish-chat-msg.ai{align-self:flex-start;background:#1e1e1e;color:#e8e8e8;border:1px solid #2a2a2a;border-bottom-left-radius:4px}
        .fish-chat-msg.ai .label{font-size:11px;color:#646cff;margin-bottom:4px}
        .fish-chat-input-area{padding:12px 16px;border-top:1px solid #2a2a2a;display:flex;gap:8px;background:#1a1a1a}
        .fish-chat-input{flex:1;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;padding:10px 14px;color:#e8e8e8;font-size:13px;outline:none;resize:none;font-family:inherit}
        .fish-chat-input:focus{border-color:#646cff}
        .fish-chat-send{background:#646cff;border:none;border-radius:10px;color:#fff;padding:10px 16px;cursor:pointer;font-size:14px;transition:background .2s}
        .fish-chat-send:hover{background:#535bf2}
        .fish-chat-send:disabled{opacity:.5;cursor:not-allowed}
        .fish-chat-messages::-webkit-scrollbar{width:4px}
        .fish-chat-messages::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        @media(max-width:420px){.fish-chat-window{right:8px;left:8px;width:auto;bottom:80px}}
      `;
      document.head.appendChild(style);

      this.fab = document.createElement('button');
      this.fab.className = 'fish-chat-fab';
      this.fab.innerHTML = '🐟';
      this.fab.title = '和小鱼儿聊天';
      this.fab.onclick = () => this.toggle();
      document.body.appendChild(this.fab);

      this.win = document.createElement('div');
      this.win.className = 'fish-chat-window';
      this.win.innerHTML = `
        <div class="fish-chat-header"><span class="avatar">🐟</span><div class="info"><h3>小鱼儿</h3><p>AI 助手 · 随时为你服务</p></div></div>
        <div class="fish-chat-messages" id="fish-chat-msgs"><div class="fish-chat-msg ai"><div class="label">🐟 小鱼儿</div>你好呀！有什么想聊的？✨</div></div>
        <div class="fish-chat-input-area"><input class="fish-chat-input" placeholder="说点什么..." id="fish-chat-input" /><button class="fish-chat-send" id="fish-chat-send">➤</button></div>
      `;
      document.body.appendChild(this.win);

      const input = this.win.querySelector('#fish-chat-input');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } });
      this.win.querySelector('#fish-chat-send').onclick = () => this.send();
    }

    toggle() {
      this.open = !this.open;
      this.win.classList.toggle('show', this.open);
      this.fab.classList.toggle('open', this.open);
      if (this.open) this.win.querySelector('#fish-chat-input').focus();
    }

    async send() {
      const input = this.win.querySelector('#fish-chat-input');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      this.addMsg(text, 'user');
      this.messages.push({ role: 'user', content: text });
      input.disabled = true;
      this.win.querySelector('#fish-chat-send').disabled = true;

      try {
        const res = await fetch(`${API_BASE}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: this.messages }) });
        if (!res.ok) throw new Error('fail');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let aiText = '';
        const aiEl = this.addMsg('', 'ai', true);
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of decoder.decode(value, { stream: true }).split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const d = line.slice(6).trim();
            if (d === '[DONE]') continue;
            try { const delta = JSON.parse(d).choices?.[0]?.delta?.content; if (delta) { aiText += delta; aiEl.querySelector('.text').textContent = aiText; this.scrollBottom(); } } catch {}
          }
        }
        if (aiText) this.messages.push({ role: 'assistant', content: aiText });
      } catch { this.addMsg('抱歉，出了点问题 😅', 'ai'); }
      input.disabled = false;
      this.win.querySelector('#fish-chat-send').disabled = false;
      input.focus();
    }

    addMsg(text, role) {
      const container = this.win.querySelector('#fish-chat-msgs');
      const el = document.createElement('div');
      el.className = `fish-chat-msg ${role}`;
      el.innerHTML = role === 'ai' ? `<div class="label">🐟 小鱼儿</div><span class="text">${text}</span>` : text;
      container.appendChild(el);
      this.scrollBottom();
      return el;
    }

    scrollBottom() { const c = this.win.querySelector('#fish-chat-msgs'); c.scrollTop = c.scrollHeight; }
  }

  // ==================== 初始化 ====================
  function init() {
    document.querySelectorAll('.fish-tts').forEach((el) => {
      let text = el.dataset.text || el.textContent.trim();
      if (!text) {
        const postContent = el.closest('.container')?.querySelector('.post-content') || document.querySelector('.post-content');
        if (postContent) text = postContent.textContent.replace(/\s+/g, ' ').trim().slice(0, 5000);
      }
      if (!text) return;
      new ListenButton(el, text);
    });
    if (!window.__fishChat) window.__fishChat = new ChatWidget();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // 暴露引擎供外部使用
  window.FishTTSEngine = TTSEngine;
})();
