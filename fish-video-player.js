/**
 * 小鱼儿视频播放器 🐟🎬
 * Pexels 免费高清视频 + 分类浏览 + 全屏播放 + 搜索
 * 用法：<div id="fish-video-player"></div><script src="/fish-video-player.js"></script>
 */
(function () {
  'use strict';

  const API = 'https://api.pexels.com/videos/search';
  const KEY = 'DqKEbBsmBik7vOSGk4HDJxsfKqK8aXvUJrXw0Sg25e0ZvJSn9c90YpcE';

  const CATS = [
    { id: 'nature',    q: 'nature forest mountain landscape',        icon: '🌿', name: '自然' },
    { id: 'ocean',     q: 'ocean sea waves underwater beach',        icon: '🌊', name: '海洋' },
    { id: 'city',      q: 'city urban skyline night traffic',        icon: '🌆', name: '城市' },
    { id: 'cinematic', q: 'cinematic aerial drone timelapse',        icon: '🎬', name: '航拍' },
    { id: 'animals',   q: 'animals wildlife cute pet dog cat bird',  icon: '🐾', name: '动物' },
    { id: 'space',     q: 'space stars galaxy night sky aurora',     icon: '🚀', name: '宇宙' },
    { id: 'rain',      q: 'rain water drops splash puddle',          icon: '🌧️', name: '雨景' },
    { id: 'fire',      q: 'fire flame campfire candle',              icon: '🔥', name: '火焰' },
    { id: 'food',      q: 'food cooking coffee cake pizza sushi',    icon: '🍕', name: '美食' },
    { id: 'sport',     q: 'sport fitness running yoga gym',          icon: '⚽', name: '运动' },
    { id: 'travel',    q: 'travel road journey adventure',           icon: '✈️', name: '旅行' },
    { id: 'abstract',  q: 'abstract light neon glow particles',      icon: '🔬', name: '抽象' },
    { id: 'flowers',   q: 'flowers garden bloom rose cherry blossom',icon: '🌸', name: '花卉' },
    { id: 'snow',      q: 'snow winter ice frost mountain',          icon: '❄️', name: '雪景' },
    { id: 'sunset',    q: 'sunset sunrise golden hour sky clouds',   icon: '🌅', name: '日落' },
    { id: 'night',     q: 'night city lights neon dark moody',       icon: '🌃', name: '夜景' },
  ];

  class FishVideoPlayer {
    constructor() {
      this.el = document.getElementById('fish-video-player');
      if (!this.el) return;
      this.videos = [];
      this.cat = 'nature';
      this.currentVideo = null;
      this.render();
      this.loadCat('nature');
    }

    async loadCat(catId) {
      this.cat = catId;
      const cat = CATS.find(c => c.id === catId);
      if (!cat) return;
      this.highlight(catId);
      this.showSkeleton();
      try {
        const res = await fetch(`${API}?query=${encodeURIComponent(cat.q)}&per_page=24`, {
          headers: { Authorization: KEY }
        });
        const data = await res.json();
        this.videos = (data.videos || []).map(v => this.map(v));
        if (!this.videos.length) this.videos = this.fallback();
      } catch { this.videos = this.fallback(); }
      this.renderGrid();
    }

    async search(q) {
      if (!q.trim()) { this.loadCat(this.cat); return; }
      this.showSkeleton();
      try {
        const res = await fetch(`${API}?query=${encodeURIComponent(q)}&per_page=24`, {
          headers: { Authorization: KEY }
        });
        const data = await res.json();
        this.videos = (data.videos || []).map(v => this.map(v));
        if (!this.videos.length) this.showEmpty();
        else this.renderGrid();
      } catch { this.showEmpty(); }
    }

    map(v) {
      const files = v.video_files || [];
      const hd = files.find(f => f.width === 1280) || files.find(f => f.width === 720) || files.find(f => f.width === 640) || files[0] || {};
      return {
        id: v.id,
        title: this.genTitle(v),
        thumb: v.image || v.video_pictures?.[0]?.picture || '',
        url: hd.link || '',
        duration: v.duration || 0,
        author: v.user?.name || 'Pexels',
        w: hd.width || 640,
        h: hd.height || 360,
      };
    }

    genTitle(v) {
      const url = v.url || '';
      const slug = url.split('/').pop()?.replace(/-/g, ' ').replace(/\d+$/, '').trim();
      return slug && slug.length > 3 ? slug.charAt(0).toUpperCase() + slug.slice(1) : `Video ${v.id}`;
    }

    fallback() {
      return [
        { id: 'f1', title: '森林树冠', thumb: 'https://images.pexels.com/videos/31019280/pictures/preview-0.jpg', url: 'https://videos.pexels.com/video-files/31019280/13258714_720_1280_60fps.mp4', duration: 10, author: 'Pexels', w: 720, h: 1280 },
        { id: 'f2', title: '溪流石头', thumb: 'https://images.pexels.com/videos/10691963/pictures/preview-0.jpeg', url: 'https://videos.pexels.com/video-files/10691963/10691963-hd_1280_720_30fps.mp4', duration: 9, author: 'Pexels', w: 1280, h: 720 },
      ];
    }

    playVideo(v) {
      this.currentVideo = v;
      const modal = this.el.querySelector('.vp-modal');
      const video = this.el.querySelector('.vp-video');
      const title = this.el.querySelector('.vp-title');
      const meta = this.el.querySelector('.vp-meta');
      title.textContent = v.title;
      meta.textContent = `${v.author} · ${v.duration}s · ${v.w}×${v.h}`;
      video.src = v.url;
      video.play().catch(() => {});
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    closeModal() {
      const modal = this.el.querySelector('.vp-modal');
      const video = this.el.querySelector('.vp-video');
      video.pause(); video.src = '';
      modal.classList.remove('show');
      document.body.style.overflow = '';
      this.currentVideo = null;
    }

    showSkeleton() {
      const grid = this.el.querySelector('.vp-grid');
      grid.innerHTML = Array.from({ length: 8 }, () =>
        `<div class="vp-card"><div class="vp-skimg"></div><div class="vp-skline"></div></div>`
      ).join('');
    }

    showEmpty() {
      const grid = this.el.querySelector('.vp-grid');
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:#666">😢 没有找到视频，换个关键词试试</div>';
    }

    highlight(id) {
      this.el.querySelectorAll('.vp-chip').forEach(c => c.classList.toggle('active', c.dataset.cat === id));
    }

    fmtDur(s) { return `${s / 60 | 0}:${(s % 60 | 0).toString().padStart(2, '0')}`; }

    renderGrid() {
      const grid = this.el.querySelector('.vp-grid');
      grid.innerHTML = this.videos.map(v => `
        <div class="vp-card" data-id="${v.id}">
          <div class="vp-thumb" style="background-image:url(${v.thumb})">
            <div class="vp-overlay">
              <span class="vp-play">▶</span>
              <span class="vp-dur">${this.fmtDur(v.duration)}</span>
            </div>
          </div>
          <div class="vp-card-title">${v.title}</div>
          <div class="vp-card-author">${v.author}</div>
        </div>
      `).join('');
      grid.querySelectorAll('.vp-card').forEach(el => {
        el.onclick = () => {
          const vid = this.videos.find(v => v.id == el.dataset.id);
          if (vid) this.playVideo(vid);
        };
      });
    }

    render() {
      this.el.innerHTML = `
      <style>
        .vp-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:20px;font-family:'LXGW WenKai',-apple-system,sans-serif;max-width:480px;margin:0 auto;width:100%}
        .vp-header{display:flex;align-items:center;gap:8px;margin-bottom:16px}
        .vp-header h2{font-size:1rem;font-weight:700;margin:0}
        .vp-header .badge{font-size:.6rem;background:rgba(255,107,157,.15);color:#ff6b9d;padding:2px 8px;border-radius:6px}
        .vp-search{display:flex;gap:8px;margin-bottom:12px}
        .vp-search input{flex:1;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e8e8e8;font-size:.8rem;font-family:inherit;outline:none}
        .vp-search input:focus{border-color:#646cff}
        .vp-search button{background:#646cff;border:none;border-radius:8px;padding:8px 14px;color:#fff;cursor:pointer;font-size:.8rem}
        .vp-cats{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch}
        .vp-cats::-webkit-scrollbar{display:none}
        .vp-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:4px 10px;font-size:.7rem;color:#aaa;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s}
        .vp-chip:hover,.vp-chip.active{background:rgba(100,108,255,.15);border-color:#646cff;color:#646cff}
        .vp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
        .vp-card{border-radius:10px;overflow:hidden;cursor:pointer;transition:transform .2s}
        .vp-card:hover{transform:translateY(-2px)}
        .vp-thumb{position:relative;aspect-ratio:16/9;background-size:cover;background-position:center;background-color:#1a1a2e}
        .vp-overlay{position:absolute;inset:0;background:rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
        .vp-card:hover .vp-overlay{opacity:1}
        .vp-play{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#111}
        .vp-dur{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.7);padding:2px 6px;border-radius:4px;font-size:.6rem;color:#ddd}
        .vp-card-title{font-size:.75rem;font-weight:600;padding:6px 6px 0;color:var(--text,#e8e8e8);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .vp-card-author{font-size:.6rem;color:#666;padding:2px 6px 8px}
        .vp-skimg{aspect-ratio:16/9;background:#1a1a2e;border-radius:10px;animation:shimmer 1.5s infinite}
        .vp-skline{height:14px;background:#1a1a2e;border-radius:4px;margin:8px 6px;animation:shimmer 1.5s infinite}
        @keyframes shimmer{0%{opacity:.5}50%{opacity:1}100%{opacity:.5}}
        .vp-modal{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.95);display:none;flex-direction:column;align-items:center;justify-content:center}
        .vp-modal.show{display:flex}
        .vp-close{position:absolute;top:16px;right:16px;background:rgba(255,255,255,.1);border:none;color:#fff;width:36px;height:36px;border-radius:50%;font-size:1.2rem;cursor:pointer;z-index:301}
        .vp-close:hover{background:rgba(255,255,255,.2)}
        .vp-video{max-width:95vw;max-height:80vh;border-radius:12px;background:#000}
        .vp-info{text-align:center;margin-top:12px}
        .vp-title{font-size:.9rem;color:#e8e8e8;font-weight:600}
        .vp-meta{font-size:.7rem;color:#888;margin-top:4px}
        .vp-hint{font-size:.6rem;color:#555;margin-top:8px}
        @media(max-width:480px){.vp-wrap{padding:16px !important;border-radius:12px !important}.vp-grid{grid-template-columns:repeat(2,1fr)}.vp-wrap *{max-width:100% !important;box-sizing:border-box}}
      </style>
      <div class="vp-wrap">
        <div class="vp-header">
          <h2>🎬 视频库</h2>
          <span class="badge">Pexels · 免费高清</span>
        </div>
        <div class="vp-search">
          <input placeholder="搜索视频..." onkeydown="if(event.key==='Enter')this.closest('.vp-wrap').__vp.search(this.value)">
          <button onclick="this.closest('.vp-wrap').__vp.search(this.previousElementSibling.value)">🔍</button>
        </div>
        <div class="vp-cats">
          ${CATS.map(c => `<span class="vp-chip${c.id === 'nature' ? ' active' : ''}" data-cat="${c.id}" onclick="this.closest('.vp-wrap').__vp.loadCat('${c.id}')">${c.icon} ${c.name}</span>`).join('')}
        </div>
        <div class="vp-grid"></div>
      </div>
      <div class="vp-modal">
        <button class="vp-close" onclick="this.closest('.vp-wrap').__vp.closeModal()">✕</button>
        <video class="vp-video" controls playsinline></video>
        <div class="vp-info">
          <div class="vp-title"></div>
          <div class="vp-meta"></div>
          <div class="vp-hint">空格暂停 · 方向键快进 · F全屏 · Esc关闭</div>
        </div>
      </div>`;

      this.el.querySelector('.vp-wrap').__vp = this;

      // Keyboard shortcuts for modal
      document.addEventListener('keydown', (e) => {
        const modal = this.el?.querySelector('.vp-modal');
        if (!modal?.classList.contains('show')) return;
        const video = this.el.querySelector('.vp-video');
        if (e.key === 'Escape') this.closeModal();
        else if (e.key === ' ') { e.preventDefault(); video.paused ? video.play() : video.pause(); }
        else if (e.key === 'ArrowRight') video.currentTime += 5;
        else if (e.key === 'ArrowLeft') video.currentTime -= 5;
        else if (e.key === 'f' || e.key === 'F') {
          if (document.fullscreenElement) document.exitFullscreen();
          else video.requestFullscreen?.();
        }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishVideoPlayer());
  else new FishVideoPlayer();
})();
