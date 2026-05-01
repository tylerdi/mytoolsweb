/**
 * 小鱼儿视频播放器 🐟🎬
 * Pexels 免费视频 + 分类浏览 + 全屏播放器
 * 用法：<div id="fish-video-player"></div><script src="/fish-video-player.js"></script>
 */
(function () {
  'use strict';

  const PEXELS_API = 'https://api.pexels.com/videos/search';
  // Pexels API key — 公开免费 key，速率有限
  const PEXELS_KEY = 'DqKEbBsmBik7vOSGk4HDJxsfKqK8aXvUJrXw0Sg25e0ZvJSn9c90YpcE';

  const CATEGORIES = [
    { id: 'nature',    label: '🌿 自然',     query: 'nature forest landscape' },
    { id: 'cinematic', label: '🎬 电影感',   query: 'cinematic aerial drone' },
    { id: 'city',      label: '🌆 城市',     query: 'city urban night skyline' },
    { id: 'animals',   label: '🐾 动物',     query: 'animals wildlife cute' },
    { id: 'ocean',     label: '🌊 海洋',     query: 'ocean sea waves underwater' },
    { id: 'abstract',  label: '🔬 抽象',     query: 'abstract light particles' },
  ];

  // 备用视频（Pexels 无 API key 时的 fallback）
  const FALLBACK_VIDEOS = [
    { id: 'f1', thumbnail: '', title: '自然风光', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10, author: 'W3Schools', width: 640, height: 360 },
    { id: 'f2', thumbnail: '', title: '城市夜景', videoUrl: 'https://www.w3schools.com/html/movie.mp4', duration: 12, author: 'W3Schools', width: 640, height: 360 },
  ];

  class FishVideoPlayer {
    constructor() {
      this.el = document.getElementById('fish-video-player');
      if (!this.el) return;
      this.videos = [];
      this.currentCat = 'nature';
      this.searchTimer = null;
      this.modal = null;
      this.videoEl = null;
      this.playing = false;
      this.currentVideo = null;

      this.render();
      this.loadCategory('nature');
      this.bindKeys();
    }

    // ===== 数据加载 =====
    async loadCategory(catId) {
      this.currentCat = catId;
      const cat = CATEGORIES.find(c => c.id === catId);
      if (!cat) return;
      this.highlightTab(catId);
      this.showSkeleton();
      try {
        const res = await fetch(`${PEXELS_API}?query=${encodeURIComponent(cat.query)}&per_page=18`, {
          headers: { Authorization: PEXELS_KEY }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.videos = (data.videos || []).map(v => this.mapVideo(v));
      } catch (e) {
        console.warn('Pexels load failed, using fallback:', e);
        this.videos = FALLBACK_VIDEOS;
      }
      this.renderGrid();
    }

    async searchVideos(q) {
      if (!q.trim()) { this.loadCategory(this.currentCat); return; }
      this.showSkeleton();
      try {
        const res = await fetch(`${PEXELS_API}?query=${encodeURIComponent(q)}&per_page=18`, {
          headers: { Authorization: PEXELS_KEY }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        this.videos = (data.videos || []).map(v => this.mapVideo(v));
      } catch (e) {
        console.warn('Search failed:', e);
        this.videos = [];
      }
      this.renderGrid();
    }

    mapVideo(v) {
      // 优先 720p，其次 sd，最后第一个
      const files = v.video_files || [];
      let best = files.find(f => f.quality === 'hd' && f.width <= 1280) ||
                 files.find(f => f.quality === 'sd' && f.width <= 960) ||
                 files[0] || {};
      return {
        id: v.id,
        title: v.title || `Video #${v.id}`,
        thumbnail: v.image || '',
        videoUrl: best.link || '',
        duration: v.duration || 0,
        author: v.user?.name || 'Pexels',
        width: best.width || 640,
        height: best.height || 360,
      };
    }

    // ===== UI 渲染 =====
    render() {
      this.el.innerHTML = `
        <style>
          #fish-video-player {
            --fvp-bg: var(--bg, #0a0a0a);
            --fvp-surface: var(--surface, #141414);
            --fvp-surface2: var(--surface-2, #1e1e1e);
            --fvp-accent: var(--accent, #646cff);
            --fvp-accent-hover: var(--accent-hover, #535bf2);
            --fvp-text: #e0e0e0;
            --fvp-text-dim: #888;
            --fvp-radius: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: var(--fvp-text);
          }
          /* 分类标签 */
          .fvp-tabs {
            display: flex; gap: 8px; flex-wrap: wrap;
            padding: 16px 0 12px; justify-content: center;
          }
          .fvp-tab {
            padding: 8px 18px; border-radius: 20px;
            background: var(--fvp-surface); border: 1px solid rgba(255,255,255,0.08);
            color: var(--fvp-text-dim); cursor: pointer; font-size: 14px;
            transition: all .2s; user-select: none;
          }
          .fvp-tab:hover { background: var(--fvp-surface2); color: var(--fvp-text); }
          .fvp-tab.active {
            background: var(--fvp-accent); color: #fff;
            border-color: var(--fvp-accent);
            box-shadow: 0 2px 12px rgba(100,108,255,.3);
          }
          /* 搜索框 */
          .fvp-search-wrap {
            display: flex; justify-content: center; padding: 0 0 20px;
          }
          .fvp-search {
            width: 100%; max-width: 480px; padding: 10px 16px;
            background: var(--fvp-surface); border: 1px solid rgba(255,255,255,0.1);
            border-radius: 24px; color: var(--fvp-text); font-size: 14px;
            outline: none; transition: border-color .2s;
          }
          .fvp-search::placeholder { color: var(--fvp-text-dim); }
          .fvp-search:focus { border-color: var(--fvp-accent); }
          /* 视频网格 */
          .fvp-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 16px; padding: 0 0 24px;
          }
          @media (max-width: 900px) {
            .fvp-grid { grid-template-columns: repeat(2, 1fr); }
          }
          @media (max-width: 540px) {
            .fvp-grid { grid-template-columns: 1fr; }
          }
          /* 视频卡片 */
          .fvp-card {
            position: relative; border-radius: var(--fvp-radius);
            overflow: hidden; cursor: pointer;
            background: var(--fvp-surface);
            border: 1px solid rgba(255,255,255,0.06);
            transition: transform .25s, box-shadow .25s;
            backdrop-filter: blur(12px);
          }
          .fvp-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 32px rgba(0,0,0,.4), 0 0 0 1px rgba(100,108,255,.2);
          }
          .fvp-card-img {
            width: 100%; aspect-ratio: 16/9; object-fit: cover;
            display: block; background: var(--fvp-surface2);
          }
          .fvp-card-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 50%);
            display: flex; flex-direction: column; justify-content: flex-end;
            padding: 12px; opacity: 0; transition: opacity .25s;
          }
          .fvp-card:hover .fvp-card-overlay { opacity: 1; }
          .fvp-card-title {
            font-size: 14px; font-weight: 600; color: #fff;
            margin-bottom: 4px; text-shadow: 0 1px 4px rgba(0,0,0,.6);
          }
          .fvp-card-meta {
            font-size: 12px; color: rgba(255,255,255,.7);
          }
          .fvp-card-play {
            position: absolute; top: 50%; left: 50%;
            transform: translate(-50%, -50%) scale(0.8);
            width: 48px; height: 48px; border-radius: 50%;
            background: rgba(100,108,255,.85); display: flex;
            align-items: center; justify-content: center;
            opacity: 0; transition: all .25s;
            box-shadow: 0 4px 16px rgba(100,108,255,.4);
          }
          .fvp-card:hover .fvp-card-play {
            opacity: 1; transform: translate(-50%, -50%) scale(1);
          }
          .fvp-card-play svg { width: 20px; height: 20px; fill: #fff; margin-left: 2px; }
          .fvp-card-duration {
            position: absolute; bottom: 8px; right: 8px;
            background: rgba(0,0,0,.7); padding: 2px 6px;
            border-radius: 4px; font-size: 11px; color: #fff;
          }
          /* 骨架屏 */
          .fvp-skeleton {
            background: var(--fvp-surface);
            border-radius: var(--fvp-radius);
            aspect-ratio: 16/9;
            position: relative; overflow: hidden;
          }
          .fvp-skeleton::after {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.04) 50%, transparent 70%);
            animation: fvp-shimmer 1.5s infinite;
          }
          @keyframes fvp-shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          /* 模态框 */
          .fvp-modal {
            position: fixed; inset: 0; z-index: 10000;
            background: rgba(0,0,0,.85);
            backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            opacity: 0; pointer-events: none;
            transition: opacity .3s;
          }
          .fvp-modal.open { opacity: 1; pointer-events: all; }
          .fvp-modal-inner {
            position: relative; width: 90vw; max-width: 960px;
            border-radius: var(--fvp-radius); overflow: hidden;
            background: #000; box-shadow: 0 16px 64px rgba(0,0,0,.6);
          }
          .fvp-modal-video {
            width: 100%; display: block; max-height: 80vh;
            background: #000;
          }
          .fvp-modal-close {
            position: absolute; top: 12px; right: 12px; z-index: 10;
            width: 36px; height: 36px; border-radius: 50%;
            background: rgba(0,0,0,.6); border: none;
            color: #fff; font-size: 18px; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: background .2s;
          }
          .fvp-modal-close:hover { background: rgba(255,60,60,.8); }
          /* 自定义控制条 */
          .fvp-controls {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: linear-gradient(to top, rgba(0,0,0,.8), transparent);
            padding: 32px 16px 12px;
            display: flex; align-items: center; gap: 12px;
            opacity: 0; transition: opacity .3s;
          }
          .fvp-modal-inner:hover .fvp-controls,
          .fvp-controls.show { opacity: 1; }
          .fvp-ctrl-btn {
            background: none; border: none; color: #fff;
            cursor: pointer; padding: 4px; display: flex;
            align-items: center; justify-content: center;
            opacity: .85; transition: opacity .2s;
          }
          .fvp-ctrl-btn:hover { opacity: 1; }
          .fvp-ctrl-btn svg { width: 22px; height: 22px; fill: currentColor; }
          .fvp-progress-wrap {
            flex: 1; height: 4px; background: rgba(255,255,255,.2);
            border-radius: 2px; cursor: pointer; position: relative;
            transition: height .15s;
          }
          .fvp-progress-wrap:hover { height: 6px; }
          .fvp-progress-bar {
            height: 100%; background: var(--fvp-accent);
            border-radius: 2px; width: 0%; position: relative;
          }
          .fvp-progress-bar::after {
            content: ''; position: absolute; right: -5px; top: 50%;
            transform: translateY(-50%); width: 10px; height: 10px;
            border-radius: 50%; background: var(--fvp-accent);
            opacity: 0; transition: opacity .15s;
          }
          .fvp-progress-wrap:hover .fvp-progress-bar::after { opacity: 1; }
          .fvp-time { font-size: 12px; color: rgba(255,255,255,.7); white-space: nowrap; }
          .fvp-volume-wrap {
            display: flex; align-items: center; gap: 4px;
          }
          .fvp-volume-slider {
            width: 0; overflow: hidden; transition: width .2s;
          }
          .fvp-volume-wrap:hover .fvp-volume-slider { width: 70px; }
          .fvp-volume-slider input[type="range"] {
            width: 70px; height: 4px; -webkit-appearance: none;
            background: rgba(255,255,255,.3); border-radius: 2px; outline: none;
          }
          .fvp-volume-slider input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none; width: 12px; height: 12px;
            border-radius: 50%; background: #fff; cursor: pointer;
          }
          /* 空状态 */
          .fvp-empty {
            text-align: center; padding: 60px 20px;
            color: var(--fvp-text-dim);
          }
          .fvp-empty-icon { font-size: 48px; margin-bottom: 12px; }
        </style>

        <div class="fvp-tabs" id="fvp-tabs"></div>
        <div class="fvp-search-wrap">
          <input class="fvp-search" id="fvp-search" type="text" placeholder="🔍 搜索视频..." />
        </div>
        <div class="fvp-grid" id="fvp-grid"></div>
        <div class="fvp-modal" id="fvp-modal">
          <div class="fvp-modal-inner" id="fvp-modal-inner">
            <button class="fvp-modal-close" id="fvp-modal-close">✕</button>
            <video class="fvp-modal-video" id="fvp-modal-video" playsinline preload="metadata"></video>
            <div class="fvp-controls" id="fvp-controls">
              <button class="fvp-ctrl-btn" id="fvp-ctrl-play" title="播放/暂停">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <div class="fvp-progress-wrap" id="fvp-progress-wrap">
                <div class="fvp-progress-bar" id="fvp-progress-bar"></div>
              </div>
              <span class="fvp-time" id="fvp-time">0:00 / 0:00</span>
              <div class="fvp-volume-wrap">
                <button class="fvp-ctrl-btn" id="fvp-ctrl-mute" title="静音">
                  <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                </button>
                <div class="fvp-volume-slider">
                  <input type="range" id="fvp-volume" min="0" max="1" step="0.05" value="0.7" />
                </div>
              </div>
              <button class="fvp-ctrl-btn" id="fvp-ctrl-fullscreen" title="全屏">
                <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;

      // 渲染分类标签
      const tabsEl = this.el.querySelector('#fvp-tabs');
      CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'fvp-tab' + (cat.id === this.currentCat ? ' active' : '');
        btn.textContent = cat.label;
        btn.dataset.cat = cat.id;
        btn.onclick = () => this.loadCategory(cat.id);
        tabsEl.appendChild(btn);
      });

      // 搜索
      const searchEl = this.el.querySelector('#fvp-search');
      searchEl.addEventListener('input', () => {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => this.searchVideos(searchEl.value), 400);
      });

      // 模态框事件
      this.modal = this.el.querySelector('#fvp-modal');
      this.videoEl = this.el.querySelector('#fvp-modal-video');

      this.el.querySelector('#fvp-modal-close').onclick = () => this.closeModal();
      this.modal.onclick = (e) => { if (e.target === this.modal) this.closeModal(); };

      // 控制条
      this.el.querySelector('#fvp-ctrl-play').onclick = () => this.togglePlay();
      this.videoEl.onclick = () => this.togglePlay();

      const progressWrap = this.el.querySelector('#fvp-progress-wrap');
      progressWrap.onclick = (e) => {
        const rect = progressWrap.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        this.videoEl.currentTime = ratio * (this.videoEl.duration || 0);
      };

      this.videoEl.ontimeupdate = () => this.updateProgress();
      this.videoEl.onloadedmetadata = () => this.updateProgress();
      this.videoEl.onended = () => {
        this.playing = false;
        this.updatePlayBtn();
      };

      this.el.querySelector('#fvp-ctrl-mute').onclick = () => {
        this.videoEl.muted = !this.videoEl.muted;
      };

      const volSlider = this.el.querySelector('#fvp-volume');
      volSlider.oninput = () => { this.videoEl.volume = parseFloat(volSlider.value); };

      this.el.querySelector('#fvp-ctrl-fullscreen').onclick = () => {
        const inner = this.el.querySelector('#fvp-modal-inner');
        if (document.fullscreenElement) document.exitFullscreen();
        else inner.requestFullscreen?.();
      };
    }

    highlightTab(catId) {
      this.el.querySelectorAll('.fvp-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.cat === catId);
      });
    }

    showSkeleton() {
      const grid = this.el.querySelector('#fvp-grid');
      grid.innerHTML = Array(6).fill(0).map(() => '<div class="fvp-skeleton"></div>').join('');
    }

    renderGrid() {
      const grid = this.el.querySelector('#fvp-grid');
      if (!this.videos.length) {
        grid.innerHTML = `
          <div class="fvp-empty" style="grid-column:1/-1">
            <div class="fvp-empty-icon">🎬</div>
            <div>没有找到视频，换个关键词试试？</div>
          </div>`;
        return;
      }
      grid.innerHTML = this.videos.map((v, i) => `
        <div class="fvp-card" data-idx="${i}">
          <img class="fvp-card-img" src="${this.escape(v.thumbnail)}" alt="${this.escape(v.title)}" loading="lazy" />
          <div class="fvp-card-play">
            <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
          <div class="fvp-card-duration">${this.fmtTime(v.duration)}</div>
          <div class="fvp-card-overlay">
            <div class="fvp-card-title">${this.escape(v.title)}</div>
            <div class="fvp-card-meta">by ${this.escape(v.author)}</div>
          </div>
        </div>
      `).join('');

      grid.querySelectorAll('.fvp-card').forEach(card => {
        card.onclick = () => this.openVideo(parseInt(card.dataset.idx));
      });
    }

    // ===== 播放器 =====
    openVideo(idx) {
      const v = this.videos[idx];
      if (!v || !v.videoUrl) return;
      this.currentVideo = v;
      this.videoEl.src = v.videoUrl;
      this.videoEl.load();
      this.modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        this.videoEl.play().then(() => {
          this.playing = true;
          this.updatePlayBtn();
        }).catch(() => {});
      }, 200);
    }

    closeModal() {
      this.videoEl.pause();
      this.videoEl.src = '';
      this.playing = false;
      this.modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    togglePlay() {
      if (this.videoEl.paused) {
        this.videoEl.play();
        this.playing = true;
      } else {
        this.videoEl.pause();
        this.playing = false;
      }
      this.updatePlayBtn();
    }

    updatePlayBtn() {
      const btn = this.el.querySelector('#fvp-ctrl-play');
      btn.innerHTML = this.playing
        ? '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    }

    updateProgress() {
      const cur = this.videoEl.currentTime || 0;
      const dur = this.videoEl.duration || 0;
      const pct = dur ? (cur / dur * 100) : 0;
      this.el.querySelector('#fvp-progress-bar').style.width = pct + '%';
      this.el.querySelector('#fvp-time').textContent =
        this.fmtTime(cur) + ' / ' + this.fmtTime(dur);
    }

    // ===== 工具 =====
    fmtTime(s) {
      s = Math.floor(s || 0);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      return m + ':' + String(sec).padStart(2, '0');
    }

    escape(str) {
      const d = document.createElement('div');
      d.textContent = str || '';
      return d.innerHTML;
    }

    // ===== 键盘 =====
    bindKeys() {
      document.addEventListener('keydown', (e) => {
        if (!this.modal.classList.contains('open')) return;
        if (e.code === 'Escape') { this.closeModal(); }
        else if (e.code === 'Space') { e.preventDefault(); this.togglePlay(); }
        else if (e.code === 'ArrowRight') { this.videoEl.currentTime += 5; }
        else if (e.code === 'ArrowLeft') { this.videoEl.currentTime -= 5; }
        else if (e.code === 'KeyM') { this.videoEl.muted = !this.videoEl.muted; }
        else if (e.code === 'KeyF') {
          const inner = this.el.querySelector('#fvp-modal-inner');
          if (document.fullscreenElement) document.exitFullscreen();
          else inner.requestFullscreen?.();
        }
      });
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishVideoPlayer());
  } else {
    new FishVideoPlayer();
  }
})();
