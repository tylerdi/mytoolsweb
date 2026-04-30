/**
 * 小鱼儿 TTS 分段播放器 🐟🎵
 * 长文分段朗读，流畅体验
 * 支持 Web Speech API（免费）和服务器 TTS API
 * 用法：
 *   <div id="fish-tts-player"></div>
 *   <script src="/fish-tts-player.js"></script>
 *   <script>
 *     const player = new FishTTSPlayer();
 *     player.play('要朗读的长文本...');
 *   </script>
 */

(function () {
  'use strict';

  const CHUNK_SIZE = 200; // 每段最大字数

  class FishTTSPlayer {
    constructor() {
      this.container = document.getElementById('fish-tts-player');
      this.synth = window.speechSynthesis;
      this.utterance = null;
      this.isPlaying = false;
      this.isPaused = false;
      this.chunks = [];
      this.currentIdx = 0;
      this.voice = null;
      this.rate = 1.0;

      // 自动选择中文语音
      this.initVoice();
    }

    initVoice() {
      const setVoice = () => {
        const voices = this.synth.getVoices();
        // 优先选择中文语音
        this.voice = voices.find(v => v.lang.startsWith('zh')) ||
                     voices.find(v => v.lang.startsWith('cmn')) ||
                     voices[0];
      };

      setVoice();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = setVoice;
      }
    }

    /**
     * 播放长文本
     * @param {string} text - 要播放的文本
     * @param {object} opts - 选项 { rate, voice }
     */
    play(text, opts = {}) {
      this.stop();

      if (!text || text.trim().length === 0) return;

      this.rate = opts.rate || 1.0;
      if (opts.voice) this.voice = opts.voice;

      // 分段
      this.chunks = this.splitText(text);
      this.currentIdx = 0;
      this.isPlaying = true;
      this.isPaused = false;

      // 渲染 UI
      this.render();

      // 开始播放第一段
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
    speakChunk(idx) {
      if (idx >= this.chunks.length || !this.isPlaying) {
        this.isPlaying = false;
        this.updateUI();
        return;
      }

      this.currentIdx = idx;
      this.updateUI();

      // 取消之前的朗读
      this.synth.cancel();

      const utter = new SpeechSynthesisUtterance(this.chunks[idx]);
      if (this.voice) utter.voice = this.voice;
      utter.rate = this.rate;
      utter.pitch = 1.0;
      utter.volume = 1.0;

      utter.onend = () => {
        if (this.isPlaying && !this.isPaused) {
          this.speakChunk(idx + 1);
        }
      };

      utter.onerror = (e) => {
        console.error('TTS error:', e);
        if (this.isPlaying) {
          this.speakChunk(idx + 1);
        }
      };

      this.utterance = utter;
      this.synth.speak(utter);
    }

    /**
     * 暂停/继续
     */
    togglePause() {
      if (this.isPaused) {
        this.synth.resume();
        this.isPaused = false;
      } else {
        this.synth.pause();
        this.isPaused = true;
      }
      this.updateUI();
    }

    /**
     * 停止播放
     */
    stop() {
      this.synth.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.currentIdx = 0;
      this.chunks = [];

      if (this.container) {
        this.container.innerHTML = '';
      }
    }

    /**
     * 上一段
     */
    prev() {
      if (this.currentIdx > 0) {
        this.speakChunk(this.currentIdx - 1);
      }
    }

    /**
     * 下一段
     */
    next() {
      if (this.currentIdx < this.chunks.length - 1) {
        this.speakChunk(this.currentIdx + 1);
      }
    }

    /**
     * 跳转到指定段落
     */
    seekTo(idx) {
      if (idx >= 0 && idx < this.chunks.length) {
        this.speakChunk(idx);
      }
    }

    /**
     * 渲染播放器 UI
     */
    render() {
      if (!this.container) return;

      this.container.innerHTML = `
        <style>
          .tts-player {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; max-width: 500px; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif;
          }
          .tts-header {
            display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
          }
          .tts-icon { font-size: 1.5rem; }
          .tts-title { font-size: 0.9rem; color: var(--text, #e8e8e8); font-weight: 600; }
          .tts-subtitle { font-size: 0.75rem; color: var(--text-dim, #888); }
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
          .tts-info {
            display: flex; justify-content: space-between;
            font-size: 0.7rem; color: var(--text-dim, #888);
          }
          .tts-controls {
            display: flex; justify-content: center; gap: 12px; margin-bottom: 12px;
          }
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
          .tts-text .chunk { transition: all 0.3s ease; padding: 2px 4px; border-radius: 4px; }
          .tts-text .chunk.active {
            color: var(--text, #e8e8e8);
            background: rgba(100, 108, 255, 0.15);
          }
          .tts-text .chunk.played { color: var(--text-muted, #555); }
          .tts-speed {
            display: flex; align-items: center; gap: 8px; margin-bottom: 12px;
            justify-content: center;
          }
          .tts-speed label { font-size: 0.75rem; color: var(--text-dim, #888); }
          .tts-speed input[type="range"] {
            width: 100px; accent-color: var(--accent, #646cff);
          }
          .tts-speed .value { font-size: 0.75rem; color: var(--text, #e8e8e8); min-width: 30px; }
        </style>
        <div class="tts-player">
          <div class="tts-header">
            <div class="tts-icon">🎵</div>
            <div>
              <div class="tts-title">TTS 朗读</div>
              <div class="tts-subtitle">分段播放 · 流畅体验</div>
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

      // 高亮当前段落
      if (textEl) {
        textEl.querySelectorAll('.chunk').forEach((span, i) => {
          span.className = 'chunk' +
            (i === this.currentIdx ? ' active' : '') +
            (i < this.currentIdx ? ' played' : '');
        });
        // 滚动到当前段落
        const active = textEl.querySelector('.active');
        if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    setRate(val) {
      this.rate = parseFloat(val);
      const valueEl = document.querySelector('.tts-speed .value');
      if (valueEl) valueEl.textContent = `${this.rate}x`;
    }
  }

  // 暴露全局接口
  window.FishTTSPlayer = FishTTSPlayer;
})();
