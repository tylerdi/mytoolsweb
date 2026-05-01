/**
 * 小鱼儿音乐播放器 🐟🎵 — 纯酷我源
 */
(function () {
  'use strict';

  class FishMusicPlayer {
    constructor() {
      this.el = document.getElementById('fish-music-player');
      if (!this.el) return;
      this.audio = new Audio();
      this.volume = 0.6;
      this.muted = false;
      this.shuffle = false;
      this.repeat = 'off';
      this.favs = JSON.parse(localStorage.getItem('fm_fav') || '[]');
      this.playlist = [];
      this.lyrics = [];
      this.lyricIdx = -1;
      this.idx = 0;
      this.playing = false;
      this.ctx = null;
      this.analyser = null;

      this.audio.volume = this.volume;
      this.audio.ontimeupdate = () => { this.updateProgress(); this.syncLyrics(); };
      this.audio.onended = () => this.handleEnded();
      this.audio.onerror = () => { console.warn('播放失败，跳下一首'); setTimeout(() => this.next(), 500); };
      this.audio.onloadedmetadata = () => this.updateDuration();

      this.render();
      this.loadHot();
    }

    // ===== 数据加载 =====
    async loadHot() {
      this.showStatus('🎵 加载中...');
      try {
        const res = await fetch('/api/kuwo-hot?rn=100');
        const data = await res.json();
        this.playlist = data.success ? data.songs.map(s => ({
          id: s.rid, title: s.name, artist: s.artist, album: s.album || '',
          duration: s.duration || 0, rid: s.rid, artwork: s.artwork || '', type: 'kuwo'
        })) : [];
        if (!this.playlist.length) { this.showStatus('⚠️ 加载失败'); return; }
        this.idx = 0;
        this.renderList();
        this.updateTrack();
        this.updateSongCount();
      } catch (e) {
        console.error('loadHot failed:', e);
        this.showStatus('⚠️ 加载失败');
      }
    }

    async search(q) {
      if (!q.trim()) { this.loadHot(); return; }
      this.showStatus('🔍 搜索中...');
      try {
        const res = await fetch(`/api/music-search?q=${encodeURIComponent(q)}&rn=20`);
        const data = await res.json();
        if (!data.success || !data.songs.length) { this.showStatus('😅 没找到'); return; }
        this.playlist = data.songs.map(s => ({
          id: s.rid, title: s.name, artist: s.artist, album: s.album || '',
          duration: s.duration || 0, rid: s.rid, artwork: '', type: 'kuwo'
        }));
        this.idx = 0;
        this.isSearch = true;
        this.renderList();
        this.updateTrack();
        this.updateSongCount();
        this.showBackBtn();
      } catch (e) {
        console.error('search failed:', e);
        this.showStatus('⚠️ 搜索失败');
      }
    }

    showBackBtn() {
      const bar = this.el.querySelector('.mp-header');
      if (!bar || bar.querySelector('.back-btn')) return;
      const btn = document.createElement('button');
      btn.className = 'back-btn';
      btn.textContent = '🔥 热歌';
      btn.style.cssText = 'background:rgba(255,107,157,.15);border:1px solid rgba(255,107,157,.3);border-radius:8px;padding:8px 12px;color:#ff6b9d;cursor:pointer;font-size:.8rem;font-family:inherit;white-space:nowrap;flex-shrink:0';
      btn.onclick = () => { this.isSearch = false; btn.remove(); this.loadHot(); };
      bar.appendChild(btn);
    }

    // ===== 播放 =====
    async play(i) {
      if (i !== undefined) this.idx = i;
      const t = this.playlist[this.idx];
      if (!t) return;
      this.saveState();
      try {
        const proxyUrl = `/api/kuwo-proxy?rid=${t.rid}`;
        // 直接用代理流播放，不需要先拿链接
        this.audio.src = proxyUrl;
        await this.audio.play();
        this.playing = true;
        this.setupVisualizer();
        this.updateUI();
        this.updateMediaSession();
        this.loadLyrics(t.rid);
        return;
      } catch (e) {
        console.error('play failed:', e);
        setTimeout(() => this.next(), 500);
      }
    }

    // ===== 歌词 =====
    async loadLyrics(rid) {
      this.lyrics = [];
      this.lyricIdx = -1;
      const el = this.el.querySelector('.lyrics-lines');
      if (el) el.innerHTML = '';
      try {
        const res = await fetch(`/api/music-lyrics?rid=${rid}`);
        const data = await res.json();
        if (data.success && data.lyrics?.length) {
          this.lyrics = data.lyrics;
          this.renderLyrics();
        }
      } catch {}
    }

    renderLyrics() {
      const el = this.el.querySelector('.lyrics-lines');
      if (!el || !this.lyrics.length) return;
      el.innerHTML = this.lyrics.map((l, i) =>
        `<div class="lrc-line" data-idx="${i}" style="padding:1px 0;transition:all .3s;color:#555">${l.text}</div>`
      ).join('');
    }

    syncLyrics() {
      if (!this.lyrics.length) return;
      const ct = this.audio.currentTime;
      let idx = -1;
      for (let i = this.lyrics.length - 1; i >= 0; i--) {
        if (ct >= this.lyrics[i].time) { idx = i; break; }
      }
      if (idx !== this.lyricIdx) {
        this.lyricIdx = idx;
        const lines = this.el.querySelectorAll('.lrc-line');
        lines.forEach((l, i) => {
          if (i === idx) {
            l.style.color = '#646cff';
            l.style.fontWeight = '600';
            l.style.transform = 'scale(1.05)';
            l.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            l.style.color = i < idx ? '#333' : '#555';
            l.style.fontWeight = '400';
            l.style.transform = 'scale(1)';
          }
        });
      }
    }

    // ===== 控制 =====
    toggle() { if (this.playing) { this.audio.pause(); this.playing = false; } else { this.play(); } this.updateUI(); }
    prev() { this.idx = this.shuffle ? Math.random()*this.playlist.length|0 : (this.idx-1+this.playlist.length)%this.playlist.length; this.play(); }
    next() { if (this.repeat==='one') { this.play(); return; } this.idx = this.shuffle ? Math.random()*this.playlist.length|0 : (this.idx+1)%this.playlist.length; this.play(); }
    playAll() { if (!this.playlist.length) return; this.idx = 0; this.play(); }
    shufflePlay() { if (!this.playlist.length) return; this.shuffle = true; this.idx = Math.random()*this.playlist.length|0; this.play(); this.updateUI(); }
    handleEnded() { if (this.repeat==='one') this.play(); else if (this.repeat==='all'||this.idx<this.playlist.length-1) this.next(); else { this.playing=false; this.updateUI(); } }
    seek(e) { const r=e.currentTarget.getBoundingClientRect(); this.audio.currentTime=((e.clientX-r.left)/r.width)*(this.audio.duration||0); }
    setVolume(v) { this.volume=parseFloat(v); this.audio.volume=this.muted?0:this.volume; this.saveState(); this.updateUI(); }
    toggleMute() { this.muted=!this.muted; this.audio.volume=this.muted?0:this.volume; this.saveState(); this.updateUI(); }
    toggleShuffle() { this.shuffle=!this.shuffle; this.saveState(); this.updateUI(); }
    toggleRepeat() { const m=['off','all','one']; this.repeat=m[(m.indexOf(this.repeat)+1)%3]; this.saveState(); this.updateUI(); }
    toggleFav() { const t=this.playlist[this.idx]; if(!t)return; const i=this.favs.indexOf(t.id); if(i>=0)this.favs.splice(i,1); else this.favs.push(t.id); localStorage.setItem('fm_fav',JSON.stringify(this.favs)); this.updateUI(); }

    // ===== 可视化 =====
    setupVisualizer() {
      if (this.ctx) return;
      try {
        const ac = new (window.AudioContext||window.webkitAudioContext)();
        const src = ac.createMediaElementSource(this.audio);
        this.analyser = ac.createAnalyser(); this.analyser.fftSize=64;
        src.connect(this.analyser); this.analyser.connect(ac.destination);
        this.ctx = ac;
        this.drawVisual();
      } catch {}
    }

    drawVisual() {
      if (!this.analyser) return;
      const bars = this.el.querySelectorAll('.vis-bar');
      if (!bars.length) return;
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      const loop = () => {
        if (!this.playing) { bars.forEach(b=>b.style.height='3px'); return; }
        this.analyser.getByteFrequencyData(data);
        bars.forEach((b,i) => { const v=data[i]||0; b.style.height=`${Math.max(3,v/255*40)}px`; });
        requestAnimationFrame(loop);
      };
      loop();
    }

    // ===== Media Session =====
    updateMediaSession() {
      if (!('mediaSession' in navigator)) return;
      const t = this.playlist[this.idx]; if (!t) return;
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: '小鱼儿音乐台', artwork: t.artwork ? [{ src: t.artwork, sizes: '480x480', type: 'image/jpeg' }] : [] });
      navigator.mediaSession.setActionHandler('play', () => this.toggle());
      navigator.mediaSession.setActionHandler('pause', () => this.toggle());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }

    // ===== 状态 =====
    saveState() {
      try { localStorage.setItem('fm_state', JSON.stringify({ volume:this.volume, mute:this.muted, shuffle:this.shuffle, repeat:this.repeat, idx:this.idx })); } catch {}
    }

    // ===== UI =====
    fmt(s) { if(isNaN(s))return'0:00'; return`${s/60|0}:${(s%60|0).toString().padStart(2,'0')}`; }
    updateProgress() {
      const f = this.el.querySelector('.prog-fill');
      const t = this.el.querySelector('.time-cur');
      if (f && this.audio.duration) f.style.width = `${(this.audio.currentTime/this.audio.duration*100).toFixed(1)}%`;
      if (t) t.textContent = this.fmt(this.audio.currentTime);
    }
    updateDuration() {
      const t = this.el.querySelector('.time-total');
      if (t) t.textContent = this.fmt(this.audio.duration);
    }
    updateTrack() {
      const t = this.playlist[this.idx]; if (!t) return;
      const art = this.el.querySelector('.disc-art');
      const title = this.el.querySelector('.track-title');
      const artist = this.el.querySelector('.track-artist');
      if (art) art.style.backgroundImage = t.artwork ? `url(${t.artwork})` : 'none';
      if (title) title.textContent = t.title;
      if (artist) artist.textContent = t.artist;
      this.el.querySelectorAll('.pl-item').forEach((el, i) => el.classList.toggle('active', i === this.idx));
    }
    updateUI() {
      this.updateTrack();
      const btn = this.el.querySelector('.ctrl-play');
      const fav = this.el.querySelector('.ctrl-fav');
      const sh = this.el.querySelector('.ctrl-shuffle');
      const rp = this.el.querySelector('.ctrl-repeat');
      const disc = this.el.querySelector('.disc');
      if (btn) btn.innerHTML = this.playing ? '⏸' : '▶';
      if (fav) fav.innerHTML = this.favs.includes(this.playlist[this.idx]?.id) ? '❤️' : '🤍';
      if (sh) sh.classList.toggle('on', this.shuffle);
      if (rp) { rp.classList.toggle('on', this.repeat!=='off'); rp.innerHTML = this.repeat==='one' ? '🔂' : '🔁'; }
      if (disc) disc.classList.toggle('spin', this.playing);
    }
    showStatus(msg) {
      const list = this.el.querySelector('.pl-list');
      if (list) list.innerHTML = `<div style="text-align:center;padding:40px;color:#646cff"><div class="disc" style="width:40px;height:40px;margin:0 auto 12px;border:2px solid rgba(100,108,255,.3);border-top-color:#646cff;animation:spin 1s linear infinite"></div>${msg}</div>`;
    }
    updateSongCount() {
      const el = this.el.querySelector('.song-count');
      if (el) el.textContent = this.playlist.length ? `共 ${this.playlist.length} 首` : '';
    }
    renderList() {
      const list = this.el.querySelector('.pl-list');
      if (!list) return;
      if (!this.playlist.length) { list.innerHTML = '<div style="text-align:center;padding:40px;color:#666">暂无歌曲</div>'; return; }
      list.innerHTML = this.playlist.map((t, i) => `
        <div class="pl-item ${i===this.idx?'active':''}" data-idx="${i}">
          <div class="pl-idx">${i+1}</div>
          <div class="pl-art" style="background-image:url(${t.artwork||''})"></div>
          <div class="pl-info">
            <div class="pl-title">${t.title}</div>
            <div class="pl-artist">${t.artist}</div>
          </div>
          <div class="pl-dur">${t.duration?this.fmt(t.duration):''}</div>
        </div>
      `).join('');
      list.querySelectorAll('.pl-item').forEach(el => el.onclick = () => this.play(+el.dataset.idx));
    }

    // ===== 渲染 =====
    render() {
      this.el.innerHTML = `
      <style>
        .mp-wrap{background:linear-gradient(135deg,#0f0f1e 0%,#1a0f2e 50%,#0f0f1e 100%);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;font-family:'LXGW WenKai',-apple-system,sans-serif;color:#e8e8e8;max-width:480px;width:100%;margin:0 auto}
        .mp-header{padding:20px 20px 0;display:flex;align-items:center;gap:10px}
        .mp-header h2{font-size:1rem;font-weight:700;margin:0}
        .mp-header .badge{font-size:.65rem;background:rgba(100,108,255,.2);color:#646cff;padding:2px 8px;border-radius:6px}
        .disc-area{padding:24px 20px;text-align:center;position:relative}
        .disc{width:180px;height:180px;border-radius:50%;margin:0 auto;position:relative;transition:transform .3s}
        .disc.spin{animation:spin 4s linear infinite}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .disc-art{width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;background-color:#1a1a2e;box-shadow:0 0 40px rgba(100,108,255,.2)}
        .disc-hole{position:absolute;top:50%;left:50%;width:20px;height:20px;border-radius:50%;background:#0a0a0a;transform:translate(-50%,-50%);border:2px solid #2a2a2a}
        .track-info{text-align:center;margin-top:14px}
        .track-title{font-size:1rem;font-weight:700;margin-bottom:2px}
        .track-artist{font-size:.8rem;color:#888}
        .visualizer{display:flex;justify-content:center;gap:2px;height:40px;align-items:flex-end;margin-top:10px}
        .vis-bar{width:4px;border-radius:2px;background:linear-gradient(to top,#646cff,#ff6b9d);transition:height .05s;min-height:3px}
        .prog-area{padding:0 20px;margin-top:8px}
        .prog-bar{height:4px;background:rgba(255,255,255,.08);border-radius:2px;cursor:pointer;position:relative}
        .prog-fill{height:100%;background:linear-gradient(90deg,#646cff,#ff6b9d);border-radius:2px;transition:width .1s;width:0}
        .prog-time{display:flex;justify-content:space-between;font-size:.65rem;color:#666;margin-top:4px}
        .controls{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 20px}
        .ctrl-btn{background:none;border:none;color:#e8e8e8;font-size:1.1rem;cursor:pointer;padding:6px;border-radius:8px;transition:all .2s}
        .ctrl-btn:hover{background:rgba(255,255,255,.08)}
        .ctrl-btn.on{color:#646cff}
        .ctrl-play{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(100,108,255,.3);transition:transform .2s}
        .ctrl-play:hover{transform:scale(1.05)}
        .pl-list{max-height:350px;overflow-y:auto;padding:8px 0;-webkit-overflow-scrolling:touch}
        .pl-list::-webkit-scrollbar{width:3px}
        .pl-list::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        .pl-item{display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;transition:background .2s}
        .pl-item:hover{background:rgba(255,255,255,.04)}
        .pl-item.active{background:rgba(100,108,255,.08)}
        .pl-item.active .pl-title{color:#646cff}
        .pl-idx{font-size:.7rem;color:#555;width:20px;text-align:center}
        .pl-art{width:36px;height:36px;border-radius:6px;background-size:cover;background-position:center;background-color:#1a1a2e;flex-shrink:0}
        .pl-info{flex:1;min-width:0}
        .pl-title{font-size:.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pl-artist{font-size:.65rem;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pl-dur{font-size:.65rem;color:#555}
        .mp-footer{text-align:center;padding:10px;font-size:.6rem;color:#444;border-top:1px solid rgba(255,255,255,.04)}
        @media(max-width:480px){
          .mp-wrap{border-radius:12px;padding:0;margin:0 auto}
          .disc{width:140px;height:140px}
          .controls{gap:12px;padding:10px 16px}
          .ctrl-play{width:44px;height:44px;font-size:1.1rem}
          .pl-list{max-height:300px}
          .pl-item{padding:8px 12px}
          .track-title{font-size:.9rem}
          .lyrics-area{max-height:80px}
        }
        @media(min-width:481px) and (max-width:768px){
          .mp-wrap{max-width:420px}
        }
      </style>
      <div class="mp-wrap">
        <div class="mp-header">
          <h2>🐟 音乐台</h2>
          <span class="badge">酷我音乐</span>
          <input id="fish-search-input" placeholder="🔍 搜索..." style="flex:0 0 100px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:16px;padding:6px 12px;color:#e8e8e8;font-size:.8rem;font-family:inherit;outline:none;margin-left:auto" onkeydown="if(event.key==='Enter')this.closest('.mp-wrap').__player.search(this.value)">        </div>
        <div class="disc-area">
          <div class="disc"><div class="disc-art"></div><div class="disc-hole"></div></div>
          <div class="track-info">
            <div class="track-title">加载中...</div>
            <div class="track-artist">—</div>
          </div>
          <div class="lyrics-area" style="max-height:120px;overflow:hidden;margin-top:10px;text-align:center">
            <div class="lyrics-lines" style="font-size:.75rem;color:#666;line-height:1.8"></div>
          </div>
          <div class="visualizer">${Array.from({length:20},()=>'<div class="vis-bar"></div>').join('')}</div>
        </div>
        <div class="prog-area">
          <div class="prog-bar" onclick="this.closest('.mp-wrap').__player.seek(event)"><div class="prog-fill"></div></div>
          <div class="prog-time"><span class="time-cur">0:00</span><span class="time-total">0:00</span></div>
        </div>
        <div class="controls">
          <button class="ctrl-btn ctrl-shuffle" onclick="this.closest('.mp-wrap').__player.toggleShuffle()" title="随机">🔀</button>
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.prev()" title="上一首">⏮</button>
          <button class="ctrl-play" onclick="this.closest('.mp-wrap').__player.toggle()" title="播放/暂停">▶</button>
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.next()" title="下一首">⏭</button>
          <button class="ctrl-btn ctrl-repeat" onclick="this.closest('.mp-wrap').__player.toggleRepeat()" title="循环">🔁</button>
          <button class="ctrl-btn ctrl-fav" onclick="this.closest('.mp-wrap').__player.toggleFav()" title="收藏">🤍</button>
        </div>

        <div style="display:flex;gap:8px;padding:0 16px 8px;flex-wrap:wrap">
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.playAll()" style="font-size:.75rem;background:rgba(100,108,255,.15);border:1px solid rgba(100,108,255,.3);border-radius:6px;padding:4px 10px;cursor:pointer">▶ 播放全部</button>
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.shufflePlay()" style="font-size:.75rem;background:rgba(255,107,157,.15);border:1px solid rgba(255,107,157,.3);border-radius:6px;padding:4px 10px;cursor:pointer">🔀 随机播放</button>
          <button onclick="document.querySelector('#fish-search-input').focus()" style="width:32px;height:32px;background:#646cff;border:none;border-radius:8px;color:#fff;cursor:pointer;font-size:.85rem;flex-shrink:0">🔍</button>
        </div>
        <div class="pl-list"><div style="text-align:center;padding:40px;color:#666">🎵 加载中...</div></div>
        <div class="mp-footer">🐟 小鱼儿音乐台 · 酷我音乐 · 空格播放 · ↑↓切歌 · ←→快进退</div>
      </div>`;

      this.el.querySelector('.mp-wrap').__player = this;

      // 键盘快捷键
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
        else if (e.code === 'ArrowLeft') { e.preventDefault(); this.audio.currentTime = Math.max(0, this.audio.currentTime - 5); }
        else if (e.code === 'ArrowRight') { e.preventDefault(); this.audio.currentTime = Math.min(this.audio.duration || 0, this.audio.currentTime + 5); }
        else if (e.code === 'ArrowUp') { e.preventDefault(); this.prev(); }
        else if (e.code === 'ArrowDown') { e.preventDefault(); this.next(); }
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishMusicPlayer());
  else new FishMusicPlayer();
})();
