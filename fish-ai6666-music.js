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
      this.tab = 'hall';
      this.myMusic = JSON.parse(localStorage.getItem('fish_6666_mine') || '[]');
      this.volume = 0.7;
      this._shuffle = false;
      this._repeat = 'off';
      this.audio.volume = this.volume;
      this.audio.ontimeupdate = () => this.tick();
      this.audio.onended = () => this.next();
      this.audio.onerror = () => { this.playing = false; this.syncPlayBtn(); };
      this.init();
    }

    async init() {
      this.render();
      await this.load();
    }

    async load() {
      const list = this.el.querySelector('.f6m-list');
      if (!list) return;
      list.innerHTML = '<div class="f6m-loading"><div class="f6m-spinner"></div>正在加载音乐…</div>';
      try {
        const r = await fetch('/api/ai6666-music');
        const d = await r.json();
        this.songs = (d.songs || []).filter(s => s.mp3);
      } catch { this.songs = []; }
      this.renderList();
    }

    render() {
      this.el.innerHTML = `
      <div class="f6m-wrap">
        <div class="f6m-topbar">
          <div class="f6m-tabs">
            <button class="f6m-tab f6m-tab-active" data-tab="hall">🔥 热门推荐</button>
            <button class="f6m-tab" data-tab="mine">🎤 我的创作</button>
          </div>
          <span class="f6m-badge">AI 生成 · 来自 ai6666.com</span>
        </div>
        <div class="f6m-body">
          <div class="f6m-player">
            <div class="f6m-cover-box">
              <div class="f6m-cover" id="f6m-cover">🎵</div>
              <div class="f6m-viz"><span></span><span></span><span></span><span></span><span></span></div>
            </div>
            <div class="f6m-meta">
              <div class="f6m-song-title" id="f6m-title">选择一首歌开始播放</div>
              <div class="f6m-song-artist" id="f6m-artist"></div>
              <div class="f6m-tags" id="f6m-tags"></div>
            </div>
            <div class="f6m-progress" id="f6m-progress">
              <div class="f6m-progress-fill"></div>
              <div class="f6m-progress-knob"></div>
            </div>
            <div class="f6m-time">
              <span id="f6m-cur">0:00</span>
              <span id="f6m-total">0:00</span>
            </div>
            <div class="f6m-ctrls">
              <button class="f6m-btn f6m-btn-sm" id="f6m-shuf" title="随机">🔀</button>
              <button class="f6m-btn" id="f6m-prev" title="上一首">⏮</button>
              <button class="f6m-btn f6m-btn-play" id="f6m-play" title="播放">▶</button>
              <button class="f6m-btn" id="f6m-next" title="下一首">⏭</button>
              <button class="f6m-btn f6m-btn-sm" id="f6m-rep" title="循环">🔁</button>
            </div>
            <div class="f6m-vol">
              <span class="f6m-vol-icon">🔊</span>
              <input type="range" class="f6m-vol-bar" min="0" max="1" step="0.05" value="0.7" id="f6m-vol">
            </div>
          </div>
          <div class="f6m-list" id="f6m-list"></div>
        </div>
      </div>`;
      this.bind();
    }

    bind() {
      const $ = s => this.el.querySelector(s);
      $('#f6m-play').onclick = () => this.toggle();
      $('#f6m-prev').onclick = () => this.prev();
      $('#f6m-next').onclick = () => this.next();
      $('#f6m-shuf').onclick = () => { this._shuffle = !this._shuffle; $('#f6m-shuf').classList.toggle('f6m-btn-on', this._shuffle); };
      $('#f6m-rep').onclick = () => {
        const m = ['off','all','one'], ic = ['🔁','🔁','🔂'];
        const i = (m.indexOf(this._repeat)+1)%3;
        this._repeat = m[i];
        const b = $('#f6m-rep'); b.textContent = ic[i]; b.classList.toggle('f6m-btn-on', i>0);
      };
      $('#f6m-vol').oninput = e => { this.volume = +e.target.value; this.audio.volume = this.volume; };
      $('#f6m-progress').onclick = e => { if(this.audio.duration) this.audio.currentTime = (e.offsetX/e.currentTarget.offsetWidth)*this.audio.duration; };
      this.el.querySelectorAll('.f6m-tab').forEach(b => b.onclick = () => {
        this.tab = b.dataset.tab;
        this.el.querySelectorAll('.f6m-tab').forEach(x => x.classList.remove('f6m-tab-active'));
        b.classList.add('f6m-tab-active');
        this.renderList();
      });
    }

    renderList() {
      const el = this.el.querySelector('#f6m-list');
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      if (!songs.length) { el.innerHTML = `<div class="f6m-empty">${this.tab==='mine'?'🎤 还没有创作，去碳基圈生成一首吧！':'暂无数据'}</div>`; return; }
      el.innerHTML = songs.map((s, i) => `
        <div class="f6m-item${i===this.idx&&this.playing?' f6m-item-on':''}" data-i="${i}">
          <img class="f6m-item-img" src="${s.cover||''}" alt="" onerror="this.style.display='none'">
          <div class="f6m-item-body">
            <div class="f6m-item-name">${this.esc(s.title)}</div>
            <div class="f6m-item-sub">
              ${s.artist?`<a href="${s.profileUrl||'#'}" target="_blank" rel="noopener">${this.esc(s.artist)}</a>`:''}
              ${s.duration?`<span>${this.fmt(s.duration)}</span>`:''}
              ${s.rating?`<span>⭐${s.rating}</span>`:''}
            </div>
          </div>
          <button class="f6m-item-act" title="播放">▶</button>
        </div>`).join('');
      el.querySelectorAll('.f6m-item').forEach(x => x.onclick = e => { if(e.target.closest('a'))return; this.play(+x.dataset.i); });
    }

    play(i) {
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      if (!songs.length) return;
      this.idx = i;
      const s = songs[i];
      this.audio.src = s.mp3;
      this.audio.play().catch(()=>{});
      this.playing = true;
      this.ui(s);
      this.renderList();
    }

    toggle() {
      if (!this.audio.src) { this.play(0); return; }
      if (this.playing) { this.audio.pause(); this.playing = false; } else { this.audio.play().catch(()=>{}); this.playing = true; }
      this.syncPlayBtn(); this.renderList();
    }

    prev() { const s = this.tab==='mine'?this.myMusic:this.songs; if(s.length) this.play((this.idx-1+s.length)%s.length); }
    next() {
      const s = this.tab==='mine'?this.myMusic:this.songs; if(!s.length) return;
      if (this._repeat==='one') { this.play(this.idx); return; }
      this.play(this._shuffle ? Math.floor(Math.random()*s.length) : (this.idx+1)%s.length);
    }

    tick() {
      const c = this.audio.currentTime||0, d = this.audio.duration||0, p = d?c/d*100:0;
      const f = this.el.querySelector('.f6m-progress-fill'), k = this.el.querySelector('.f6m-progress-knob');
      if(f) f.style.width = p+'%'; if(k) k.style.left = p+'%';
      const ce = this.el.querySelector('#f6m-cur'), te = this.el.querySelector('#f6m-total');
      if(ce) ce.textContent = this.fmt(c); if(te) te.textContent = this.fmt(d);
    }

    ui(s) {
      const $ = id => this.el.querySelector(id);
      $('#f6m-title').textContent = s.title||'未知曲目';
      $('#f6m-artist').innerHTML = s.artist?`🎤 <a href="${s.profileUrl||'#'}" target="_blank" rel="noopener" style="color:#a78bfa;text-decoration:none">${this.esc(s.artist)}</a>`:'';
      const tg = $('#f6m-tags');
      if(s.tags){tg.textContent=s.tags;tg.style.display='';}else{tg.style.display='none';}
      const cv = $('#f6m-cover');
      if(s.cover){cv.style.backgroundImage=`url(${s.cover})`;cv.textContent='';}else{cv.style.backgroundImage='';cv.textContent='🎵';}
      this.syncPlayBtn();
    }

    syncPlayBtn() {
      const b = this.el.querySelector('#f6m-play');
      if(b) b.textContent = this.playing ? '⏸' : '▶';
      const v = this.el.querySelector('.f6m-viz');
      if(v) v.classList.toggle('f6m-viz-active', this.playing);
    }

    fmt(s) { s=Math.round(s); return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
    esc(t) { const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishAi6666Music());
  else new FishAi6666Music();
})();
