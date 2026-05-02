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
      this.favView = false;
      this._fullPlaylist = null;

      // 恢复上次状态
      try {
        const st = JSON.parse(localStorage.getItem('fm_state') || '{}');
        if (st.shuffle) this.shuffle = st.shuffle;
        if (st.repeat) this.repeat = st.repeat;
      } catch {}

      this.audio.volume = this.volume;
      this.audio.ontimeupdate = () => { this.updateProgress(); this.syncLyrics(); };
      this.audio.onended = () => this.handleEnded();
      this.audio.onerror = () => { console.warn('播放失败，跳下一首'); this._skipAfterFail(); };
      this.audio.onloadedmetadata = () => this.updateDuration();
      this.audio.onwaiting = () => this.setLoading(true);
      this.audio.oncanplay = () => this.setLoading(false);

      // 后台播放：防止页面切后台时音频暂停
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.playing) {
          // 页面隐藏时，确保 AudioContext 不被挂起
          if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
        }
      });

      this.render();
      this.el.classList.add('visible');
      this.loadHot();
    }

    // ===== 数据加载 =====
    async loadHot() {
      this.showStatus('🎵 加载中...');
      try {
        const res = await fetch('/api/kuwo-hot?rn=30');
        const data = await res.json();
        this.playlist = data.success ? data.songs.map(s => ({
          id: s.rid, title: s.name, artist: s.artist, album: s.album || '',
          duration: s.duration || 0, rid: s.rid, artwork: s.artwork || '', type: 'kuwo'
        })) : [];
        if (!this.playlist.length) { this.showStatus('⚠️ 加载失败', false); return; }
        this.idx = 0;
        this.favView = false;
        this._fullPlaylist = null;
        this.renderList();
        this.updateTrack();
        this.updateSongCount();
      } catch (e) {
        console.error('loadHot failed:', e);
        this.showStatus('⚠️ 加载失败', false);
      }
    }

    async search(q) {
      if (!q.trim()) { this.loadHot(); return; }
      this.showStatus('🔍 搜索中...');
      const results = [];

      // 同时搜酷我和 Audius
      const [kuwoRes, audiusRes] = await Promise.allSettled([
        fetch(`/api/music-search?q=${encodeURIComponent(q)}&rn=15`).then(r => r.json()),
        fetch(`/api/audius-search?q=${encodeURIComponent(q)}&rn=15`).then(r => r.json())
      ]);

      // 酷我结果
      if (kuwoRes.status === 'fulfilled' && kuwoRes.value.success) {
        kuwoRes.value.songs.forEach(s => results.push({
          id: s.rid, title: s.name, artist: s.artist, album: s.album || '',
          duration: s.duration || 0, rid: s.rid, artwork: '', type: 'kuwo'
        }));
      }

      // Audius 结果
      if (audiusRes.status === 'fulfilled' && audiusRes.value.success) {
        audiusRes.value.songs.forEach(s => results.push({
          id: s.rid, title: s.name, artist: s.artist, album: s.album || '',
          duration: s.duration || 0, rid: s.rid, artwork: s.artwork || '',
          type: 'audius', streamUrl: s.streamUrl || ''
        }));
      }

      if (!results.length) { this.showStatus('😅 没找到', false); return; }
      this.playlist = results;
      this.idx = 0;
      this.isSearch = true;
      this.favView = false;
      this._fullPlaylist = null;
      this.renderList();
      this.updateTrack();
      this.updateSongCount();
    }

    // ===== 播放 =====
    async play(i) {
      if (i !== undefined) this.idx = i;
      const t = this.playlist[this.idx];
      if (!t) return;
      this.saveState();
      // 释放上一个 blob URL
      if (this.audio.src && this.audio.src.startsWith('blob:')) URL.revokeObjectURL(this.audio.src);
      try {
        // 根据来源选择播放路径
        const src0 = t.type === 'audius' && t.streamUrl ? t.streamUrl : `/api/kuwo-proxy?rid=${t.rid}`;
        let src = src0;
        console.log('[播放]', t.type, t.title, src);
        // Audius 跨域流先 fetch 成 blob，避免 CORS 限制可视化
        if (t.type === 'audius' && src.startsWith('http')) {
          try {
            const resp = await fetch(src);
            const blob = await resp.blob();
            src = URL.createObjectURL(blob);
          } catch (e) {
            console.warn('[Audius blob 失败，直连]', e);
          }
        }
        this.audio.src = src;
        await this.audio.play();
        this._failCount = 0; // 播放成功，重置失败计数
        this.playing = true;
        this.setupVisualizer();
        this.updateUI();
        this.updateMediaSession();
        this.loadLyrics(t.type === 'kuwo' ? t.rid : null);
        return;
      } catch (e) {
        console.error('[播放失败]', t.type, t.title, e);
        this._skipAfterFail();
      }
    }

    // ===== 歌词 =====
    async loadLyrics(rid) {
      this.lyrics = [];
      this.lyricIdx = -1;
      if (!rid) return;
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
      if (!el) return;
      if (!this.lyrics.length) { el.innerHTML = '<div style="color:#444;font-size:.7rem">暂无歌词</div>'; return; }
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
    _skipAfterFail() {
      this._failCount = (this._failCount || 0) + 1;
      // 连续失败太多次，停止跳歌，避免死循环
      if (this._failCount >= 5) {
        this._failCount = 0;
        this.playing = false;
        this.updateUI();
        return;
      }
      // 延迟跳歌，避免太快打断正在加载的歌曲
      if (this.playlist.length > 1) setTimeout(() => this.next(), 800);
    }
    seek(e) { const r=e.currentTarget.getBoundingClientRect(); this.audio.currentTime=((e.clientX-r.left)/r.width)*(this.audio.duration||0); }
    setVolume(v) { this.volume=parseFloat(v); this.audio.volume=this.muted?0:this.volume; this.saveState(); this.updateUI(); }
    toggleMute() { this.muted=!this.muted; this.audio.volume=this.muted?0:this.volume; this.saveState(); this.updateUI(); }
    toggleShuffle() { this.shuffle=!this.shuffle; this.saveState(); this.updateUI(); }
    toggleRepeat() { const m=['off','all','one']; this.repeat=m[(m.indexOf(this.repeat)+1)%3]; this.saveState(); this.updateUI(); }
    toggleFav() { const t=this.playlist[this.idx]; if(!t)return; const i=this.favs.indexOf(t.id); if(i>=0)this.favs.splice(i,1); else this.favs.push(t.id); localStorage.setItem('fm_fav',JSON.stringify(this.favs)); this.updateUI(); this.renderList(); }
    toggleFavIdx(i) { const t=this.playlist[i]; if(!t)return; const j=this.favs.indexOf(t.id); if(j>=0)this.favs.splice(j,1); else this.favs.push(t.id); localStorage.setItem('fm_fav',JSON.stringify(this.favs)); this.renderList(); }
    toggleFavView() {
      const btn = this.el.querySelector('.act-fav-list');
      if (this.favView) {
        // 退出收藏视图，恢复全部列表
        this.favView = false;
        this.playlist = this._fullPlaylist || this.playlist;
        if (btn) btn.classList.remove('on');
      } else {
        // 进入收藏视图
        if (!this.favs.length) { this.showStatus('还没有收藏歌曲 ❤️', false); return; }
        this._fullPlaylist = this.playlist.slice();
        this.playlist = this.playlist.filter(t => this.favs.includes(t.id));
        if (!this.playlist.length) { this.showStatus('当前列表中没有收藏歌曲', false); this.playlist = this._fullPlaylist; return; }
        this.favView = true;
        if (btn) btn.classList.add('on');
      }
      this.idx = 0;
      this.renderList();
      this.updateSongCount();
    }

    // ===== 可视化 =====
    setupVisualizer() {
      if (this.ctx) return;
      try {
        const ac = new (window.AudioContext||window.webkitAudioContext)();
        const resume = () => { if (ac.state === 'suspended') ac.resume(); };
        resume();
        // 手机端可能需要多次 resume
        document.addEventListener('touchstart', resume, { once: true });
        document.addEventListener('click', resume, { once: true });
        const src = ac.createMediaElementSource(this.audio);
        this.analyser = ac.createAnalyser(); this.analyser.fftSize=64;
        src.connect(this.analyser); this.analyser.connect(ac.destination);
        this.ctx = ac;
        this.drawVisual();
        // 3秒后如果还挂起，断开可视化让声音出来
        setTimeout(() => {
          if (ac.state === 'suspended') {
            try { src.disconnect(); src.connect(ac.destination); } catch {}
            ac.resume();
          }
        }, 3000);
      } catch {}
    }

    drawVisual() {
      if (!this.analyser) return;
      const bars = this.el.querySelectorAll('.vis-bar');
      if (!bars.length) return;
      const data = new Uint8Array(this.analyser.frequencyBinCount);
      const disc = this.el.querySelector('.disc');
      const loop = () => {
        if (!this.playing) { bars.forEach(b=>b.style.height='3px'); const art=this.el.querySelector('.disc-art'); if(art)art.style.transform=''; return; }
        this.analyser.getByteFrequencyData(data);
        bars.forEach((b,i) => { const v=data[i]||0; b.style.height=`${Math.max(3,v/255*40)}px`; });
        // 低频脉冲 → 唱片封面缩放（不干扰外层旋转）
        const art = this.el.querySelector('.disc-art');
        if (art) {
          const bass = (data[0]+data[1]+data[2])/(3*255);
          art.style.transform = `scale(${1 + bass*0.08})`;
        }
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
      if (art) {
        if (t.artwork) {
          art.style.backgroundImage = `url(${t.artwork})`;
          art.innerHTML = '';
        } else {
          art.style.backgroundImage = 'linear-gradient(135deg,#646cff33,#ff6b9d33)';
          art.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:3rem;opacity:.6">🎵</div>';
        }
      }
      if (title) { title.textContent = t.title; title.classList.remove('animate'); void title.offsetWidth; title.classList.add('animate'); }
      if (artist) artist.textContent = t.artist;
      this.el.querySelectorAll('.pl-item').forEach((el, i) => {
        const active = i === this.idx;
        el.classList.toggle('active', active);
        if (active) {
          // 只在播放列表内滚动，不滚动整个页面
          const list = this.el.querySelector('.pl-list');
          if (list) {
            const itemTop = el.offsetTop - list.offsetTop;
            if (itemTop < list.scrollTop || itemTop > list.scrollTop + list.clientHeight - el.offsetHeight) {
              list.scrollTo({ top: itemTop - 10, behavior: 'smooth' });
            }
          }
        }
      });
    }
    updateUI() {
      this.updateTrack();
      const btn = this.el.querySelector('.ctrl-play');
      const rp = this.el.querySelector('.act-loop');
      const disc = this.el.querySelector('.disc');
      const wrap = this.el.querySelector('.mp-wrap');
      const aurora = this.el.querySelector('.aurora');
      if (btn) { btn.innerHTML = this.playing ? '⏸' : '▶'; btn.classList.toggle('playing', this.playing); }
      if (rp) { rp.classList.toggle('on', this.repeat!=='off'); rp.innerHTML = (this.repeat==='one' ? '🔂' : '🔁') + ' 循环'; }
      if (disc) disc.classList.toggle('spin', this.playing);
      if (wrap) wrap.classList.toggle('playing', this.playing);
      if (aurora) aurora.classList.toggle('on', this.playing);
      // 播放时定时撒音符
      if (this.playing && !this._noteTimer) {
        this._noteTimer = setInterval(() => this.spawnNote(), 1200);
      } else if (!this.playing && this._noteTimer) {
        clearInterval(this._noteTimer); this._noteTimer = null;
      }
    }
    spawnNote() {
      const container = this.el.querySelector('.float-notes');
      if (!container) return;
      const notes = ['♪','♫','♬','♩','🎵','🎶'];
      const note = document.createElement('span');
      note.className = 'float-note';
      note.textContent = notes[Math.random()*notes.length|0];
      note.style.left = (20 + Math.random()*60) + '%';
      note.style.bottom = '30%';
      note.style.setProperty('--dx', (Math.random()*60-30) + 'px');
      note.style.setProperty('--rot', (Math.random()*40-20) + 'deg');
      note.style.color = Math.random()>.5 ? '#646cff' : '#ff6b9d';
      container.appendChild(note);
      setTimeout(() => note.remove(), 3000);
    }
    showStatus(msg, spin=true) {
      const list = this.el.querySelector('.pl-list');
      const spinner = spin ? '<div class="disc" style="width:40px;height:40px;margin:0 auto 12px;border:2px solid rgba(100,108,255,.3);border-top-color:#646cff;animation:spin 1s linear infinite"></div>' : '';
      if (list) list.innerHTML = `<div style="text-align:center;padding:40px;color:#646cff">${spinner}${msg}</div>`;
    }
    updateSongCount() {
      const el = this.el.querySelector('.song-count');
      if (el) el.textContent = this.playlist.length ? `共 ${this.playlist.length} 首` : '';
    }
    setLoading(on) {
      const btn = this.el.querySelector('.ctrl-play');
      if (!btn) return;
      if (on) { btn.innerHTML = '<div style="width:16px;height:16px;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin 1s linear infinite"></div>'; }
      else { btn.innerHTML = this.playing ? '⏸' : '▶'; }
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
            <div class="pl-title">${t.title} ${t.type==='audius'?'<span style="font-size:.55rem;color:#22c55e;background:rgba(34,197,94,.15);padding:1px 5px;border-radius:4px">Audius</span>':t.type==='kuwo'?'<span style="font-size:.55rem;color:#646cff;background:rgba(100,108,255,.15);padding:1px 5px;border-radius:4px">酷我</span>':''}</div>
            <div class="pl-artist">${t.artist}</div>
          </div>
          <div class="pl-dur">${t.duration?this.fmt(t.duration):''}</div>
          <button class="pl-fav" onclick="event.stopPropagation();this.closest('.mp-wrap').__player.toggleFavIdx(${i})" title="收藏">${this.favs.includes(t.id)?'❤️':'🤍'}</button>
        </div>
      `).join('');
      list.querySelectorAll('.pl-item').forEach(el => el.onclick = () => this.play(+el.dataset.idx));
    }

    // ===== 渲染 =====
    render() {
      this.el.innerHTML = `
      <style>
        .mp-wrap{background:linear-gradient(135deg,#0f0f1e 0%,#1a0f2e 50%,#0f0f1e 100%);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;font-family:'LXGW WenKai',-apple-system,sans-serif;color:#e8e8e8;;width:100%;margin:0 auto;animation:player-in .6s ease-out;position:relative}
        .mp-wrap::before{content:'';position:absolute;inset:-2px;border-radius:22px;background:conic-gradient(from var(--a,0deg),#646cff,#ff6b9d,#646cff,#ff6b9d,#646cff);z-index:-1;opacity:0;transition:opacity .5s;animation:rotate-border 4s linear infinite}
        .mp-wrap.playing::before{opacity:.6}
        @property --a{syntax:'<angle>';initial-value:0deg;inherits:false}
        @keyframes rotate-border{to{--a:360deg}}
        @keyframes player-in{from{opacity:0;transform:translateY(20px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
        .mp-header{padding:20px 20px 0;display:flex;align-items:center;gap:10px}
        .mp-header h2{font-size:1rem;font-weight:700;margin:0;background:linear-gradient(135deg,#646cff,#ff6b9d,#646cff);background-size:200% 200%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:gradient-text 3s ease infinite}
        @keyframes gradient-text{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        .mp-header .badge{font-size:.65rem;background:rgba(100,108,255,.2);color:#646cff;padding:2px 8px;border-radius:6px}
        .disc-area{padding:24px 20px;text-align:center;position:relative}
        .disc{width:180px;height:180px;border-radius:50%;margin:0 auto;position:relative;transition:transform .3s}
        .disc.spin{animation:spin 4s linear infinite}
        .disc.spin::before{content:'';position:absolute;inset:-12px;border-radius:50%;background:conic-gradient(from 0deg,transparent 0%,rgba(100,108,255,.25) 25%,transparent 50%,rgba(255,107,157,.25) 75%,transparent 100%);animation:spin 3s linear infinite;filter:blur(6px);z-index:-1}
        .disc.spin::after{content:'';position:absolute;inset:-4px;border-radius:50%;background:conic-gradient(from 180deg,transparent,rgba(255,255,255,.08),transparent,rgba(255,255,255,.08),transparent);animation:spin-reverse 5s linear infinite}
        @keyframes spin-reverse{from{transform:rotate(360deg)}to{transform:rotate(0)}}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(100,108,255,.3)}50%{box-shadow:0 0 40px rgba(100,108,255,.6),0 0 60px rgba(255,107,157,.2)}}
        .disc-art{width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;background-color:#1a1a2e;box-shadow:0 0 40px rgba(100,108,255,.2);position:relative;overflow:hidden}
        .disc.spin .disc-art{animation:pulse-glow 2s ease-in-out infinite}
        .disc-art::after{content:'';position:absolute;inset:0;border-radius:50%;background:linear-gradient(135deg,rgba(255,255,255,.15) 0%,transparent 50%,rgba(255,255,255,.05) 100%);pointer-events:none}
        /* 黑胶纹路 */
        .disc-art::before{content:'';position:absolute;inset:15%;border-radius:50%;background:repeating-radial-gradient(circle at center,transparent 0px,transparent 3px,rgba(0,0,0,.15) 3px,rgba(0,0,0,.15) 4px);pointer-events:none;opacity:.4}
        /* 旋转光点 */
        .disc.spin .disc-hole::before{content:'';position:absolute;width:4px;height:4px;background:#fff;border-radius:50%;top:-90px;left:50%;box-shadow:0 0 8px #646cff,0 0 20px rgba(100,108,255,.4);animation:sparkle-orbit 4s linear infinite}
        .disc.spin .disc-hole::after{content:'';position:absolute;width:3px;height:3px;background:#ff6b9d;border-radius:50%;top:50%;right:-85px;box-shadow:0 0 8px #ff6b9d,0 0 15px rgba(255,107,157,.4);animation:sparkle-orbit 4s linear infinite reverse}
        @keyframes sparkle-orbit{from{transform:rotate(0) translateX(0)}to{transform:rotate(360deg) translateX(0)}}
        .disc-art{width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;background-color:#1a1a2e;box-shadow:0 0 40px rgba(100,108,255,.2)}
        .disc-hole{position:absolute;top:50%;left:50%;width:20px;height:20px;border-radius:50%;background:#0a0a0a;transform:translate(-50%,-50%);border:2px solid #2a2a2a}
        .track-info{text-align:center;margin-top:14px}
        .track-title{font-size:1rem;font-weight:700;margin-bottom:2px;transition:all .3s}
        @keyframes title-slide{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .track-title.animate{animation:title-slide .4s ease-out}
        .track-artist{font-size:.8rem;color:#888}
        .visualizer{display:flex;justify-content:center;gap:2px;height:40px;align-items:flex-end;margin-top:10px}
        .vis-bar{width:4px;border-radius:2px;background:linear-gradient(to top,#646cff,#ff6b9d);transition:height .08s ease-out;min-height:3px;box-shadow:0 0 6px rgba(100,108,255,.3)}
        .prog-area{padding:0 20px;margin-top:8px}
        .prog-bar{height:6px;background:rgba(255,255,255,.08);border-radius:3px;cursor:pointer;position:relative;touch-action:none}
        .prog-fill{height:100%;background:linear-gradient(90deg,#646cff,#ff6b9d);border-radius:2px;transition:width .1s;width:0;position:relative}
        .prog-fill::after{content:'';position:absolute;right:-4px;top:50%;width:10px;height:10px;border-radius:50%;background:#fff;transform:translateY(-50%);box-shadow:0 0 10px rgba(100,108,255,.6);opacity:0;transition:opacity .2s}
        .prog-bar:hover .prog-fill::after{opacity:1}
        .prog-fill::before{content:'';position:absolute;inset:0;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent);animation:prog-shine 2s ease-in-out infinite}
        @keyframes prog-shine{0%,100%{transform:translateX(-100%)}50%{transform:translateX(100%)}}
        .prog-time{display:flex;justify-content:space-between;font-size:.65rem;color:#666;margin-top:4px}
        .controls{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 20px}
        .ctrl-btn{background:none;border:none;color:#e8e8e8;font-size:1.1rem;cursor:pointer;padding:6px;border-radius:8px;transition:all .2s}
        .ctrl-btn:hover{background:rgba(255,255,255,.08)}
        .ctrl-btn.on{color:#646cff}
        .ctrl-play{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(100,108,255,.3);transition:all .2s;position:relative}
        .ctrl-play:hover{transform:scale(1.1);box-shadow:0 4px 30px rgba(100,108,255,.5)}
        .ctrl-play:active{transform:scale(.95)}
        @keyframes play-pulse{0%,100%{box-shadow:0 4px 20px rgba(100,108,255,.3)}50%{box-shadow:0 4px 30px rgba(100,108,255,.5),0 0 50px rgba(255,107,157,.2)}}
        .ctrl-play.playing{animation:play-pulse 2s ease-in-out infinite}
        /* 按钮涟漪 */
        .ctrl-btn,.ctrl-play,.act-btn{position:relative;overflow:hidden}
        .ctrl-btn::after,.ctrl-play::after,.act-btn::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at var(--rx,50%) var(--ry,50%),rgba(255,255,255,.3),transparent 60%);opacity:0;transition:opacity .4s;pointer-events:none}
        .ctrl-btn:active::after,.ctrl-play:active::after,.act-btn:active::after{opacity:1;transition:opacity 0s}

        .search-box{display:flex;padding:12px 16px;gap:8px;align-items:center}
        .search-box input{flex:1;min-width:0;width:0;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e8e8e8;font-size:.8rem;font-family:inherit;outline:none;transition:width .3s}
        .search-box input:focus{border-color:#646cff}
        .search-box button{background:#646cff;border:none;border-radius:8px;padding:8px 14px;color:#fff;cursor:pointer;font-size:.8rem;flex-shrink:0}
        .action-bar{display:flex;gap:6px;padding:8px 16px;flex-wrap:wrap;align-items:center;overflow:hidden}
        .action-bar .act-btn{font-size:.8rem;border:none;border-radius:8px;padding:8px 14px;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .25s;font-weight:600;flex:0 1 auto;min-width:0;position:relative;overflow:hidden}
        .action-bar .act-btn::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.1),transparent);opacity:0;transition:opacity .25s}
        .action-bar .act-btn:hover::before{opacity:1}
        .action-bar .act-btn:hover{transform:translateY(-2px);box-shadow:0 4px 15px rgba(0,0,0,.3)}
        .action-bar .act-btn:active{transform:scale(0.95) translateY(0)}
        .action-bar .act-play{background:rgba(100,108,255,.25);color:#8b8eff}
        .action-bar .act-shuffle{background:rgba(255,107,157,.2);color:#ff8ab5}
        .action-bar .act-fav-list{background:rgba(255,107,157,.12);color:#ff6b9d}
        .action-bar .act-fav-list.on{background:#ff6b9d;color:#fff}
        .action-bar .act-loop{background:rgba(100,108,255,.12);color:#646cff}
        .action-bar .act-loop.on{background:#646cff;color:#fff}
        .pl-list{max-height:350px;overflow-y:auto;padding:8px 0;-webkit-overflow-scrolling:touch}
        .pl-list::-webkit-scrollbar{width:3px}
        .pl-list::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        .pl-item{display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;transition:all .25s;border-left:3px solid transparent;padding-left:13px}
        .pl-item:hover{background:rgba(255,255,255,.04);transform:translateX(4px)}
        .pl-item.active{background:rgba(100,108,255,.08);border-left:3px solid #646cff;padding-left:13px}
        .pl-item.active .pl-title{color:#646cff}
        @keyframes active-glow{0%,100%{background:rgba(100,108,255,.08)}50%{background:rgba(100,108,255,.14)}}
        .pl-item.active{animation:active-glow 2s ease-in-out infinite}
        .pl-item.active .pl-art{box-shadow:0 0 12px rgba(100,108,255,.4);border-radius:8px}
        @keyframes item-enter{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        .pl-item{animation:item-enter .3s ease-out both}
        .pl-item:nth-child(1){animation-delay:.02s}
        .pl-item:nth-child(2){animation-delay:.04s}
        .pl-item:nth-child(3){animation-delay:.06s}
        .pl-item:nth-child(4){animation-delay:.08s}
        .pl-item:nth-child(5){animation-delay:.1s}
        .pl-item:nth-child(6){animation-delay:.12s}
        .pl-item:nth-child(7){animation-delay:.14s}
        .pl-item:nth-child(8){animation-delay:.16s}
        .pl-item:nth-child(9){animation-delay:.18s}
        .pl-item:nth-child(10){animation-delay:.2s}
        .pl-idx{font-size:.7rem;color:#555;width:20px;text-align:center}
        .pl-art{width:36px;height:36px;border-radius:6px;background-size:cover;background-position:center;background-color:#1a1a2e;flex-shrink:0}
        .pl-info{flex:1;min-width:0}
        .pl-title{font-size:.8rem;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pl-artist{font-size:.65rem;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .pl-dur{font-size:.65rem;color:#555}
        .pl-fav{background:none;border:none;font-size:.85rem;cursor:pointer;padding:2px 4px;flex-shrink:0;opacity:.5;transition:opacity .2s}
        .pl-fav:hover{opacity:1}
        .mp-footer{text-align:center;padding:10px;font-size:.6rem;color:#444;border-top:1px solid rgba(255,255,255,.04)}
        /* 极光背景 */
        .aurora{position:absolute;top:0;left:0;right:0;height:200px;overflow:hidden;pointer-events:none;opacity:0;transition:opacity 1s;z-index:0}
        .aurora.on{opacity:1}
        .aurora::before,.aurora::after{content:'';position:absolute;width:300px;height:300px;border-radius:50%;filter:blur(80px);opacity:.15}
        .aurora::before{background:#646cff;top:-150px;left:-50px;animation:aurora-1 8s ease-in-out infinite}
        .aurora::after{background:#ff6b9d;top:-100px;right:-50px;animation:aurora-2 6s ease-in-out infinite}
        @keyframes aurora-1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(50px,30px) scale(1.2)}}
        @keyframes aurora-2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-40px,20px) scale(1.3)}}
        /* 浮动音符 */
        .float-notes{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;z-index:1}
        .float-note{position:absolute;font-size:1rem;opacity:0;animation:note-float 3s ease-out forwards}
        @keyframes note-float{0%{opacity:0;transform:translateY(0) scale(.5)}20%{opacity:.7}100%{opacity:0;transform:translateY(-120px) translateX(var(--dx,20px)) scale(1.2) rotate(var(--rot,20deg))}}

        @media(max-width:768px){
          .mp-wrap{border-radius:12px;margin:0 8px}
          .disc{width:140px;height:140px}
          .controls{gap:12px;padding:10px 16px}
          .ctrl-play{width:44px;height:44px;font-size:1.1rem}
          .search-box{padding:10px 12px;gap:6px}
          .search-box input{padding:7px 10px;font-size:.75rem}
          .search-box button{padding:7px 10px;font-size:.75rem}
          .action-bar{padding:8px 12px;gap:6px}
          .action-bar .act-btn{padding:7px 12px;font-size:.8rem}
          .pl-list{max-height:300px}
          .pl-item{padding:8px 12px}
          .track-title{font-size:.9rem}
        }
        @media(min-width:481px) and (){
          .mp-wrap{}
        }
      </style>
      <div class="mp-wrap">
        <div class="aurora"></div>
        <div class="float-notes"></div>
        <div class="mp-header">
          <h2>🐟 音乐台</h2>
          <span class="badge">酷我 · Audius</span>
        </div>
        <div class="disc-area">
          <div class="disc"><div class="disc-art"></div><div class="disc-hole"></div></div>
          <div class="track-info">
            <div class="track-title">加载中...</div>
            <div class="track-artist">—</div>
          </div>
          <div class="visualizer">${Array.from({length:20},()=>'<div class="vis-bar"></div>').join('')}</div>
        </div>
        <div class="prog-area">
          <div class="prog-bar" onclick="this.closest('.mp-wrap').__player.seek(event)"><div class="prog-fill"></div></div>
          <div class="prog-time"><span class="time-cur">0:00</span><span class="time-total">0:00</span></div>
        </div>
        <div class="controls">
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.prev()" title="上一首">⏮</button>
          <button class="ctrl-play" onclick="this.closest('.mp-wrap').__player.toggle()" title="播放/暂停">▶</button>
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.next()" title="下一首">⏭</button>
        </div>

        <div class="search-box">
          <input placeholder="🔍 搜索歌曲..." onkeydown="if(event.key==='Enter')this.closest('.mp-wrap').__player.search(this.value)">
          <button onclick="this.closest('.mp-wrap').__player.search(this.previousElementSibling.value)">搜索</button>
        </div>
        <div class="action-bar">
          <button class="act-btn act-play" onclick="this.closest('.mp-wrap').__player.playAll()">▶ 播放全部</button>
          <button class="act-btn act-shuffle" onclick="this.closest('.mp-wrap').__player.shufflePlay()">🔀 随机</button>
          <button class="act-btn act-loop" onclick="this.closest('.mp-wrap').__player.toggleRepeat()">🔁 循环</button>
          <button class="act-btn act-fav-list" onclick="this.closest('.mp-wrap').__player.toggleFavView()">❤️ 收藏</button>
          <span style="font-size:.65rem;color:#666;margin-left:auto" class="song-count"></span>
        </div>
        <div class="pl-list"><div style="text-align:center;padding:40px;color:#666">🎵 加载中...</div></div>
        <div class="mp-footer">🐟 小鱼儿音乐台 · 酷我+Audius · 空格播放 · ↑↓切歌 · ←→快进退</div>
      </div>`;

      this.el.querySelector('.mp-wrap').__player = this;

      // 进度条触摸拖动
      const progBar = this.el.querySelector('.prog-bar');
      if (progBar) {
        const seekTouch = (e) => {
          const r = progBar.getBoundingClientRect();
          const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
          const pct = Math.max(0, Math.min(1, x / r.width));
          if (this.audio.duration) this.audio.currentTime = pct * this.audio.duration;
        };
        let touching = false;
        progBar.addEventListener('touchstart', (e) => { touching = true; seekTouch(e); }, { passive: true });
        progBar.addEventListener('touchmove', (e) => { if (touching) seekTouch(e); }, { passive: true });
        progBar.addEventListener('touchend', () => { touching = false; });
      }

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
