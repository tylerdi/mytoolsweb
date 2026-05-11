/**
 * 🎵 网易云音乐模块 — fish-netease-music.js
 * 搜索 + 播放 + 歌词
 */
(function () {
  'use strict';

  class FishNeteaseMusic {
    constructor() {
      this.el = document.getElementById('fish-netease-music');
      if (!this.el) return;
      this.audio = new Audio();
      this.songs = [];
      this.currentSong = null;
      this.idx = 0;
      this.playing = false;
      this.volume = 0.7;
      this.searchQuery = '';
      this.loading = false;
      this.audio.volume = this.volume;
      this.audio.ontimeupdate = () => this.tick();
      this.audio.onended = () => this.next();
      this.audio.onerror = () => { this.playing = false; this.syncPlayBtn(); };
      this.init();
    }

    async init() {
      this.render();
      this.bindEvents();
      await this.search('热歌');
    }

    render() {
      this.el.innerHTML = `
      <style>
        .fnm-wrap{background:linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#16213e 100%);border-radius:20px;overflow:hidden;border:1px solid rgba(255,255,255,.06);box-shadow:0 8px 32px rgba(0,0,0,.3)}
        .fnm-header{padding:24px 28px 16px;display:flex;align-items:center;gap:16px}
        .fnm-logo{width:48px;height:48px;background:linear-gradient(135deg,#e74c3c,#c0392b);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
        .fnm-title-area h2{margin:0;font-size:20px;color:#fff;font-weight:700;letter-spacing:.5px}
        .fnm-title-area p{margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.5)}
        .fnm-search{padding:0 28px 20px;display:flex;gap:10px}
        .fnm-search input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;color:#fff;font-size:14px;outline:none;transition:all .2s}
        .fnm-search input:focus{border-color:rgba(231,76,60,.5);background:rgba(255,255,255,.08)}
        .fnm-search input::placeholder{color:rgba(255,255,255,.3)}
        .fnm-search button{background:linear-gradient(135deg,#e74c3c,#c0392b);border:none;border-radius:12px;padding:0 24px;color:#fff;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;white-space:nowrap}
        .fnm-search button:hover{transform:scale(1.02);box-shadow:0 4px 16px rgba(231,76,60,.3)}
        .fnm-search button:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .fnm-player{padding:0 28px 20px;display:none}
        .fnm-player.active{display:block}
        .fnm-now-playing{background:rgba(255,255,255,.04);border-radius:16px;padding:20px;display:flex;align-items:center;gap:16px}
        .fnm-cover{width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,#333,#555);overflow:hidden;flex-shrink:0;position:relative}
        .fnm-cover img{width:100%;height:100%;object-fit:cover}
        .fnm-cover .fnm-vinyl{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:24px;height:24px;background:rgba(0,0,0,.6);border-radius:50%;border:2px solid rgba(255,255,255,.2)}
        .fnm-info{flex:1;min-width:0}
        .fnm-info .fnm-song-name{font-size:16px;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .fnm-info .fnm-song-artist{font-size:13px;color:rgba(255,255,255,.5);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .fnm-controls{display:flex;align-items:center;gap:12px;margin-top:12px}
        .fnm-btn{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;font-size:18px;padding:8px;border-radius:50%;transition:all .2s;display:flex;align-items:center;justify-content:center}
        .fnm-btn:hover{color:#fff;background:rgba(255,255,255,.1)}
        .fnm-btn.fnm-play-btn{width:44px;height:44px;background:linear-gradient(135deg,#e74c3c,#c0392b);color:#fff;font-size:18px;border-radius:50%}
        .fnm-btn.fnm-play-btn:hover{transform:scale(1.05);box-shadow:0 4px 16px rgba(231,76,60,.4)}
        .fnm-progress{flex:1;display:flex;align-items:center;gap:8px}
        .fnm-progress-bar{flex:1;height:4px;background:rgba(255,255,255,.1);border-radius:2px;cursor:pointer;position:relative}
        .fnm-progress-fill{height:100%;background:linear-gradient(90deg,#e74c3c,#c0392b);border-radius:2px;width:0%;transition:width .1s}
        .fnm-time{font-size:11px;color:rgba(255,255,255,.4);font-variant-numeric:tabular-nums;white-space:nowrap}
        .fnm-list{padding:0 28px 28px}
        .fnm-list-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .fnm-list-header h3{margin:0;font-size:15px;color:rgba(255,255,255,.6);font-weight:500}
        .fnm-list-header span{font-size:12px;color:rgba(255,255,255,.3)}
        .fnm-song-item{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:12px;cursor:pointer;transition:all .2s;border:1px solid transparent}
        .fnm-song-item:hover{background:rgba(255,255,255,.04);border-color:rgba(255,255,255,.06)}
        .fnm-song-item.active{background:rgba(231,76,60,.08);border-color:rgba(231,76,60,.15)}
        .fnm-song-item .fnm-idx{width:28px;font-size:13px;color:rgba(255,255,255,.3);text-align:center;font-variant-numeric:tabular-nums}
        .fnm-song-item.active .fnm-idx{color:#e74c3c}
        .fnm-song-item .fnm-thumb{width:44px;height:44px;border-radius:8px;background:#222;overflow:hidden;flex-shrink:0}
        .fnm-song-item .fnm-thumb img{width:100%;height:100%;object-fit:cover}
        .fnm-song-item .fnm-meta{flex:1;min-width:0}
        .fnm-song-item .fnm-meta .fnm-name{font-size:14px;color:rgba(255,255,255,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .fnm-song-item.active .fnm-meta .fnm-name{color:#e74c3c}
        .fnm-song-item .fnm-meta .fnm-artist{font-size:12px;color:rgba(255,255,255,.35);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .fnm-song-item .fnm-dur{font-size:12px;color:rgba(255,255,255,.25);font-variant-numeric:tabular-nums}
        .fnm-loading{padding:60px 0;text-align:center;color:rgba(255,255,255,.4);font-size:14px}
        .fnm-spinner{width:32px;height:32px;border:3px solid rgba(255,255,255,.1);border-top-color:#e74c3c;border-radius:50%;animation:fnm-spin .8s linear infinite;margin:0 auto 12px}
        @keyframes fnm-spin{to{transform:rotate(360deg)}}
        .fnm-empty{padding:60px 0;text-align:center;color:rgba(255,255,255,.3);font-size:14px}
        .fnm-vol{display:flex;align-items:center;gap:6px;margin-left:auto}
        .fnm-vol input[type=range]{width:70px;height:4px;-webkit-appearance:none;background:rgba(255,255,255,.1);border-radius:2px;outline:none}
        .fnm-vol input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#e74c3c;border-radius:50%;cursor:pointer}
        .fnm-vip{font-size:10px;color:#f39c12;background:rgba(243,156,18,.15);padding:2px 6px;border-radius:4px;margin-left:6px;font-weight:600}
        @media(max-width:600px){
          .fnm-header{padding:20px 20px 12px}
          .fnm-search{padding:0 20px 16px}
          .fnm-player{padding:0 20px 16px}
          .fnm-list{padding:0 20px 24px}
          .fnm-now-playing{padding:16px}
          .fnm-cover{width:52px;height:52px}
        }
      </style>
      <div class="fnm-wrap">
        <div class="fnm-header">
          <div class="fnm-logo">🎵</div>
          <div class="fnm-title-area">
            <h2>网易云音乐</h2>
            <p>搜索 · 播放 · 免费听歌</p>
          </div>
        </div>
        <div class="fnm-search">
          <input type="text" placeholder="搜索歌曲、歌手、专辑…" />
          <button class="fnm-search-btn">搜索</button>
        </div>
        <div class="fnm-player">
          <div class="fnm-now-playing">
            <div class="fnm-cover"><div class="fnm-vinyl"></div></div>
            <div class="fnm-info">
              <div class="fnm-song-name">未在播放</div>
              <div class="fnm-song-artist">-</div>
              <div class="fnm-controls">
                <button class="fnm-btn fnm-prev-btn" title="上一首">⏮</button>
                <button class="fnm-btn fnm-play-btn" title="播放/暂停">▶</button>
                <button class="fnm-btn fnm-next-btn" title="下一首">⏭</button>
                <div class="fnm-progress">
                  <span class="fnm-time fnm-cur-time">0:00</span>
                  <div class="fnm-progress-bar"><div class="fnm-progress-fill"></div></div>
                  <span class="fnm-time fnm-total-time">0:00</span>
                </div>
                <div class="fnm-vol">
                  <span style="font-size:14px;cursor:pointer" class="fnm-vol-icon">🔊</span>
                  <input type="range" min="0" max="1" step="0.05" value="0.7" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="fnm-list">
          <div class="fnm-list-header">
            <h3 class="fnm-list-title">热歌推荐</h3>
            <span class="fnm-list-count"></span>
          </div>
          <div class="fnm-song-list"></div>
        </div>
      </div>`;
    }

    bindEvents() {
      const wrap = this.el.querySelector('.fnm-wrap');
      const input = wrap.querySelector('.fnm-search input');
      const searchBtn = wrap.querySelector('.fnm-search-btn');

      // 搜索
      searchBtn.onclick = () => {
        const q = input.value.trim();
        if (q) this.search(q);
      };
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const q = input.value.trim();
          if (q) this.search(q);
        }
      };

      // 播放控制
      wrap.querySelector('.fnm-play-btn').onclick = () => this.togglePlay();
      wrap.querySelector('.fnm-prev-btn').onclick = () => this.prev();
      wrap.querySelector('.fnm-next-btn').onclick = () => this.next();

      // 进度条
      wrap.querySelector('.fnm-progress-bar').onclick = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
      };

      // 音量
      const volSlider = wrap.querySelector('.fnm-vol input');
      volSlider.oninput = () => {
        this.volume = parseFloat(volSlider.value);
        this.audio.volume = this.volume;
      };
      wrap.querySelector('.fnm-vol-icon').onclick = () => {
        this.audio.muted = !this.audio.muted;
        wrap.querySelector('.fnm-vol-icon').textContent = this.audio.muted ? '🔇' : '🔊';
      };
    }

    async search(q) {
      this.searchQuery = q;
      const list = this.el.querySelector('.fnm-song-list');
      const title = this.el.querySelector('.fnm-list-title');
      title.textContent = q === '热歌' ? '热歌推荐' : `搜索：${q}`;
      list.innerHTML = '<div class="fnm-loading"><div class="fnm-spinner"></div>正在搜索…</div>';

      try {
        const r = await fetch(`/api/karpov-netease/search?q=${encodeURIComponent(q)}&page=1&page_size=20`);
        const d = await r.json();
        if (d.code === 200 && d.data?.items?.length) {
          this.songs = d.data.items;
          this.renderList();
        } else {
          list.innerHTML = '<div class="fnm-empty">没有找到相关歌曲</div>';
        }
      } catch (err) {
        list.innerHTML = `<div class="fnm-empty">搜索失败：${err.message}</div>`;
      }
    }

    renderList() {
      const list = this.el.querySelector('.fnm-song-list');
      const count = this.el.querySelector('.fnm-list-count');
      count.textContent = `${this.songs.length} 首`;

      if (!this.songs.length) {
        list.innerHTML = '<div class="fnm-empty">暂无歌曲</div>';
        return;
      }

      list.innerHTML = this.songs.map((s, i) => {
        const dur = this.fmtTime(s.durationSeconds || 0);
        const cover = s.album?.cover || '';
        const isActive = this.currentSong?.id === s.id;
        const vipTag = s.isVipOnly ? '<span class="fnm-vip">VIP</span>' : '';
        return `
        <div class="fnm-song-item${isActive ? ' active' : ''}" data-idx="${i}">
          <span class="fnm-idx">${isActive && this.playing ? '♪' : i + 1}</span>
          <div class="fnm-thumb">${cover ? `<img src="${cover}" alt="" loading="lazy">` : ''}</div>
          <div class="fnm-meta">
            <div class="fnm-name">${this.esc(s.title)}${vipTag}</div>
            <div class="fnm-artist">${this.esc(s.artist || s.artists?.map(a => a.name).join(' / ') || '')}</div>
          </div>
          <span class="fnm-dur">${dur}</span>
        </div>`;
      }).join('');

      // 绑定点击
      list.querySelectorAll('.fnm-song-item').forEach(el => {
        el.onclick = () => this.playAt(parseInt(el.dataset.idx));
      });
    }

    async playAt(idx) {
      if (idx < 0 || idx >= this.songs.length) return;
      this.idx = idx;
      this.currentSong = this.songs[idx];
      this.renderList();

      // 更新播放器信息
      const player = this.el.querySelector('.fnm-player');
      player.classList.add('active');
      const cover = this.currentSong.album?.cover || '';
      player.querySelector('.fnm-cover').innerHTML = cover
        ? `<img src="${cover}" alt="">`
        : '<div class="fnm-vinyl"></div>';
      player.querySelector('.fnm-song-name').textContent = this.currentSong.title;
      player.querySelector('.fnm-song-artist').textContent =
        this.currentSong.artist || this.currentSong.artists?.map(a => a.name).join(' / ') || '';

      // 获取播放链接（先试网易云，失败走 Audius）
      const songName = this.currentSong.title;
      const artistName = this.currentSong.artist || '';
      const searchQuery = `${songName} ${artistName}`.trim();

      try {
        // 先试网易云直接播放
        const r = await fetch(`/api/karpov-netease/song/${this.currentSong.id}/url?level=exhigh`);
        const d = await r.json();
        if (d.code === 200 && d.data?.audio?.url) {
          this.audio.src = d.data.audio.url;
          this.audio.play();
          this.playing = true;
          this.syncPlayBtn();
          return;
        }
      } catch (e) {
        console.warn('网易云播放失败，尝试 Audius:', e);
      }

      // fallback: 用 Audius 搜索播放
      try {
        const ar = await fetch(`/api/audius-search?q=${encodeURIComponent(searchQuery)}&limit=1`);
        const ad = await ar.json();
        if (ad.data?.length) {
          const track = ad.data[0];
          this.audio.src = `https://discoveryprovider.audius.co/v1/tracks/${track.id}/stream?app_name=fishplayer`;
          this.audio.play();
          this.playing = true;
          this.syncPlayBtn();
          return;
        }
      } catch (e) {
        console.warn('Audius 搜索也失败:', e);
      }

      // 都失败了
      this.showToast('⚠️ 该歌曲暂时无法播放');
    }

    togglePlay() {
      if (!this.audio.src) {
        if (this.songs.length) this.playAt(0);
        return;
      }
      if (this.playing) {
        this.audio.pause();
        this.playing = false;
      } else {
        this.audio.play();
        this.playing = true;
      }
      this.syncPlayBtn();
    }

    prev() {
      if (this.songs.length) this.playAt((this.idx - 1 + this.songs.length) % this.songs.length);
    }

    next() {
      if (this.songs.length) this.playAt((this.idx + 1) % this.songs.length);
    }

    syncPlayBtn() {
      const btn = this.el.querySelector('.fnm-play-btn');
      if (btn) btn.textContent = this.playing ? '⏸' : '▶';
      this.renderList();
    }

    tick() {
      const cur = this.el.querySelector('.fnm-cur-time');
      const total = this.el.querySelector('.fnm-total-time');
      const fill = this.el.querySelector('.fnm-progress-fill');
      if (cur) cur.textContent = this.fmtTime(this.audio.currentTime);
      if (total) total.textContent = this.fmtTime(this.audio.duration || 0);
      if (fill && this.audio.duration) {
        fill.style.width = `${(this.audio.currentTime / this.audio.duration) * 100}%`;
      }
    }

    fmtTime(sec) {
      if (!sec || !isFinite(sec)) return '0:00';
      const m = Math.floor(sec / 60);
      const s = Math.floor(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    esc(str) {
      const d = document.createElement('div');
      d.textContent = str || '';
      return d.innerHTML;
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishNeteaseMusic());
  } else {
    new FishNeteaseMusic();
  }
})();
