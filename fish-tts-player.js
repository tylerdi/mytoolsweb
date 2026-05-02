/**
 * 小鱼儿 TTS 分段播放器 🐟🎵
 * 流式分段 + 预加载，无缝衔接，点击即读
 * 用法：<div id="fish-tts-player"></div><script src="/fish-tts-player.js"></script>
 */
(function () {
  'use strict';

  const API_BASE = '/api';
  const CHUNK_SIZE = 100;
  const PRELOAD_AHEAD = 1;

  class FishTTSPlayer {
    constructor() {
      this.container = document.getElementById('fish-tts-player');
      this.chunks = [];
      this.audioCache = new Map();
      this.currentIdx = 0;
      this.isPlaying = false;
      this.isPaused = false;
      this.rate = 1.0;
      this.mode = 'mimo';
      this.mimoFailed = false;
      this._abort = false;
    }

    splitText(text) {
      const chunks = [];
      for (const para of text.split(/\n+/)) {
        if (!para.trim()) continue;
        if (para.length <= CHUNK_SIZE) { chunks.push(para.trim()); continue; }
        const sentences = para.match(/[^。！？.!?\n,，；;]+[。！？.!?\n,，；;]?/g) || [para];
        let buf = '';
        for (const s of sentences) {
          if (buf.length + s.length > CHUNK_SIZE && buf.length) { chunks.push(buf.trim()); buf = s; }
          else buf += s;
        }
        if (buf.trim()) chunks.push(buf.trim());
      }
      // 合并过短段
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
      this.render();
      this.updateUI();
      await this._playChunk(0);
      this._preload(1);
    }

    async _playChunk(idx) {
      if (idx >= this.chunks.length || this._abort) {
        this.isPlaying = false;
        this.updateUI();
        return;
      }
      this.currentIdx = idx;
      this.updateUI();

      let audio = this.audioCache.get(idx);
      if (!audio) {
        audio = await this._gen(idx);
        if (!audio || this._abort) return;
        this.audioCache.set(idx, audio);
      }
      if (this._abort) return;

      audio.onended = () => this._playChunk(idx + 1);
      audio.onerror = () => this._playChunk(idx + 1);
      try { await audio.play(); } catch { this._playChunk(idx + 1); }
    }

    async _gen(idx) {
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
          if (blob.size < 100) throw new Error('empty');
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.preload = 'auto';
          await new Promise((r) => {
            audio.addEventListener('canplaythrough', r, { once: true });
            audio.addEventListener('error', r, { once: true });
            setTimeout(r, 3000);
          });
          return audio;
        } catch (e) {
          this.mimoFailed = true;
          this.mode = 'browser';
        }
      }

      // 浏览器 TTS
      if (!('speechSynthesis' in window)) return null;
      return {
        currentTime: 0, _ok: false,
        play() {
          return new Promise((resolve) => {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-CN';
            u.rate = this._r || 1;
            u.onstart = () => { this._ok = true; resolve(); };
            u.onend = () => this.onended?.();
            u.onerror = (e) => { if (e.error !== 'canceled') this.onerror?.(); };
            setTimeout(() => window.speechSynthesis.speak(u), 50);
          });
        },
        pause() { window.speechSynthesis.pause(); },
        _r: this.rate,
      };
    }

    async _preload(from) {
      for (let i = 0; i < PRELOAD_AHEAD; i++) {
        const idx = from + i;
        if (idx >= this.chunks.length || this._abort || this.audioCache.has(idx)) continue;
        try { const a = await this._gen(idx); if (a && !this._abort) this.audioCache.set(idx, a); } catch {}
      }
    }

    togglePause() {
      if (this.isPaused) {
        this.isPaused = false;
        const a = this.audioCache.get(this.currentIdx);
        if (a?.play) a.play().catch(() => {});
      } else {
        this.isPaused = true;
        const a = this.audioCache.get(this.currentIdx);
        if (a?.pause) a.pause();
      }
      this.updateUI();
    }

    stop() {
      this._abort = true;
      for (const [, a] of this.audioCache) { try { a.pause(); a.currentTime = 0; } catch {} }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentIdx = 0;
      for (const [, a] of this.audioCache) { try { if (a.src?.startsWith('blob:')) URL.revokeObjectURL(a.src); } catch {} }
      this.audioCache.clear();
      this.chunks = [];
      if (this.container) this.container.innerHTML = '';
    }

    prev() { if (this.currentIdx > 0) this.seekTo(this.currentIdx - 1); }
    next() { if (this.currentIdx < this.chunks.length - 1) this.seekTo(this.currentIdx + 1); }
    seekTo(idx) {
      const cur = this.audioCache.get(this.currentIdx);
      if (cur) { try { cur.pause(); cur.currentTime = 0; } catch {} }
      this._abort = false;
      this._playChunk(idx);
      this._preload(idx + 1);
    }
    setRate(v) { this.rate = parseFloat(v); }

    updateUI() {
      const fill = document.getElementById('tts-progress-fill');
      const status = document.getElementById('tts-status');
      const playBtn = document.getElementById('tts-play-btn');
      const textEl = document.getElementById('tts-text');
      const modeEl = document.getElementById('tts-mode');

      const pct = this.chunks.length ? ((this.currentIdx + 1) / this.chunks.length * 100).toFixed(1) : 0;
      if (fill) fill.style.width = `${pct}%`;
      if (status) status.textContent = `第 ${this.currentIdx + 1}/${this.chunks.length} 段`;
      if (playBtn) playBtn.innerHTML = this.isPlaying ? (this.isPaused ? '▶ 继续' : '⏸ 暂停') : '▶ 播放';
      if (modeEl) {
        const label = this.mode === 'mimo' ? '🎤 MIMO TTS' : '🌐 浏览器 TTS';
        const color = this.mode === 'mimo' ? '#22c55e' : '#f97316';
        modeEl.innerHTML = `<span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block"></span> ${label}`;
      }

      if (textEl) {
        textEl.querySelectorAll('.chunk').forEach((span, i) => {
          span.className = 'chunk' + (i === this.currentIdx ? ' active' : '') + (i < this.currentIdx ? ' played' : '');
        });
        const active = textEl.querySelector('.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = `
      <style>
        .tts-p{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:20px;;width:100%;margin:0 auto;font-family:'LXGW WenKai',-apple-system,sans-serif}
        .tts-hd{display:flex;align-items:center;gap:12px;margin-bottom:16px}
        .tts-hd .icon{font-size:1.5rem}
        .tts-hd .title{font-size:.9rem;color:var(--text,#e8e8e8);font-weight:600}
        .tts-hd .sub{font-size:.75rem;color:var(--text-dim,#888);display:flex;align-items:center;gap:6px}
        .tts-prog{background:#0a0a0a;border-radius:8px;padding:12px;margin-bottom:12px}
        .tts-prog-bar{height:4px;background:var(--border,#2a2a2a);border-radius:2px;overflow:hidden;margin-bottom:8px}
        .tts-prog-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--accent,#646cff),var(--gold,#d4a853));transition:width .3s;width:0}
        .tts-prog-info{display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-dim,#888)}
        .tts-ctrls{display:flex;justify-content:center;gap:12px;margin-bottom:12px}
        .tts-btn{background:#0a0a0a;border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:10px 16px;color:var(--text,#e8e8e8);font-size:.85rem;cursor:pointer;transition:all .2s;font-family:inherit;display:flex;align-items:center;gap:6px}
        .tts-btn:hover{border-color:var(--accent,#646cff);transform:translateY(-1px)}
        .tts-btn.pri{background:linear-gradient(135deg,var(--accent,#646cff),var(--pink,#ff6b9d));border:none;color:#fff;min-width:100px;justify-content:center}
        .tts-txt{background:#0a0a0a;border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:12px;max-height:200px;overflow-y:auto;font-size:.85rem;color:var(--text-dim,#888);line-height:1.8}
        .tts-txt .chunk{transition:all .3s;padding:2px 4px;border-radius:4px;cursor:pointer}
        .tts-txt .chunk:hover{background:rgba(100,108,255,.08)}
        .tts-txt .chunk.active{color:var(--text,#e8e8e8);background:rgba(100,108,255,.15)}
        .tts-txt .chunk.played{color:var(--text-muted,#555)}
        .tts-speed{display:flex;align-items:center;gap:8px;margin-bottom:12px;justify-content:center}
        .tts-speed label{font-size:.75rem;color:var(--text-dim,#888)}
        .tts-speed input[type=range]{width:100px;accent-color:var(--accent,#646cff)}
        .tts-speed .val{font-size:.75rem;color:var(--text,#e8e8e8);min-width:30px}
        .tts-txt::-webkit-scrollbar{width:4px}
        .tts-txt::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
      
        @media(max-width:768px){
          .tts-p{padding:16px !important;border-radius:12px !important}
          .tts-p *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
      <div class="tts-p">
        <div class="tts-hd"><div class="icon">🎵</div><div><div class="title">TTS 朗读</div><div class="sub" id="tts-mode"><span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block"></span> 🎤 MIMO TTS · 流式无缝</div></div></div>
        <div class="tts-prog">
          <div class="tts-prog-bar"><div class="tts-prog-fill" id="tts-progress-fill"></div></div>
          <div class="tts-prog-info"><span id="tts-status">就绪</span><span>${this.isPlaying ? (this.isPaused ? '⏸ 已暂停' : '🔊 播放中') : '⏹ 已停止'}</span></div>
        </div>
        <div class="tts-speed"><label>语速</label><input type="range" min="0.5" max="2" step="0.1" value="${this.rate}" onchange="window.__ttsPlayer.setRate(this.value);this.nextElementSibling.textContent=this.value+'x'"><span class="val">${this.rate}x</span></div>
        <div class="tts-ctrls">
          <button class="tts-btn" onclick="window.__ttsPlayer.prev()">⏮</button>
          <button class="tts-btn pri" id="tts-play-btn" onclick="window.__ttsPlayer.togglePause()">⏸ 暂停</button>
          <button class="tts-btn" onclick="window.__ttsPlayer.stop()">⏹</button>
          <button class="tts-btn" onclick="window.__ttsPlayer.next()">⏭</button>
        </div>
        <div class="tts-txt" id="tts-text">${this.chunks.map((c, i) => `<span class="chunk${i === this.currentIdx ? ' active' : ''}" onclick="window.__ttsPlayer.seekTo(${i})">${c}</span>`).join(' ')}</div>
      </div>`;
      window.__ttsPlayer = this;
    }
  }

  window.FishTTSPlayer = FishTTSPlayer;
})();
