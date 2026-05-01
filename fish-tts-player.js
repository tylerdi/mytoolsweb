/**
 * 小鱼儿 TTS 分段播放器 🐟🎵
 * 长文分段朗读，流畅体验
 * 优先使用 MIMO TTS（小米），浏览器 TTS 兜底
 * 用法：<div id="fish-tts-player"></div><script src="/fish-tts-player.js"></script>
 */

(function () {
  'use strict';

  const CHUNK_SIZE = 200;
  const API_BASE = '/api';

  class FishTTSPlayer {
    constructor() {
      this.container = document.getElementById('fish-tts-player');
      this.synth = window.speechSynthesis;
      this.isPlaying = false;
      this.isPaused = false;
      this.chunks = [];
      this.currentIdx = 0;
      this.rate = 1.0;
      this.mode = 'mimo'; // 'mimo' | 'browser'
      this.audio = null;
      this.mimoAvailable = true;

      // 检测浏览器 TTS 支持
      this.hasBrowserTTS = 'speechSynthesis' in window;
    }

    /**
     * 播放长文本
     */
    play(text, opts = {}) {
      this.stop();
      if (!text || text.trim().length === 0) return;

      this.rate = opts.rate || 1.0;
      this.chunks = this.splitText(text);
      this.currentIdx = 0;
      this.isPlaying = true;
      this.isPaused = false;

      this.render();
      this.speakChunk(0);
    }

    /**
     * 智能分段
     */
    splitText(text) {
      const chunks = [];
      const paragraphs = text.split(/\n+/);

      for (const para of paragraphs) {
        if (para.trim().length === 0) continue;
        if (para.length <= CHUNK_SIZE) {
          chunks.push(para.trim());
        } else {
          const sentences = para.match(/[^。！？.!?\n]+[。！？.!?\n]?/g) || [para];
          let current = '';
          for (const s of sentences) {
            if (current.length + s.length > CHUNK_SIZE && current.length > 0) {
              chunks.push(current.trim());
              current = s;
            } else {
              current += s;
            }
          }
          if (current.trim()) chunks.push(current.trim());
        }
      }

      return chunks.filter(c => c.length > 0);
    }

    /**
     * 朗读指定段落
     */
    async speakChunk(idx) {
      if (idx >= this.chunks.length || !this.isPlaying) {
        this.isPlaying = false;
        this.updateUI();
        return;
      }

      this.currentIdx = idx;
      this.updateUI();

      // 优先 MIMO TTS
      if (this.mimoAvailable && this.mode === 'mimo') {
        try {
          await this.speakMimo(this.chunks[idx]);
          if (this.isPlaying && !this.isPaused) {
            this.speakChunk(idx + 1);
          }
          return;
        } catch (err) {
          console.warn('[TTS Player] MIMO 失败，切换浏览器 TTS:', err.message);
          this.mimoAvailable = false;
          this.mode = 'browser';
          this.updateUI();
        }
      }

      // 兜底：浏览器 TTS
      this.speakBrowser(this.chunks[idx]);
    }

    /**
     * MIMO TTS 播放
     */
    async speakMimo(text) {
      const res = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, speed: this.rate }),
      });

      if (!res.ok) throw new Error(`TTS API ${res.status}`);

      const blob = await res.blob();
      if (blob.size < 100) throw new Error('音频数据为空');

      const url = URL.createObjectURL(blob);

      return new Promise((resolve, reject) => {
        this.audio = new Audio(url);
        this.audio.onended = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
        this.audio.onerror = (e) => {
          URL.revokeObjectURL(url);
          reject(new Error('音频播放失败'));
        };
        this.audio.play().catch(reject);
      });
    }

    /**
     * 浏览器 TTS 播放
     */
    speakBrowser(text) {
      this.synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = this.rate;
      utter.pitch = 1.0;

      utter.onend = () => {
        if (this.isPlaying && !this.isPaused) {
          this.speakChunk(this.currentIdx + 1);
        }
      };

      utter.onerror = (e) => {
        if (e.error !== 'canceled' && this.isPlaying) {
          this.speakChunk(this.currentIdx + 1);
        }
      };

      setTimeout(() => this.synth.speak(utter), 50);
    }

    togglePause() {
      if (this.isPaused) {
        this.isPaused = false;
        if (this.mode === 'mimo' && this.audio) {
          this.audio.play();
        } else if (this.mode === 'browser') {
          this.synth.resume();
        }
      } else {
        this.isPaused = true;
        if (this.mode === 'mimo' && this.audio) {
          this.audio.pause();
        } else if (this.mode === 'browser') {
          this.synth.pause();
        }
      }
      this.updateUI();
    }

    stop() {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentIdx = 0;
      this.chunks = [];
      if (this.container) this.container.innerHTML = '';
    }

    prev() {
      if (this.currentIdx > 0) this.speakChunk(this.currentIdx - 1);
    }

    next() {
      if (this.currentIdx < this.chunks.length - 1) this.speakChunk(this.currentIdx + 1);
    }

    seekTo(idx) {
      if (idx >= 0 && idx < this.chunks.length) this.speakChunk(idx);
    }

    setRate(val) {
      this.rate = parseFloat(val);
      const valueEl = document.querySelector('.tts-speed .value');
      if (valueEl) valueEl.textContent = `${this.rate}x`;
    }

    render() {
      if (!this.container) return;

      const modeLabel = this.mode === 'mimo' ? '🎤 MIMO TTS' : '🌐 浏览器 TTS';
      const modeColor = this.mode === 'mimo' ? '#22c55e' : '#f97316';

      this.container.innerHTML = `
        <style>
          .tts-player {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; max-width: 500px; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif;
          }
          .tts-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
          .tts-icon { font-size: 1.5rem; }
          .tts-title { font-size: 0.9rem; color: var(--text, #e8e8e8); font-weight: 600; }
          .tts-subtitle { font-size: 0.75rem; color: var(--text-dim, #888); display: flex; align-items: center; gap: 6px; }
          .tts-mode-dot { width: 6px; height: 6px; border-radius: 50%; background: ${modeColor}; }
          .tts-progress {
            background: #0a0a0a; border-radius: 8px; padding: 12px; margin-bottom: 12px;
          }
          .tts-progress-bar {
            height: 4px; background: var(--border, #2a2a2a); border-radius: 2px;
            overflow: hidden; margin-bottom: 8px;
          }
          .tts-progress-fill {
            height: 100%; border-radius: 2px;
            background: linear-gradient(90deg, var(--accent, #646cff), var(--gold, #d4a853));
            transition: width 0.3s ease;
          }
          .tts-info { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-dim, #888); }
          .tts-controls { display: flex; justify-content: center; gap: 12px; margin-bottom: 12px; }
          .tts-btn {
            background: #0a0a0a; border: 1px solid var(--border, #2a2a2a);
            border-radius: 10px; padding: 10px 16px; color: var(--text, #e8e8e8);
            font-size: 0.85rem; cursor: pointer; transition: all 0.2s;
            font-family: inherit; display: flex; align-items: center; gap: 6px;
          }
          .tts-btn:hover { border-color: var(--accent, #646cff); transform: translateY(-1px); }
          .tts-btn.primary {
            background: linear-gradient(135deg, var(--accent, #646cff), var(--pink, #ff6b9d));
            border: none; color: #fff; min-width: 100px; justify-content: center;
          }
          .tts-text {
            background: #0a0a0a; border: 1px solid var(--border, #2a2a2a);
            border-radius: 10px; padding: 12px; max-height: 200px; overflow-y: auto;
            font-size: 0.85rem; color: var(--text-dim, #888); line-height: 1.8;
          }
          .tts-text .chunk { transition: all 0.3s ease; padding: 2px 4px; border-radius: 4px; cursor: pointer; }
          .tts-text .chunk:hover { background: rgba(100,108,255,0.08); }
          .tts-text .chunk.active { color: var(--text, #e8e8e8); background: rgba(100,108,255,0.15); }
          .tts-text .chunk.played { color: var(--text-muted, #555); }
          .tts-speed { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; justify-content: center; }
          .tts-speed label { font-size: 0.75rem; color: var(--text-dim, #888); }
          .tts-speed input[type="range"] { width: 100px; accent-color: var(--accent, #646cff); }
          .tts-speed .value { font-size: 0.75rem; color: var(--text, #e8e8e8); min-width: 30px; }
          .tts-text::-webkit-scrollbar { width: 4px; }
          .tts-text::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        </style>
        <div class="tts-player">
          <div class="tts-header">
            <div class="tts-icon">🎵</div>
            <div>
              <div class="tts-title">TTS 朗读</div>
              <div class="tts-subtitle">
                <span class="tts-mode-dot"></span>
                ${modeLabel} · 分段播放
              </div>
            </div>
          </div>
          <div class="tts-progress">
            <div class="tts-progress-bar">
              <div class="tts-progress-fill" id="tts-progress-fill"
                   style="width: ${((this.currentIdx + 1) / this.chunks.length * 100).toFixed(1)}%"></div>
            </div>
            <div class="tts-info">
              <span id="tts-status">第 ${this.currentIdx + 1}/${this.chunks.length} 段</span>
              <span>${this.isPlaying ? (this.isPaused ? '⏸ 已暂停' : '🔊 播放中') : '⏹ 已停止'}</span>
            </div>
          </div>
          <div class="tts-speed">
            <label>语速</label>
            <input type="range" min="0.5" max="2" step="0.1" value="${this.rate}"
                   onchange="window.__ttsPlayer.setRate(this.value)">
            <span class="value">${this.rate}x</span>
          </div>
          <div class="tts-controls">
            <button class="tts-btn" onclick="window.__ttsPlayer.prev()">⏮</button>
            <button class="tts-btn primary" id="tts-play-btn" onclick="window.__ttsPlayer.togglePause()">
              ⏸ 暂停
            </button>
            <button class="tts-btn" onclick="window.__ttsPlayer.stop()">⏹</button>
            <button class="tts-btn" onclick="window.__ttsPlayer.next()">⏭</button>
          </div>
          <div class="tts-text" id="tts-text">
            ${this.chunks.map((c, i) =>
              `<span class="chunk ${i === this.currentIdx ? 'active' : ''}" data-idx="${i}"
                     onclick="window.__ttsPlayer.seekTo(${i})">${c}</span>`
            ).join(' ')}
          </div>
        </div>
      `;

      window.__ttsPlayer = this;
    }

    updateUI() {
      const fill = document.getElementById('tts-progress-fill');
      const status = document.getElementById('tts-status');
      const playBtn = document.getElementById('tts-play-btn');
      const textEl = document.getElementById('tts-text');

      if (fill) {
        fill.style.width = `${((this.currentIdx + 1) / this.chunks.length * 100).toFixed(1)}%`;
      }
      if (status) {
        status.textContent = `第 ${this.currentIdx + 1}/${this.chunks.length} 段`;
      }
      if (playBtn) {
        playBtn.innerHTML = this.isPlaying
          ? (this.isPaused ? '▶ 继续' : '⏸ 暂停')
          : '▶ 播放';
      }
      if (textEl) {
        textEl.querySelectorAll('.chunk').forEach((span, i) => {
          span.className = 'chunk' +
            (i === this.currentIdx ? ' active' : '') +
            (i < this.currentIdx ? ' played' : '');
        });
        const active = textEl.querySelector('.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }

  window.FishTTSPlayer = FishTTSPlayer;
})();
