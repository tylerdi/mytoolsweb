/**
 * 🐟 碳基圈音乐广场 — fish-ai6666-music.js
 * 嵌入 ai6666.com 公开音乐，带「我的创作」tab
 */
(function () {
  'use strict';

  class FishAi6666Music {
    constructor() {
      this.el = document.getElementById('fish-ai6666-music');
      if (!this.el) return;
      this.audio = new Audio();
      this.songs = [];
      this.idx = 0;
      this.playing = false;
      this.tab = 'hall'; // hall | mine
      this.myMusic = JSON.parse(localStorage.getItem('fish_6666_mine') || '[]');
      this.favs = JSON.parse(localStorage.getItem('fish_6666_fav') || '[]');
      this.volume = 0.7;
      this.audio.volume = this.volume;
      this.audio.ontimeupdate = () => this.updateProgress();
      this.audio.onended = () => this.next();
      this.audio.onerror = () => { this.playing = false; this.updatePlayBtn(); };
      this.init();
    }

    async init() {
      this.render();
      await this.loadSongs();
    }

    async loadSongs() {
      const listEl = this.el.querySelector('.f6m-list');
      if (!listEl) return;
      listEl.innerHTML = '<div class="f6m-loading"><div class="f6m-spinner"></div>加载中…</div>';
      try {
        const r = await fetch('/api/ai6666-music');
        const data = await r.json();
        this.songs = (data.songs || []).filter(s => s.mp3);
      } catch {
        this.songs = [];
      }
      this.renderList();
    }

    render() {
      this.el.innerHTML = `
        <div class="f6m-container">
          <div class="f6m-header">
            <div class="f6m-title-row">
              <span class="f6m-logo">🎵</span>
              <h2 class="f6m-title">碳基圈音乐广场</h2>
              <span class="f6m-sub">来自 ai6666.com</span>
            </div>
            <div class="f6m-tabs">
              <button class="f6m-tab f6m-tab-active" data-tab="hall">🔥 热门</button>
              <button class="f6m-tab" data-tab="mine">🎤 我的创作</button>
            </div>
          </div>
          <div class="f6m-body">
            <div class="f6m-player-area">
              <div class="f6m-cover-wrap">
                <div class="f6m-cover" id="f6m-cover"></div>
                <div class="f6m-viz"><span></span><span></span><span></span><span></span><span></span></div>
              </div>
              <div class="f6m-info">
                <div class="f6m-song-title" id="f6m-title">选择一首歌开始播放</div>
                <div class="f6m-song-artist" id="f6m-artist"></div>
                <div class="f6m-tags" id="f6m-tags"></div>
              </div>
              <div class="f6m-progress-bar" id="f6m-progress">
                <div class="f6m-progress-fill"></div>
                <div class="f6m-progress-knob"></div>
              </div>
              <div class="f6m-time">
                <span id="f6m-cur">0:00</span>
                <span id="f6m-total">0:00</span>
              </div>
              <div class="f6m-controls">
                <button class="f6m-btn f6m-btn-sm" id="f6m-shuffle" title="随机">🔀</button>
                <button class="f6m-btn" id="f6m-prev" title="上一首">⏮</button>
                <button class="f6m-btn f6m-btn-play" id="f6m-play" title="播放">▶</button>
                <button class="f6m-btn" id="f6m-next" title="下一首">⏭</button>
                <button class="f6m-btn f6m-btn-sm" id="f6m-repeat" title="循环">🔁</button>
              </div>
              <div class="f6m-volume-row">
                <span>🔊</span>
                <input type="range" class="f6m-volume" min="0" max="1" step="0.05" value="0.7" id="f6m-volume">
              </div>
            </div>
            <div class="f6m-list" id="f6m-list"></div>
          </div>
        </div>`;
      this.bindEvents();
    }

    bindEvents() {
      const $ = s => this.el.querySelector(s);
      $('#f6m-play').onclick = () => this.toggle();
      $('#f6m-prev').onclick = () => this.prev();
      $('#f6m-next').onclick = () => this.next();
      $('#f6m-shuffle').onclick = () => this.toggleShuffle();
      $('#f6m-repeat').onclick = () => this.toggleRepeat();
      $('#f6m-volume').oninput = e => { this.volume = +e.target.value; this.audio.volume = this.volume; };
      $('#f6m-progress').onclick = e => this.seek(e);
      this.el.querySelectorAll('.f6m-tab').forEach(btn => {
        btn.onclick = () => {
          this.tab = btn.dataset.tab;
          this.el.querySelectorAll('.f6m-tab').forEach(b => b.classList.remove('f6m-tab-active'));
          btn.classList.add('f6m-tab-active');
          this.renderList();
        };
      });
    }

    renderList() {
      const listEl = this.el.querySelector('#f6m-list');
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      if (!songs.length) {
        listEl.innerHTML = `<div class="f6m-empty">${this.tab === 'mine' ? '🎤 还没有创作，去碳基圈生成一首吧！' : '暂无数据'}</div>`;
        return;
      }
      listEl.innerHTML = songs.map((s, i) => `
        <div class="f6m-item${i === this.idx && this.playing ? ' f6m-item-active' : ''}" data-idx="${i}">
          <img class="f6m-item-cover" src="${s.cover || ''}" alt="" onerror="this.style.display='none'">
          <div class="f6m-item-info">
            <div class="f6m-item-title">${this.esc(s.title)}</div>
            <div class="f6m-item-meta">
              ${s.artist ? `<a class="f6m-item-artist" href="${s.profileUrl || '#'}" target="_blank" rel="noopener">${this.esc(s.artist)}</a>` : ''}
              ${s.duration ? `<span>${this.fmtTime(s.duration)}</span>` : ''}
              ${s.rating ? `<span>⭐${s.rating}</span>` : ''}
            </div>
          </div>
          <button class="f6m-item-play" title="播放">▶</button>
        </div>`).join('');
      listEl.querySelectorAll('.f6m-item').forEach(el => {
        el.onclick = e => {
          if (e.target.closest('a')) return;
          const i = +el.dataset.idx;
          this.play(i);
        };
      });
    }

    play(i) {
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      if (!songs.length) return;
      this.idx = i;
      const s = songs[i];
      this.audio.src = s.mp3;
      this.audio.play().catch(() => {});
      this.playing = true;
      this.updateUI(s);
      this.renderList();
    }

    toggle() {
      if (!this.audio.src) { this.play(0); return; }
      if (this.playing) { this.audio.pause(); this.playing = false; }
      else { this.audio.play().catch(() => {}); this.playing = true; }
      this.updatePlayBtn();
      this.renderList();
    }

    prev() {
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      if (!songs.length) return;
      this.play((this.idx - 1 + songs.length) % songs.length);
    }

    next() {
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      if (!songs.length) return;
      if (this._repeat === 'one') { this.play(this.idx); return; }
      const next = this._shuffle ? Math.floor(Math.random() * songs.length) : (this.idx + 1) % songs.length;
      this.play(next);
    }

    toggleShuffle() { this._shuffle = !this._shuffle; this.el.querySelector('#f6m-shuffle').classList.toggle('f6m-btn-active', this._shuffle); }
    toggleRepeat() {
      const modes = ['off', 'all', 'one'];
      const icons = ['🔁', '🔁', '🔂'];
      const cur = modes.indexOf(this._repeat || 'off');
      this._repeat = modes[(cur + 1) % 3];
      const btn = this.el.querySelector('#f6m-repeat');
      btn.textContent = icons[(cur + 1) % 3];
      btn.classList.toggle('f6m-btn-active', this._repeat !== 'off');
    }

    seek(e) {
      const bar = e.currentTarget;
      const pct = e.offsetX / bar.offsetWidth;
      if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
    }

    updateProgress() {
      const cur = this.audio.currentTime || 0;
      const dur = this.audio.duration || 0;
      const pct = dur ? (cur / dur * 100) : 0;
      const fill = this.el.querySelector('.f6m-progress-fill');
      const knob = this.el.querySelector('.f6m-progress-knob');
      if (fill) fill.style.width = pct + '%';
      if (knob) knob.style.left = pct + '%';
      const curEl = this.el.querySelector('#f6m-cur');
      const totEl = this.el.querySelector('#f6m-total');
      if (curEl) curEl.textContent = this.fmtTime(cur);
      if (totEl) totEl.textContent = this.fmtTime(dur);
    }

    updateUI(s) {
      const $ = id => this.el.querySelector(id);
      $('#f6m-title').textContent = s.title || '未知曲目';
      $('#f6m-artist').textContent = s.artist ? `🎤 ${s.artist}` : '';
      const tagsEl = $('#f6m-tags');
      if (s.tags) { tagsEl.textContent = s.tags; tagsEl.style.display = ''; }
      else { tagsEl.style.display = 'none'; }
      const cover = $('#f6m-cover');
      if (s.cover) { cover.style.backgroundImage = `url(${s.cover})`; cover.textContent = ''; }
      else { cover.style.backgroundImage = ''; cover.textContent = '🎵'; }
      this.updatePlayBtn();
    }

    updatePlayBtn() {
      const btn = this.el.querySelector('#f6m-play');
      if (btn) btn.textContent = this.playing ? '⏸' : '▶';
      // 可视化动画
      const viz = this.el.querySelector('.f6m-viz');
      if (viz) viz.classList.toggle('f6m-viz-active', this.playing);
    }

    fmtTime(sec) {
      sec = Math.round(sec);
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }

    esc(str) {
      const d = document.createElement('div');
      d.textContent = str || '';
      return d.innerHTML;
    }
  }

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishAi6666Music());
  } else {
    new FishAi6666Music();
  }
})();
