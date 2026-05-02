/**
 * 小鱼儿 AI 组件 🐟
 * - TTS 朗读（Web Audio API 流式播放，手机端可靠）
 * - AI 聊天小助手
 * 用法：<script src="/fish-ai.js"></script>
 */

(function () {
  'use strict';

  const API_BASE = '/api';
  const CHUNK_SIZE = 80; // 每段约80字
  const PRELOAD_AHEAD = 3; // 提前预加载几段

  // ==================== TTS 流式引擎 (Web Audio API) ====================
  class TTSEngine {
    constructor() {
      this.chunks = [];
      this.audioCache = new Map();
      this.currentIdx = 0;
      this.isPlaying = false;
      this.isPaused = false;
      this.onProgress = null;
      this.onEnd = null;
      this.mode = 'mimo';
      this.mimoFailed = false;
      this.rate = 1.0;
      this._abort = false;
      this._audioCtx = null;
      this._gainNode = null;
      this._currentSource = null;
    }

    _ensureCtx() {
      if (!this._audioCtx || this._audioCtx.state === 'closed') {
        this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this._gainNode = this._audioCtx.createGain();
        this._gainNode.gain.value = 1.0;
        this._gainNode.connect(this._audioCtx.destination);
      }
      if (this._audioCtx.state === 'suspended') this._audioCtx.resume();
    }

    splitText(text) {
      const chunks = [];
      const paragraphs = text.split(/\n+/);
      for (const para of paragraphs) {
        if (!para.trim()) continue;
        if (para.length <= CHUNK_SIZE) { chunks.push(para.trim()); continue; }
        const sentences = para.match(/[^。！？.!?\n,，；;]+[。！？.!?\n,，；;]?/g) || [para];
        let buf = '';
        for (const s of sentences) {
          if (buf.length + s.length > CHUNK_SIZE && buf.length > 0) { chunks.push(buf.trim()); buf = s; }
          else { buf += s; }
        }
        if (buf.trim()) chunks.push(buf.trim());
      }
      const merged = [];
      for (const c of chunks) {
        if (merged.length && merged[merged.length - 1].length + c.length < CHUNK_SIZE * 0.6)
          merged[merged.length - 1] += c;
        else merged.push(c);
      }
      return merged.filter(c => c.length > 0);
    }

    async play(text, opts = {}) {
      this.stop();
      if (!text?.trim()) return;
      this.rate = opts.rate || 1.0;
      this.chunks = this.splitText(text);
      this.currentIdx = 0;
      this.isPlaying = true;
      this._abort = false;
      this.audioCache.clear();
      this._ensureCtx();
      this._notify('generating');
      this._preloadAhead(0);
      this._playWhenReady(0);
    }

    _playWhenReady(idx) {
      if (idx >= this.chunks.length || this._abort) {
        this.isPlaying = false;
        this._notify('ended');
        this.onEnd?.();
        return;
      }
      if (this.isPaused) { this.currentIdx = idx; return; }
      this.currentIdx = idx;
      this._notify('playing');
      const buffer = this.audioCache.get(idx);
      if (buffer) { this._playBuffer(buffer, idx); return; }
      const check = setInterval(() => {
        if (this._abort) { clearInterval(check); return; }
        const buf = this.audioCache.get(idx);
        if (buf) { clearInterval(check); this._playBuffer(buf, idx); }
      }, 200);
    }

    _playBuffer(buffer, idx) {
      if (this._abort || this.isPaused) return;
      if (this._currentSource) { try { this._currentSource.onended = null; this._currentSource.stop(); } catch {} }
      const source = this._audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this._gainNode);
      this._currentSource = source;
      source.onended = () => {
        if (this._abort || this.isPaused) return;
        this._playWhenReady(idx + 1);
      };
      try { source.start(0); } catch (e) { console.warn('[TTS] start fail:', e); this._playWhenReady(idx + 1); }
    }

    async _generateChunk(idx) {
      const text = this.chunks[idx];
      if (!text) return null;
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
          const arrayBuffer = await blob.arrayBuffer();
          if (this._abort) return null;
          const audioBuffer = await this._audioCtx.decodeAudioData(arrayBuffer);
          return audioBuffer;
        } catch (e) {
          console.warn('[TTS] MIMO chunk failed:', e.message);
          this.mimoFailed = true;
          this.mode = 'browser';
        }
      }
      return this._browserChunkBuffer(text);
    }

    _browserChunkBuffer(text) {
      if (!('speechSynthesis' in window)) return null;
      const sr = this._audioCtx.sampleRate;
      return this._audioCtx.createBuffer(1, sr * 0.1, sr);
    }

    async _preloadAhead(fromIdx) {
      for (let i = 0; i < PRELOAD_AHEAD; i++) {
        const idx = fromIdx + i;
        if (idx >= this.chunks.length || this._abort) break;
        if (this.audioCache.has(idx)) continue;
        try {
          const buf = await this._generateChunk(idx);
          if (buf && !this._abort) this.audioCache.set(idx, buf);
        } catch {}
      }
    }

    pause() {
      if (!this.isPlaying) return;
      this.isPaused = true;
      if (this._currentSource) { try { this._currentSource.onended = null; this._currentSource.stop(); } catch {} }
      this._notify('paused');
    }

    resume() {
      if (!this.isPaused) return;
      this.isPaused = false;
      if (this._audioCtx?.state === 'suspended') this._audioCtx.resume();
      this._playWhenReady(this.currentIdx);
      this._notify('playing');
    }

    togglePause() { if (this.isPaused) this.resume(); else this.pause(); }

    stop() {
      this._abort = true;
      if (this._currentSource) { try { this._currentSource.onended = null; this._currentSource.stop(); } catch {} }
      this._currentSource = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.currentIdx = 0;
      this.audioCache.clear();
      this.chunks = [];
      this._notify('stopped');
    }

    seekTo(idx) {
      if (idx < 0 || idx >= this.chunks.length) return;
      if (this._currentSource) { try { this._currentSource.onended = null; this._currentSource.stop(); } catch {} }
      this._abort = false;
      this._playWhenReady(idx);
      this._preloadAhead(idx + 1);
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
        .fish-chat-fab{position:fixed;bottom:24px;right:24px;z-index:9999;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;cursor:pointer;font-size:28px;box-shadow:0 4px 20px rgba(100,108,255,.4);transition:transform .2s,opacity .3s;display:flex;align-items:center;justify-content:center;touch-action:none;-webkit-user-select:none;user-select:none}
        .fish-chat-fab:hover{transform:scale(1.1)}
        .fish-chat-fab.open{transform:rotate(90deg)}
        .fish-chat-window{position:fixed;z-index:9998;width:360px;max-height:500px;background:#141414;border:1px solid #2a2a2a;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.5);display:none;flex-direction:column;font-family:'LXGW WenKai',-apple-system,sans-serif;transition:opacity .2s}
        .fish-chat-window.show{display:flex;animation:fishSlideUp .3s ease}
        @keyframes fishSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .fish-chat-header{padding:14px 16px;background:#1a1a1a;border-bottom:1px solid #2a2a2a;display:flex;align-items:center;gap:10px}
        .fish-chat-close{background:none;border:none;color:#666;font-size:1rem;cursor:pointer;margin-left:auto;padding:4px 8px;border-radius:6px;transition:all .2s}
        .fish-chat-close:hover{color:#e8e8e8;background:rgba(255,255,255,.1)}
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
        @media(max-width:768px){
          .fish-chat-fab{opacity:.35;width:48px;height:48px;font-size:24px}
          .fish-chat-fab:active{opacity:.7}
          .fish-chat-window{left:8px!important;right:8px!important;width:auto!important;bottom:80px!important;max-height:50vh;max-height:50dvh;top:auto!important}
          .fish-chat-messages{max-height:calc(50vh - 160px);max-height:calc(50dvh - 160px)}
        }
      `;
      document.head.appendChild(style);

      this.fab = document.createElement('button');
      this.fab.className = 'fish-chat-fab';
      this.fab.innerHTML = '🐟';
      this.fab.title = '和小鱼儿聊天';
      this.fab.addEventListener('click', e => {
        e.stopPropagation();
        if (!isDragging && !justTouched) this.toggle();
        justTouched = false;
      });
      document.body.appendChild(this.fab);

      // 拖拽支持（不影响点击）
      let startX, startY, startLeft, startBottom, isDragging = false, justTouched = false;
      const fabRect = () => this.fab.getBoundingClientRect();
      const onMove = (ex, ey) => {
        const dx = ex - startX, dy = ey - startY;
        if (Math.abs(dx) + Math.abs(dy) > 5) {
          isDragging = true;
          this.fab.style.right = 'auto';
          this.fab.style.left = Math.max(0, Math.min(window.innerWidth - 60, startLeft + dx)) + 'px';
          this.fab.style.bottom = Math.max(0, Math.min(window.innerHeight - 60, startBottom - dy)) + 'px';
        }
      };
      this.fab.addEventListener('mousedown', e => {
        isDragging = false; startX = e.clientX; startY = e.clientY;
        const r = fabRect(); startLeft = r.left; startBottom = window.innerHeight - r.bottom;
        const onMM = e => onMove(e.clientX, e.clientY);
        const onMU = () => { document.removeEventListener('mousemove', onMM); document.removeEventListener('mouseup', onMU); };
        document.addEventListener('mousemove', onMM);
        document.addEventListener('mouseup', onMU);
      });
      this.fab.addEventListener('touchstart', e => {
        isDragging = false; const t = e.touches[0]; startX = t.clientX; startY = t.clientY;
        const r = fabRect(); startLeft = r.left; startBottom = window.innerHeight - r.bottom;
      }, { passive: true });
      this.fab.addEventListener('touchmove', e => {
        const t = e.touches[0]; onMove(t.clientX, t.clientY);
      }, { passive: true });
      this.fab.addEventListener('touchend', e => {
        justTouched = true;
        if (!isDragging) this.toggle();
      }, { passive: true });

      this.win = document.createElement('div');
      this.win.className = 'fish-chat-window';
      this.win.innerHTML = `
        <div class="fish-chat-header"><span class="avatar">🐟</span><div class="info"><h3>小鱼儿</h3><p>AI 助手 · 随时为你服务</p></div><button class="fish-chat-close" title="关闭">✕</button></div>
        <div class="fish-chat-messages" id="fish-chat-msgs"><div class="fish-chat-msg ai"><div class="label">🐟 小鱼儿</div>你好呀！有什么想聊的？✨</div></div>
        <div class="fish-chat-input-area"><input class="fish-chat-input" placeholder="说点什么..." id="fish-chat-input" /><button class="fish-chat-send" id="fish-chat-send">➤</button></div>
      `;
      document.body.appendChild(this.win);

      const input = this.win.querySelector('#fish-chat-input');
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); } });
      this.win.querySelector('#fish-chat-send').onclick = () => this.send();
      this.win.querySelector('.fish-chat-close').onclick = () => this.toggle();

      // 手机键盘弹出时自适应
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
          if (this.open) this.positionWindow();
        });
      }
      window.addEventListener('resize', () => {
        if (this.open) this.positionWindow();
      });
    }

    toggle() {
      this.open = !this.open;
      this.win.classList.toggle('show', this.open);
      this.fab.classList.toggle('open', this.open);
      if (this.open) {
        this.positionWindow();
        this.win.querySelector('#fish-chat-input').focus();
      }
    }

    positionWindow() {
      // 手机端：用 visualViewport 适配键盘
      if (window.innerWidth < 768) {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        this.win.style.width = '';
        this.win.style.left = '8px';
        this.win.style.right = '8px';
        this.win.style.top = Math.max(80, vh - 420) + 'px';
        this.win.style.bottom = 'auto';
        this.win.style.maxHeight = Math.min(400, vh - 100) + 'px';
        return;
      }

      const fab = this.fab.getBoundingClientRect();
      const winW = window.innerWidth, winH = window.innerHeight;
      const gap = 6;
      const w = Math.min(360, winW - 16);
      const maxH = Math.min(420, winH - 32);
      this.win.style.width = w + 'px';
      this.win.style.maxHeight = maxH + 'px';

      // 优先上方，放不下就下方，都放不下就限制高度
      let top, h = maxH;
      const spaceAbove = fab.top - 16;
      const spaceBelow = winH - fab.bottom - 16;

      if (spaceAbove >= 200) {
        top = fab.top - h - gap;
      } else if (spaceBelow >= 200) {
        top = fab.bottom + gap;
      } else {
        // 都不够，用最大可用空间
        h = Math.max(200, Math.max(spaceAbove, spaceBelow));
        this.win.style.maxHeight = h + 'px';
        top = spaceAbove >= spaceBelow ? fab.top - h - gap : fab.bottom + gap;
      }
      top = Math.max(8, Math.min(top, winH - h - 8));

      // 水平居中对齐鱼
      let left = fab.left + fab.width / 2 - w / 2;
      left = Math.max(8, Math.min(left, winW - w - 8));

      this.win.style.top = top + 'px';
      this.win.style.left = left + 'px';
      this.win.style.bottom = 'auto';
      this.win.style.right = 'auto';
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
