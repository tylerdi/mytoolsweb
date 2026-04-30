/**
 * 小鱼儿网站音乐播放器 🐟🎵
 * 后台播放，带进度条和控制
 * 支持免费音乐源：Pixabay、Free Music Archive
 * 用法：<div id="fish-music-player"></div><script src="/fish-music-player.js"></script>
 */

(function () {
  'use strict';

  // 免费音乐库
  // 来源：Incompetech (Kevin MacLeod) - CC BY 3.0 协议，免费商用需署名
  const MUSIC_LIBRARY = [
    {
      id: 1,
      title: 'Local Forecast',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Local%20Forecast.mp3',
      duration: 180,
      genre: 'Upbeat',
    },
    {
      id: 2,
      title: 'Comparsa',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Comparsa.mp3',
      duration: 150,
      genre: 'Latin',
    },
    {
      id: 3,
      title: 'Silly Fun',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Silly%20Fun.mp3',
      duration: 120,
      genre: 'Comedy',
    },
    {
      id: 4,
      title: 'Carefree',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Carefree.mp3',
      duration: 140,
      genre: 'Happy',
    },
    {
      id: 5,
      title: 'Clean Soul',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Clean%20Soul.mp3',
      duration: 160,
      genre: 'Calm',
    },
    {
      id: 6,
      title: 'Easy Lemon',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Easy%20Lemon.mp3',
      duration: 130,
      genre: 'Acoustic',
    },
    {
      id: 7,
      title: 'Friendly Day',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Friendly%20Day.mp3',
      duration: 145,
      genre: 'Happy',
    },
    {
      id: 8,
      title: 'Monkeys Spinning Monkeys',
      artist: 'Kevin MacLeod',
      url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3',
      duration: 115,
      genre: 'Quirky',
    },
  ];

  class FishMusicPlayer {
    constructor() {
      this.container = document.getElementById('fish-music-player');
      this.audio = new Audio();
      this.playlist = [...MUSIC_LIBRARY];
      this.currentIdx = 0;
      this.isPlaying = false;
      this.volume = 0.5;
      this.isMuted = false;
      this.isShuffled = false;
      this.repeatMode = 'none'; // none, one, all

      this.audio.volume = this.volume;

      // 事件绑定
      this.audio.addEventListener('timeupdate', () => this.updateProgress());
      this.audio.addEventListener('ended', () => this.handleEnded());
      this.audio.addEventListener('loadedmetadata', () => this.updateUI());
      this.audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        this.next();
      });

      this.init();
    }

    init() {
      if (this.container) {
        this.render();
      }
    }

    /**
     * 播放指定曲目
     */
    play(idx) {
      if (idx !== undefined) {
        this.currentIdx = idx;
      }

      const track = this.playlist[this.currentIdx];
      if (!track) return;

      this.audio.src = track.url;
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.updateUI();
        this.updateMediaSession();
      }).catch(e => {
        console.error('Play failed:', e);
      });
    }

    /**
     * 暂停/继续
     */
    togglePlay() {
      if (this.isPlaying) {
        this.audio.pause();
        this.isPlaying = false;
      } else {
        this.audio.play();
        this.isPlaying = true;
      }
      this.updateUI();
    }

    /**
     * 上一首
     */
    prev() {
      if (this.isShuffled) {
        this.currentIdx = Math.floor(Math.random() * this.playlist.length);
      } else {
        this.currentIdx = (this.currentIdx - 1 + this.playlist.length) % this.playlist.length;
      }
      this.play();
    }

    /**
     * 下一首
     */
    next() {
      if (this.repeatMode === 'one') {
        this.play();
        return;
      }

      if (this.isShuffled) {
        this.currentIdx = Math.floor(Math.random() * this.playlist.length);
      } else {
        this.currentIdx = (this.currentIdx + 1) % this.playlist.length;
      }
      this.play();
    }

    /**
     * 处理播放结束
     */
    handleEnded() {
      if (this.repeatMode === 'one') {
        this.play();
      } else if (this.repeatMode === 'all' || this.currentIdx < this.playlist.length - 1) {
        this.next();
      } else {
        this.isPlaying = false;
        this.updateUI();
      }
    }

    /**
     * 设置音量
     */
    setVolume(val) {
      this.volume = parseFloat(val);
      this.audio.volume = this.volume;
      this.isMuted = this.volume === 0;
      this.updateUI();
    }

    /**
     * 静音/取消静音
     */
    toggleMute() {
      this.isMuted = !this.isMuted;
      this.audio.volume = this.isMuted ? 0 : this.volume;
      this.updateUI();
    }

    /**
     * 切换随机播放
     */
    toggleShuffle() {
      this.isShuffled = !this.isShuffled;
      this.updateUI();
    }

    /**
     * 切换循环模式
     */
    toggleRepeat() {
      const modes = ['none', 'all', 'one'];
      const idx = modes.indexOf(this.repeatMode);
      this.repeatMode = modes[(idx + 1) % modes.length];
      this.updateUI();
    }

    /**
     * 进度条拖动
     */
    seek(e) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = x / rect.width;
      this.audio.currentTime = percent * this.audio.duration;
    }

    /**
     * 更新进度条
     */
    updateProgress() {
      const fill = document.getElementById('music-progress-fill');
      const timeEl = document.getElementById('music-time');

      if (fill && this.audio.duration) {
        fill.style.width = `${(this.audio.currentTime / this.audio.duration * 100).toFixed(1)}%`;
      }
      if (timeEl) {
        timeEl.textContent = `${this.formatTime(this.audio.currentTime)} / ${this.formatTime(this.audio.duration || 0)}`;
      }
    }

    /**
     * 格式化时间
     */
    formatTime(sec) {
      if (isNaN(sec)) return '0:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * 更新 Media Session API（锁屏控制）
     */
    updateMediaSession() {
      if ('mediaSession' in navigator) {
        const track = this.playlist[this.currentIdx];
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: '小鱼儿网站 BGM',
        });

        navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
        navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
      }
    }

    /**
     * 渲染播放器 UI
     */
    render() {
      const track = this.playlist[this.currentIdx];

      this.container.innerHTML = `
        <style>
          .music-player {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; max-width: 400px; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif;
          }
          .music-cover {
            width: 100%; height: 200px; background: linear-gradient(135deg, #1a1a2e, #16213e);
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
            margin-bottom: 16px; position: relative; overflow: hidden;
          }
          .music-cover::before {
            content: ''; position: absolute; width: 80px; height: 80px;
            background: radial-gradient(circle, var(--accent, #646cff), transparent);
            border-radius: 50%; animation: musicPulse 2s ease-in-out infinite;
            opacity: ${this.isPlaying ? 0.6 : 0.2};
          }
          @keyframes musicPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.5); opacity: 0.6; }
          }
          .music-cover .icon { font-size: 3rem; z-index: 1; }
          .music-info { text-align: center; margin-bottom: 12px; }
          .music-title { font-size: 1rem; font-weight: 700; color: var(--text, #e8e8e8); margin-bottom: 4px; }
          .music-artist { font-size: 0.8rem; color: var(--text-dim, #888); }
          .music-progress-container {
            margin-bottom: 12px; cursor: pointer;
          }
          .music-progress {
            height: 4px; background: var(--border, #2a2a2a); border-radius: 2px;
            overflow: hidden; margin-bottom: 4px;
          }
          .music-progress-fill {
            height: 100%; border-radius: 2px;
            background: linear-gradient(90deg, var(--accent, #646cff), var(--pink, #ff6b9d));
            transition: width 0.1s linear;
          }
          .music-time {
            display: flex; justify-content: space-between;
            font-size: 0.7rem; color: var(--text-dim, #888);
          }
          .music-controls {
            display: flex; align-items: center; justify-content: center; gap: 16px;
            margin-bottom: 12px;
          }
          .music-btn {
            background: none; border: none; color: var(--text-dim, #888);
            font-size: 1.2rem; cursor: pointer; transition: all 0.2s;
            width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
          }
          .music-btn:hover { color: var(--text, #e8e8e8); background: rgba(255,255,255,0.1); }
          .music-btn.active { color: var(--accent, #646cff); }
          .music-btn.play {
            width: 50px; height: 50px; font-size: 1.5rem;
            background: linear-gradient(135deg, var(--accent, #646cff), var(--pink, #ff6b9d));
            color: #fff; border-radius: 50%;
          }
          .music-btn.play:hover { transform: scale(1.1); }
          .music-volume {
            display: flex; align-items: center; gap: 8px; justify-content: center;
          }
          .music-volume input[type="range"] {
            width: 80px; accent-color: var(--accent, #646cff);
          }
          .music-playlist {
            margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border, #2a2a2a);
            max-height: 200px; overflow-y: auto;
          }
          .music-playlist-title {
            font-size: 0.75rem; color: var(--text-dim, #888); margin-bottom: 8px; font-weight: 600;
          }
          .music-track {
            display: flex; align-items: center; gap: 10px; padding: 8px;
            border-radius: 8px; cursor: pointer; transition: all 0.2s;
          }
          .music-track:hover { background: rgba(255,255,255,0.05); }
          .music-track.active { background: rgba(100,108,255,0.1); }
          .music-track .idx { font-size: 0.75rem; color: var(--text-dim, #888); min-width: 20px; }
          .music-track .info { flex: 1; }
          .music-track .name { font-size: 0.8rem; color: var(--text, #e8e8e8); }
          .music-track .genre { font-size: 0.7rem; color: var(--text-dim, #888); }
          .music-track .dur { font-size: 0.7rem; color: var(--text-dim, #888); }
        </style>
        <div class="music-player">
          <div class="music-cover">
            <div class="icon">${this.isPlaying ? '🎵' : '🎶'}</div>
          </div>
          <div class="music-info">
            <div class="music-title">${track.title}</div>
            <div class="music-artist">${track.artist} · ${track.genre}</div>
          </div>
          <div class="music-progress-container" onclick="window.__musicPlayer.seek(event)">
            <div class="music-progress">
              <div class="music-progress-fill" id="music-progress-fill" style="width: 0%"></div>
            </div>
            <div class="music-time">
              <span id="music-time">0:00 / 0:00</span>
            </div>
          </div>
          <div class="music-controls">
            <button class="music-btn ${this.isShuffled ? 'active' : ''}"
                    onclick="window.__musicPlayer.toggleShuffle()" title="随机">🔀</button>
            <button class="music-btn" onclick="window.__musicPlayer.prev()">⏮</button>
            <button class="music-btn play" onclick="window.__musicPlayer.togglePlay()">
              ${this.isPlaying ? '⏸' : '▶'}
            </button>
            <button class="music-btn" onclick="window.__musicPlayer.next()">⏭</button>
            <button class="music-btn ${this.repeatMode !== 'none' ? 'active' : ''}"
                    onclick="window.__musicPlayer.toggleRepeat()" title="循环">
              ${this.repeatMode === 'one' ? '🔂' : '🔁'}
            </button>
          </div>
          <div class="music-volume">
            <button class="music-btn" onclick="window.__musicPlayer.toggleMute()" style="width:30px;height:30px;font-size:0.9rem">
              ${this.isMuted ? '🔇' : this.volume > 0.5 ? '🔊' : '🔉'}
            </button>
            <input type="range" min="0" max="1" step="0.05" value="${this.volume}"
                   oninput="window.__musicPlayer.setVolume(this.value)">
          </div>
          <div class="music-playlist">
            <div class="music-playlist-title">🎶 播放列表 (${this.playlist.length}首)</div>
            ${this.playlist.map((t, i) => `
              <div class="music-track ${i === this.currentIdx ? 'active' : ''}"
                   onclick="window.__musicPlayer.play(${i})">
                <div class="idx">${i + 1}</div>
                <div class="info">
                  <div class="name">${t.title}</div>
                  <div class="genre">${t.genre}</div>
                </div>
                <div class="dur">${this.formatTime(t.duration)}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      window.__musicPlayer = this;
    }

    updateUI() {
      const track = this.playlist[this.currentIdx];
      if (!track || !this.container) return;

      // 更新基本信息
      const titleEl = this.container.querySelector('.music-title');
      const artistEl = this.container.querySelector('.music-artist');
      const iconEl = this.container.querySelector('.music-cover .icon');
      const playBtn = this.container.querySelector('.music-btn.play');

      if (titleEl) titleEl.textContent = track.title;
      if (artistEl) artistEl.textContent = `${track.artist} · ${track.genre}`;
      if (iconEl) iconEl.textContent = this.isPlaying ? '🎵' : '🎶';
      if (playBtn) playBtn.innerHTML = this.isPlaying ? '⏸' : '▶';

      // 更新播放列表高亮
      this.container.querySelectorAll('.music-track').forEach((el, i) => {
        el.className = `music-track ${i === this.currentIdx ? 'active' : ''}`;
      });
    }
  }

  // 暴露全局接口
  window.FishMusicPlayer = FishMusicPlayer;

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('fish-music-player')) {
        new FishMusicPlayer();
      }
    });
  } else {
    if (document.getElementById('fish-music-player')) {
      new FishMusicPlayer();
    }
  }
})();
