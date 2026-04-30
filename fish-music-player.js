/**
 * 小鱼儿网站音乐播放器 🐟🎵
 * 使用 Web Audio API 生成 Lo-fi 环境音乐，零外部依赖
 * 用法：<div id="fish-music-player"></div><script src="/fish-music-player.js"></script>
 */

(function () {
  'use strict';

  class FishMusicPlayer {
    constructor() {
      this.container = document.getElementById('fish-music-player');
      this.ctx = null;
      this.isPlaying = false;
      this.volume = 0.4;
      this.isMuted = false;
      this.genre = 'lofi';
      this.nodes = {};
      this.animFrame = null;

      if (this.container) this.render();
    }

    initAudioContext() {
      if (this.ctx) return;
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }

    /**
     * Lo-fi 风格：柔和的和弦 + 轻微的噪音 + 慢节奏
     */
    playLofi() {
      this.stopAll();
      this.initAudioContext();

      const now = this.ctx.currentTime;

      // 1. 柔和的和弦 pad
      const padGain = this.ctx.createGain();
      padGain.gain.value = 0.08;
      padGain.connect(this.masterGain);

      const chords = [
        [261.63, 329.63, 392.00], // C major
        [220.00, 277.18, 329.63], // A minor
        [246.94, 311.13, 369.99], // B diminished
        [196.00, 246.94, 293.66], // G major
      ];

      const chordOscs = [];
      chords.forEach((chord, ci) => {
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const env = this.ctx.createGain();
          env.gain.value = 0;
          osc.connect(env);
          env.connect(padGain);
          osc.start(now + ci * 2);
          // 缓慢的淡入淡出
          env.gain.linearRampToValueAtTime(0.3, now + ci * 2 + 0.5);
          env.gain.linearRampToValueAtTime(0, now + ci * 2 + 2);
          osc.stop(now + ci * 2 + 2.1);
          chordOscs.push(osc);
        });
      });
      this.nodes.chordOscs = chordOscs;

      // 2. Lo-fi 噪音底色
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * 0.15;
      }
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // 低通滤波器模拟 lo-fi 质感
      const lpf = this.ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 800;
      lpf.Q.value = 1;

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.value = 0.05;

      noiseSource.connect(lpf);
      lpf.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noiseSource.start(now);
      this.nodes.noise = noiseSource;

      // 3. 轻柔的 bass
      const bassOsc = this.ctx.createOscillator();
      bassOsc.type = 'triangle';
      bassOsc.frequency.value = 65.41; // C2
      const bassGain = this.ctx.createGain();
      bassGain.gain.value = 0.06;
      bassOsc.connect(bassGain);
      bassGain.connect(this.masterGain);
      bassOsc.start(now);
      this.nodes.bass = bassOsc;

      this.isPlaying = true;
      this.updateUI();
    }

    /**
     * 爵士风格
     */
    playJazz() {
      this.stopAll();
      this.initAudioContext();

      const now = this.ctx.currentTime;

      // 爵士和弦
      const jazzChords = [
        [261.63, 329.63, 392.00, 493.88], // Cmaj7
        [220.00, 277.18, 329.63, 415.30], // Am7
        [246.94, 311.13, 369.99, 466.16], // Bm7b5
        [196.00, 246.94, 293.66, 369.99], // G7
      ];

      const padGain = this.ctx.createGain();
      padGain.gain.value = 0.06;
      padGain.connect(this.masterGain);

      jazzChords.forEach((chord, ci) => {
        chord.forEach(freq => {
          const osc = this.ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = freq;
          const env = this.ctx.createGain();
          env.gain.value = 0;
          osc.connect(env);
          env.connect(padGain);
          osc.start(now + ci * 2.5);
          env.gain.linearRampToValueAtTime(0.25, now + ci * 2.5 + 0.3);
          env.gain.linearRampToValueAtTime(0, now + ci * 2.5 + 2.5);
          osc.stop(now + ci * 2.5 + 2.6);
        });
      });

      // 爵士鼓刷
      this.startBrushLoop();

      this.isPlaying = true;
      this.updateUI();
    }

    /**
     * 雨声环境音
     */
    playRain() {
      this.stopAll();
      this.initAudioContext();

      const now = this.ctx.currentTime;

      // 雨声：多层白噪声 + 滤波
      const bufferSize = this.ctx.sampleRate * 4;
      const rainBuffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const data = rainBuffer.getChannelData(ch);
        for (let i = 0; i < bufferSize; i++) {
          // 模拟雨滴的随机性
          const raindrop = Math.random() > 0.997 ? Math.random() * 0.5 : 0;
          const ambient = (Math.random() * 2 - 1) * 0.3;
          data[i] = ambient * 0.4 + raindrop;
        }
      }

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;

      const bpf = this.ctx.createBiquadFilter();
      bpf.type = 'bandpass';
      bpf.frequency.value = 2000;
      bpf.Q.value = 0.5;

      const rainGain = this.ctx.createGain();
      rainGain.gain.value = 0.15;

      rainSource.connect(bpf);
      bpf.connect(rainGain);
      rainGain.connect(this.masterGain);
      rainSource.start(now);
      this.nodes.rain = rainSource;

      // 远雷
      this.startThunderLoop();

      this.isPlaying = true;
      this.updateUI();
    }

    /**
     * 爵士鼓刷循环
     */
    startBrushLoop() {
      const schedule = () => {
        if (!this.isPlaying || !this.ctx) return;
        const now = this.ctx.currentTime;

        // 模拟鼓刷的沙沙声
        for (let i = 0; i < 8; i++) {
          const bufSize = this.ctx.sampleRate * 0.05;
          const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
          const data = buf.getChannelData(0);
          for (let j = 0; j < bufSize; j++) {
            data[j] = (Math.random() * 2 - 1) * (1 - j / bufSize);
          }
          const src = this.ctx.createBufferSource();
          src.buffer = buf;
          const g = this.ctx.createGain();
          g.gain.value = 0.03;
          src.connect(g);
          g.connect(this.masterGain);
          src.start(now + i * 0.25);
        }

        this.nodes.brushTimer = setTimeout(schedule, 2000);
      };
      schedule();
    }

    /**
     * 远雷声循环
     */
    startThunderLoop() {
      const schedule = () => {
        if (!this.isPlaying || !this.ctx) return;
        if (Math.random() > 0.7) {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.value = 40 + Math.random() * 30;
          const g = this.ctx.createGain();
          g.gain.value = 0;
          g.gain.linearRampToValueAtTime(0.05, now + 0.5);
          g.gain.linearRampToValueAtTime(0, now + 2);
          osc.connect(g);
          g.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 2.1);
        }
        this.nodes.thunderTimer = setTimeout(schedule, 5000 + Math.random() * 10000);
      };
      setTimeout(schedule, 3000);
    }

    /**
     * 停止所有音频
     */
    stopAll() {
      if (this.nodes.chordOscs) {
        this.nodes.chordOscs.forEach(o => { try { o.stop(); } catch {} });
      }
      if (this.nodes.noise) { try { this.nodes.noise.stop(); } catch {} }
      if (this.nodes.bass) { try { this.nodes.bass.stop(); } catch {} }
      if (this.nodes.rain) { try { this.nodes.rain.stop(); } catch {} }
      clearTimeout(this.nodes.brushTimer);
      clearTimeout(this.nodes.thunderTimer);
      this.nodes = {};
      this.isPlaying = false;
    }

    /**
     * 播放/暂停
     */
    togglePlay() {
      if (this.isPlaying) {
        this.stopAll();
      } else {
        this.playByGenre(this.genre);
      }
      this.updateUI();
    }

    playByGenre(genre) {
      this.genre = genre;
      switch (genre) {
        case 'jazz': this.playJazz(); break;
        case 'rain': this.playRain(); break;
        default: this.playLofi(); break;
      }
    }

    setVolume(val) {
      this.volume = parseFloat(val);
      if (this.masterGain) {
        this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      }
      this.updateUI();
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      if (this.masterGain) {
        this.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      }
      this.updateUI();
    }

    render() {
      const genres = [
        { id: 'lofi', icon: '🎵', name: 'Lo-fi' },
        { id: 'jazz', icon: '🎷', name: 'Jazz' },
        { id: 'rain', icon: '🌧️', name: '雨声' },
      ];

      this.container.innerHTML = `
        <style>
          .music-widget {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 24px; max-width: 380px; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif; text-align: center;
          }
          .music-title { font-size: 1.1rem; font-weight: 700; color: var(--text, #e8e8e8); margin-bottom: 4px; }
          .music-subtitle { font-size: 0.75rem; color: var(--text-dim, #888); margin-bottom: 20px; }
          .music-visual {
            height: 80px; display: flex; align-items: center; justify-content: center; gap: 4px;
            margin-bottom: 20px;
          }
          .music-bar {
            width: 4px; border-radius: 2px;
            background: linear-gradient(180deg, var(--accent, #646cff), var(--gold, #d4a853));
            transition: height 0.15s ease;
          }
          .music-bar.playing { animation: musicBarAnim 0.8s ease-in-out infinite alternate; }
          @keyframes musicBarAnim { from { height: 10px; } to { height: 60px; } }
          .music-genres { display: flex; justify-content: center; gap: 10px; margin-bottom: 20px; }
          .music-genre {
            background: #0a0a0a; border: 1px solid var(--border, #2a2a2a); border-radius: 10px;
            padding: 8px 16px; color: var(--text-dim, #888); font-size: 0.8rem;
            cursor: pointer; transition: all 0.2s; font-family: inherit;
          }
          .music-genre:hover { border-color: var(--accent, #646cff); }
          .music-genre.active { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); background: rgba(100,108,255,0.1); }
          .music-play-btn {
            width: 60px; height: 60px; border-radius: 50%; border: none;
            background: linear-gradient(135deg, var(--accent, #646cff), var(--pink, #ff6b9d));
            color: #fff; font-size: 1.5rem; cursor: pointer; transition: all 0.2s;
            margin-bottom: 16px;
          }
          .music-play-btn:hover { transform: scale(1.1); }
          .music-volume { display: flex; align-items: center; justify-content: center; gap: 8px; }
          .music-volume input[type="range"] { width: 100px; accent-color: var(--accent, #646cff); }
          .music-volume .icon { cursor: pointer; font-size: 1.2rem; }
          .music-note { font-size: 0.7rem; color: var(--text-muted, #555); margin-top: 12px; }
        </style>
        <div class="music-widget">
          <div class="music-title">🎵 网站 BGM</div>
          <div class="music-subtitle">Web Audio API 生成 · 零延迟</div>
          <div class="music-visual" id="music-visual">
            ${Array(20).fill(0).map((_, i) => `<div class="music-bar" style="height:${10 + Math.random() * 20}px;animation-delay:${i * 0.05}s"></div>`).join('')}
          </div>
          <div class="music-genres">
            ${genres.map(g => `
              <button class="music-genre ${g.id === this.genre ? 'active' : ''}"
                      onclick="window.__musicPlayer.playByGenre('${g.id}')">
                ${g.icon} ${g.name}
              </button>
            `).join('')}
          </div>
          <button class="music-play-btn" id="music-play-btn" onclick="window.__musicPlayer.togglePlay()">
            ${this.isPlaying ? '⏸' : '▶'}
          </button>
          <div class="music-volume">
            <span class="icon" onclick="window.__musicPlayer.toggleMute()">${this.isMuted ? '🔇' : '🔊'}</span>
            <input type="range" min="0" max="1" step="0.05" value="${this.volume}"
                   oninput="window.__musicPlayer.setVolume(this.value)">
          </div>
          <div class="music-note">生成式音乐 · 无需加载 · 每次不同</div>
        </div>
      `;

      window.__musicPlayer = this;
    }

    updateUI() {
      const btn = document.getElementById('music-play-btn');
      const visual = document.getElementById('music-visual');
      const genres = this.container?.querySelectorAll('.music-genre');

      if (btn) btn.innerHTML = this.isPlaying ? '⏸' : '▶';
      if (visual) {
        visual.querySelectorAll('.music-bar').forEach(bar => {
          bar.classList.toggle('playing', this.isPlaying);
        });
      }
      if (genres) {
        genres.forEach(g => {
          const id = g.textContent.trim().includes('Lo-fi') ? 'lofi'
                   : g.textContent.trim().includes('Jazz') ? 'jazz' : 'rain';
          g.classList.toggle('active', id === this.genre);
        });
      }
    }
  }

  window.FishMusicPlayer = FishMusicPlayer;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('fish-music-player')) new FishMusicPlayer();
    });
  } else {
    if (document.getElementById('fish-music-player')) new FishMusicPlayer();
  }
})();
