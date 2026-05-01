/**
 * 小鱼儿音乐播放器 🐟🎵
 * Audius 免费全曲 + AI 推荐 + 大厂级 UI
 * 用法：<div id="fish-music-player"></div><script src="/fish-music-player.js"></script>
 */
(function () {
  'use strict';

  const AUDIUS_API = 'https://api.audius.co/v1';
  const APP_NAME = 'fishplayer';
  const GENRES = ['Electronic','Hip-Hop/Rap','Pop','Rock','Jazz','Classical','R&B/Soul','Ambient','Metal','World','Folk','Disco','Funk','Reggae','Latin'];

  // 网易云音乐热歌榜
  const NETEASE_PLAYLISTS = [
    { id: 3778678, name: '热歌榜', icon: '🔥', desc: '实时热门' },
    { id: 19723756, name: '飙升榜', icon: '🚀', desc: '快速上升' },
    { id: 2884035, name: '华语流行', icon: '🎤', desc: '流行精选' },
    { id: 5046787, name: '摇滚榜', icon: '🎸', desc: '摇滚力量' },
    { id: 1163078, name: '民谣榜', icon: '🎵', desc: '民谣清新' },
    { id: 2809513768, name: '欧美新歌', icon: '🌍', desc: '欧美热门' },
  ];

  // Web Audio 后备
  const GENERATED = [
    { id:'g1', title:'Lo-fi Dreams', artist:'AI 生成', genre:'Lo-fi', type:'generated', style:'lofi' },
    { id:'g2', title:'Jazz Night', artist:'AI 生成', genre:'Jazz', type:'generated', style:'jazz' },
    { id:'g3', title:'Rain & Thunder', artist:'AI 生成', genre:'环境音', type:'generated', style:'rain' },
  ];

  class FishMusicPlayer {
    constructor() {
      this.el = document.getElementById('fish-music-player');
      if (!this.el) return;
      this.audio = new Audio();
      this.audio.crossOrigin = 'anonymous';
      this.audio.preload = 'metadata';
      this.audio.volume = 0.6;
      this.playlist = [];
      this.idx = 0;
      this.playing = false;
      this.volume = 0.6;
      this.muted = false;
      this.shuffle = false;
      this.repeat = 'off'; // off/all/one
      this.favs = JSON.parse(localStorage.getItem('fm_fav') || '[]');
      this.syncFavsFromDb();
      this.tab = 'trending';
      this.ctx = null; this.analyser = null; this.genNodes = {};
      this.searchTimer = null;

      this.audio.ontimeupdate = () => this.updateProgress();
      this.audio.onended = () => this.handleEnded();
      this.audio.onerror = () => { setTimeout(() => this.next(), 800); };
      this.audio.onloadedmetadata = () => this.updateDuration();

      this.render();
      this.loadTrending();
      this.bindKeys();
    }

    // ===== 数据加载 =====
    async loadTrending(genre) {
      this.showLoading();
      try {
        let url = `${AUDIUS_API}/tracks/trending?limit=30&app_name=${APP_NAME}`;
        if (genre) url += `&genre=${encodeURIComponent(genre)}`;
        const res = await fetch(url);
        const data = await res.json();
        this.playlist = (data.data || []).map(t => this.mapTrack(t));
        if (!this.playlist.length) this.playlist = GENERATED;
        this.idx = 0;
        this.renderList();
        if (this.playlist.length) this.updateTrack();
      } catch (e) {
        console.error('Load trending failed:', e);
        this.playlist = GENERATED;
        this.renderList();
      }
    }

    async searchTracks(q) {
      if (!q.trim()) { this.loadTrending(); return; }
      this.showLoading();
      const [audius, netease, qq] = await Promise.allSettled([
        this._searchAudius(q), this._searchNetease(q), this._searchQQ(q),
      ]);
      const aList = audius.status === 'fulfilled' ? audius.value : [];
      const nList = netease.status === 'fulfilled' ? netease.value : [];
      const qList = qq.status === 'fulfilled' ? qq.value : [];
      this.playlist = [...nList, ...qList, ...aList];
      if (!this.playlist.length) this.playlist = GENERATED;
      this.idx = 0;
      this.renderList();
      this.updateTrack();
    }

    async _searchAudius(q) {
      try {
        const res = await fetch(`${AUDIUS_API}/tracks/search?query=${encodeURIComponent(q)}&limit=20&app_name=${APP_NAME}`);
        const data = await res.json();
        return (data.data || []).map(t => this.mapTrack(t));
      } catch { return []; }
    }

    async _searchNetease(q) {
      try {
        const res = await fetch(`https://music.163.com/api/search/get?s=${encodeURIComponent(q)}&type=1&limit=20&offset=0`, {
          headers: { 'Referer': 'https://music.163.com' }
        });
        const data = await res.json();
        return (data.result?.songs || []).map(s => ({
          id: `ne_${s.id}`, title: s.name,
          artist: s.artists?.[0]?.name || '未知', genre: '华语', mood: '',
          duration: Math.round((s.duration || 0) / 1000),
          artwork: s.album?.picUrl ? s.album.picUrl + '?param=300y300' : '',
          type: 'netease', neId: s.id, neName: s.name, neArtist: s.artists?.[0]?.name || '',
        }));
      } catch { return []; }
    }

    async _searchQQ(q) {
      try {
        const res = await fetch(`https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=${encodeURIComponent(q)}&format=json&limit=20`);
        const data = await res.json();
        return (data.data?.song?.list || []).map(s => ({
          id: `qq_${s.songid}`, title: s.songname,
          artist: s.singer?.[0]?.name || '未知', genre: '华语', mood: '',
          duration: s.interval || 0,
          artwork: s.albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${s.albummid}.jpg` : '',
          type: 'qq',
        }));
      } catch { return []; }
    }

    mapTrack(t) {
      return {
        id: t.id, title: t.title, artist: t.user?.name || 'Unknown',
        genre: t.genre || '', mood: t.mood || '', duration: t.duration || 0,
        artwork: t.artwork?.['480x480'] || t.artwork?.['150x150'] || '',
        type: 'audius',
      };
    }

    // ===== 播放控制 =====
    async play(i) {
      if (i !== undefined) this.idx = i;
      const t = this.playlist[this.idx];
      if (!t) return;
      this.stopGen();
      if (t.type === 'generated') { this.playGen(t.style); this.playing = true; this.updateUI(); return; }
      if (t.type === 'netease' || t.type === 'qq') { await this.playCN(t); return; }
      try {
        this.audio.src = `${AUDIUS_API}/tracks/${t.id}/stream?app_name=${APP_NAME}`;
        await this.audio.play();
        this.playing = true;
        this.setupVisualizer();
      } catch (e) { console.error('Play failed:', e); this.playing = false; }
      this.updateUI();
      this.updateMediaSession();
    }

    toggle() {
      if (this.playing) { this.audio.pause(); this.stopGen(); this.playing = false; }
      else { this.play(); }
      this.updateUI();
    }

    prev() { this.idx = this.shuffle ? Math.random()*this.playlist.length|0 : (this.idx-1+this.playlist.length)%this.playlist.length; this.play(); }
    next() {
      if (this.repeat==='one') { this.play(); return; }
      this.idx = this.shuffle ? Math.random()*this.playlist.length|0 : (this.idx+1)%this.playlist.length;
      this.play();
    }
    playAll() { if (!this.playlist.length) return; this.idx = 0; this.play(); }
    shufflePlay() { if (!this.playlist.length) return; this.shuffle = true; this.idx = Math.random()*this.playlist.length|0; this.play(); this.updateUI(); }
    handleEnded() { if (this.repeat==='one') this.play(); else if (this.repeat==='all'||this.idx<this.playlist.length-1) this.next(); else { this.playing=false; this.updateUI(); } }
    seek(e) { const r=e.currentTarget.getBoundingClientRect(); this.audio.currentTime=((e.clientX-r.left)/r.width)*(this.audio.duration||0); }
    setVolume(v) { this.volume=parseFloat(v); this.audio.volume=this.muted?0:this.volume; this.updateUI(); }
    toggleMute() { this.muted=!this.muted; this.audio.volume=this.muted?0:this.volume; this.updateUI(); }
    toggleShuffle() { this.shuffle=!this.shuffle; this.updateUI(); }
    toggleRepeat() { const m=['off','all','one']; this.repeat=m[(m.indexOf(this.repeat)+1)%3]; this.updateUI(); }
    toggleFav() { const t=this.playlist[this.idx]; if(!t)return; const i=this.favs.indexOf(t.id); if(i>=0){this.favs.splice(i,1); this._dbRemoveFav(t.id); } else { this.favs.push(t.id); this._dbAddFav(t); } localStorage.setItem('fm_fav',JSON.stringify(this.favs)); this.updateUI(); }
    _getVisitorId() { let id=localStorage.getItem('vid'); if(!id){id='v_'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('vid',id);} return id; }
    async syncFavsFromDb() { try { const r=await fetch(`/api/favorites?visitor_id=${this._getVisitorId()}&type=music`); const j=await r.json(); if(j.ok&&j.data?.length){ const ids=j.data.map(d=>d.item_id); const merged=[...new Set([...ids,...this.favs])]; this.favs=merged; localStorage.setItem('fm_fav',JSON.stringify(merged)); this.updateUI(); } } catch{} }
    async _dbAddFav(t) { try { await fetch('/api/favorites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor_id:this._getVisitorId(),type:'music',item_id:String(t.id),data:{title:t.title,artist:t.artist,artwork:t.artwork}})}); } catch{} }
    async _dbRemoveFav(id) { try { await fetch(`/api/favorites?visitor_id=${this._getVisitorId()}&item_id=${id}`,{method:'DELETE'}); } catch{} }

    // ===== Web Audio 可视化 =====
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

    // ===== Web Audio 生成 =====
    playGen(style) { this.stopGen(); const ac=new(window.AudioContext||window.webkitAudioContext)(); this.ctx=ac; const g=ac.createGain(); g.gain.value=this.volume; g.connect(ac.destination); const n=ac.currentTime; if(style==='lofi')this._genLofi(ac,g,n); else if(style==='jazz')this._genJazz(ac,g,n); else this._genRain(ac,g,n); this.genNodes={ac}; }
    _genLofi(ac,g,n) { [[261.63,329.63,392],[220,277.18,329.63],[246.94,311.13,369.99],[196,246.94,293.66]].forEach((c,ci)=>c.forEach(f=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=f;const gn=ac.createGain();gn.gain.value=0;o.connect(gn);gn.connect(g);o.start(n+ci*2);gn.gain.linearRampToValueAtTime(0.15,n+ci*2+0.5);gn.gain.linearRampToValueAtTime(0,n+ci*2+2);o.stop(n+ci*2+2.1);})); }
    _genJazz(ac,g,n) { [[261.63,329.63,392,493.88],[220,277.18,329.63,415.3],[246.94,311.13,369.99,466.16],[196,246.94,293.66,369.99]].forEach((c,ci)=>c.forEach(f=>{const o=ac.createOscillator();o.type='sine';o.frequency.value=f;const gn=ac.createGain();gn.gain.value=0;o.connect(gn);gn.connect(g);o.start(n+ci*2.5);gn.gain.linearRampToValueAtTime(0.12,n+ci*2.5+0.3);gn.gain.linearRampToValueAtTime(0,n+ci*2.5+2.5);o.stop(n+ci*2.5+2.6);})); }
    _genRain(ac,g,n) { const buf=ac.createBuffer(2,ac.sampleRate*4,ac.sampleRate); for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*0.3*0.4+(Math.random()>0.997?Math.random()*0.5:0);} const s=ac.createBufferSource();s.buffer=buf;s.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=2000;f.Q.value=0.5;const gn=ac.createGain();gn.gain.value=0.12;s.connect(f);f.connect(gn);gn.connect(g);s.start(n); }
    stopGen() { if(this.ctx){try{this.ctx.close();}catch{}} this.ctx=null; this.analyser=null; }

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

    // ===== 键盘快捷键 =====
    bindKeys() {
      document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.code === 'Space') { e.preventDefault(); this.toggle(); }
        else if (e.code === 'ArrowRight') this.audio.currentTime += 5;
        else if (e.code === 'ArrowLeft') this.audio.currentTime -= 5;
        else if (e.code === 'ArrowUp') { e.preventDefault(); this.setVolume(Math.min(1, this.volume + 0.1)); }
        else if (e.code === 'ArrowDown') { e.preventDefault(); this.setVolume(Math.max(0, this.volume - 0.1)); }
        else if (e.code === 'KeyN') this.next();
        else if (e.code === 'KeyP') this.prev();
      });
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
      const genre = this.el.querySelector('.track-genre');
      if (art) { art.style.backgroundImage = t.artwork ? `url(${t.artwork})` : 'none'; }
      if (title) title.textContent = t.title;
      if (artist) artist.textContent = t.artist;
      if (genre) genre.textContent = t.genre + (t.mood ? ` · ${t.mood}` : '');
      this.el.querySelectorAll('.pl-item').forEach((el, i) => el.classList.toggle('active', i === this.idx));
    }
    updateUI() {
      this.updateTrack();
      const btn = this.el.querySelector('.ctrl-play');
      const fav = this.el.querySelector('.ctrl-fav');
      const sh = this.el.querySelector('.ctrl-shuffle');
      const rp = this.el.querySelector('.ctrl-repeat');
      const mt = this.el.querySelector('.ctrl-mute');
      const disc = this.el.querySelector('.disc');
      if (btn) btn.innerHTML = this.playing ? '⏸' : '▶';
      if (fav) fav.innerHTML = this.favs.includes(this.playlist[this.idx]?.id) ? '❤️' : '🤍';
      if (sh) sh.classList.toggle('on', this.shuffle);
      if (rp) { rp.classList.toggle('on', this.repeat!=='off'); rp.innerHTML = this.repeat==='one' ? '🔂' : '🔁'; }
      if (mt) mt.innerHTML = this.muted ? '🔇' : this.volume>0.5 ? '🔊' : '🔉';
      if (disc) disc.classList.toggle('spin', this.playing);
    }
    showLoading() {
      const list = this.el.querySelector('.pl-list');
      if (list) list.innerHTML = '<div style="text-align:center;padding:40px;color:#666">🎵 加载中...</div>';
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

    // ===== 网易云音乐榜单 =====
    async loadNeteasePlaylist(plId) {
      this.showLoading();
      try {
        const res = await fetch(`https://music.163.com/api/playlist/detail?id=${plId}`, {
          headers: { 'Referer': 'https://music.163.com' }
        });
        const data = await res.json();
        const tracks = data.result?.tracks || data.playlist?.tracks || [];
        this.playlist = tracks.slice(0, 30).map(t => ({
          id: `ne_${t.id}`, title: t.name,
          artist: t.artists?.[0]?.name || '未知', genre: '华语', mood: '',
          duration: Math.round((t.duration || 0) / 1000),
          artwork: t.album?.picUrl ? t.album.picUrl + '?param=300y300' : '',
          type: 'netease', neId: t.id, neName: t.name, neArtist: t.artists?.[0]?.name || '',
        }));
        if (!this.playlist.length) this.playlist = GENERATED;
        this.idx = 0;
        this.renderList();
        this.updateTrack();
      } catch (e) {
        console.error('NetEase playlist failed:', e);
        this.playlist = GENERATED;
        this.renderList();
      }
    }

    renderNecards() {
      const list = this.el.querySelector('.pl-list');
      if (!list) return;
      list.innerHTML = `
        <div style="padding:12px 16px;font-size:.75rem;color:#888">选择榜单，歌曲通过 Audius 播放</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;padding:0 12px 12px">
          ${NETEASE_PLAYLISTS.map(p => `
            <div class="ne-card" data-id="${p.id}" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px;cursor:pointer;transition:all .2s">
              <div style="font-size:1.2rem">${p.icon}</div>
              <div style="font-size:.8rem;font-weight:600;margin-top:4px">${p.name}</div>
              <div style="font-size:.6rem;color:#888;margin-top:2px">${p.desc}</div>
            </div>
          `).join('')}
        </div>
      `;
      list.querySelectorAll('.ne-card').forEach(el => {
        el.onclick = () => this.loadNeteasePlaylist(+el.dataset.id);
        el.onmouseenter = () => el.style.borderColor = '#646cff';
        el.onmouseleave = () => el.style.borderColor = 'rgba(255,255,255,.06)';
      });
    }

    // 播放中文歌曲：通过 Audius 搜索同名歌曲
    async playCN(t) {
      try {
        const q = `${t.neName || t.title} ${t.neArtist || t.artist}`;
        const res = await fetch(`${AUDIUS_API}/tracks/search?query=${encodeURIComponent(q)}&limit=5&app_name=${APP_NAME}`);
        const data = await res.json();
        const found = data.data?.[0];
        if (found) {
          this.playlist[this.idx] = this.mapTrack(found);
          this.play();
        } else {
          const list = this.el.querySelector('.pl-list');
          if (list) {
            const item = list.querySelector(`.pl-item[data-idx="${this.idx}"]`);
            if (item) {
              const info = item.querySelector('.pl-artist');
              if (info) info.textContent = '⚠️ Audius 无此歌曲';
            }
          }
        }
      } catch (e) { console.error('PlayCN failed:', e); }
    }

    switchTab(tab) {
      this.tab = tab;
      this.el.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      const searchBox = this.el.querySelector('.search-box');
      const genreBar = this.el.querySelector('.genre-bar');
      if (searchBox) searchBox.style.display = tab === 'search' ? 'flex' : 'none';
      if (genreBar) genreBar.style.display = tab === 'genre' ? 'flex' : 'none';
      if (tab === 'trending') this.loadTrending();
      else if (tab === 'cn') { this.renderNecards(); }
      else if (tab === 'genre') { /* show genre chips */ }
      else if (tab === 'fav') { this.playlist = GENERATED.filter(t => this.favs.includes(t.id)).concat(this.playlist.filter(t => this.favs.includes(t.id))); this.renderList(); }
    }

    // ===== 渲染 =====
    render() {
      this.el.innerHTML = `
      <style>
        .mp-wrap{background:linear-gradient(135deg,#0f0f1e 0%,#1a0f2e 50%,#0f0f1e 100%);border:1px solid rgba(255,255,255,0.08);border-radius:20px;overflow:hidden;font-family:'LXGW WenKai',-apple-system,sans-serif;color:#e8e8e8;max-width:480px;width:100%;margin:0 auto}
        .mp-header{padding:20px 20px 0;display:flex;align-items:center;gap:10px}
        .mp-header h2{font-size:1rem;font-weight:700;margin:0}
        .mp-header .badge{font-size:.65rem;background:rgba(100,108,255,.2);color:#646cff;padding:2px 8px;border-radius:6px}
        /* 唱片区域 */
        .disc-area{padding:24px 20px;text-align:center;position:relative}
        .disc{width:180px;height:180px;border-radius:50%;margin:0 auto;position:relative;transition:transform .3s}
        .disc.spin{animation:spin 4s linear infinite}
        @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
        .disc-art{width:100%;height:100%;border-radius:50%;background-size:cover;background-position:center;background-color:#1a1a2e;box-shadow:0 0 40px rgba(100,108,255,.2)}
        .disc-hole{position:absolute;top:50%;left:50%;width:20px;height:20px;border-radius:50%;background:#0a0a0a;transform:translate(-50%,-50%);border:2px solid #2a2a2a}
        .track-info{text-align:center;margin-top:14px}
        .track-title{font-size:1rem;font-weight:700;margin-bottom:2px}
        .track-artist{font-size:.8rem;color:#888}
        .track-genre{font-size:.7rem;color:#646cff;margin-top:4px}
        /* 频谱可视化 */
        .visualizer{display:flex;justify-content:center;gap:2px;height:40px;align-items:flex-end;margin-top:10px}
        .vis-bar{width:4px;border-radius:2px;background:linear-gradient(to top,#646cff,#ff6b9d);transition:height .05s;min-height:3px}
        /* 进度条 */
        .prog-area{padding:0 20px;margin-top:8px}
        .prog-bar{height:4px;background:rgba(255,255,255,.08);border-radius:2px;cursor:pointer;position:relative}
        .prog-fill{height:100%;background:linear-gradient(90deg,#646cff,#ff6b9d);border-radius:2px;transition:width .1s;width:0}
        .prog-time{display:flex;justify-content:space-between;font-size:.65rem;color:#666;margin-top:4px}
        /* 控制按钮 */
        .controls{display:flex;align-items:center;justify-content:center;gap:16px;padding:12px 20px}
        .ctrl-btn{background:none;border:none;color:#e8e8e8;font-size:1.1rem;cursor:pointer;padding:6px;border-radius:8px;transition:all .2s}
        .ctrl-btn:hover{background:rgba(255,255,255,.08)}
        .ctrl-btn.on{color:#646cff}
        .ctrl-play{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;color:#fff;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(100,108,255,.3);transition:transform .2s}
        .ctrl-play:hover{transform:scale(1.05)}
        /* 音量 */
        .vol-area{display:flex;align-items:center;gap:8px;padding:0 20px 12px}
        .vol-area input[type=range]{flex:1;height:3px;accent-color:#646cff}
        /* 标签页 */
        .tabs{display:flex;gap:4px;padding:0 16px;border-bottom:1px solid rgba(255,255,255,.06)}
        .tab-btn{background:none;border:none;color:#666;font-size:.75rem;padding:8px 12px;cursor:pointer;border-bottom:2px solid transparent;transition:all .2s}
        .tab-btn:hover{color:#e8e8e8}
        .tab-btn.active{color:#646cff;border-bottom-color:#646cff}
        /* 搜索 */
        .search-box{display:none;padding:12px 16px;gap:8px}
        .search-box input{flex:1;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#e8e8e8;font-size:.8rem;font-family:inherit;outline:none}
        .search-box input:focus{border-color:#646cff}
        .search-box button{background:#646cff;border:none;border-radius:8px;padding:8px 14px;color:#fff;cursor:pointer;font-size:.8rem}
        /* 分类标签 */
        .genre-bar{display:none;padding:8px 16px;gap:6px;overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch}
        .genre-bar::-webkit-scrollbar{display:none}
        .genre-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:4px 12px;font-size:.7rem;color:#aaa;cursor:pointer;white-space:nowrap;transition:all .2s;flex-shrink:0}
        .genre-chip:hover,.genre-chip.active{background:rgba(100,108,255,.15);border-color:#646cff;color:#646cff}
        /* 播放列表 */
        .pl-list{max-height:280px;overflow-y:auto;padding:8px 0}
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
        /* 底部 */
        .mp-footer{text-align:center;padding:10px;font-size:.6rem;color:#444;border-top:1px solid rgba(255,255,255,.04)}
        @media(max-width:480px){.mp-wrap{border-radius:12px;margin:0 8px}.disc{width:140px;height:140px}}
      </style>
      <div class="mp-wrap">
        <div class="mp-header">
          <h2>🐟 音乐台</h2>
          <span class="badge">Audius + 网易/QQ</span>
        </div>
        <div class="disc-area">
          <div class="disc"><div class="disc-art"></div><div class="disc-hole"></div></div>
          <div class="track-info">
            <div class="track-title">加载中...</div>
            <div class="track-artist">—</div>
            <div class="track-genre"></div>
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
        <div class="vol-area">
          <button class="ctrl-btn ctrl-mute" onclick="this.closest('.mp-wrap').__player.toggleMute()" style="font-size:.9rem">🔊</button>
          <input type="range" min="0" max="1" step="0.05" value="0.6" oninput="this.closest('.mp-wrap').__player.setVolume(this.value)">
        </div>
        <div class="tabs">
          <button class="tab-btn active" data-tab="trending" onclick="this.closest('.mp-wrap').__player.switchTab('trending')">🔥 热门</button>
          <button class="tab-btn" data-tab="cn" onclick="this.closest('.mp-wrap').__player.switchTab('cn')">🇨🇳 中文</button>
          <button class="tab-btn" data-tab="search" onclick="this.closest('.mp-wrap').__player.switchTab('search')">🔍 搜索</button>
          <button class="tab-btn" data-tab="genre" onclick="this.closest('.mp-wrap').__player.switchTab('genre')">🎸 分类</button>
          <button class="tab-btn" data-tab="fav" onclick="this.closest('.mp-wrap').__player.switchTab('fav')">❤️ 收藏</button>
        </div>
        <div class="search-box">
          <input placeholder="搜索歌曲、歌手..." onkeydown="if(event.key==='Enter')this.closest('.mp-wrap').__player.searchTracks(this.value)">
          <button onclick="this.closest('.mp-wrap').__player.searchTracks(this.previousElementSibling.value)">🔍</button>
        </div>
        <div class="genre-bar">${GENRES.map(g=>`<span class="genre-chip" onclick="this.closest('.mp-wrap').__player.loadTrending('${g}')">${g}</span>`).join('')}</div>
        <div style="display:flex;gap:8px;padding:0 16px 8px">
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.playAll()" style="font-size:.75rem;background:rgba(100,108,255,.15);border:1px solid rgba(100,108,255,.3);border-radius:6px;padding:4px 10px;cursor:pointer">▶ 播放全部</button>
          <button class="ctrl-btn" onclick="this.closest('.mp-wrap').__player.shufflePlay()" style="font-size:.75rem;background:rgba(255,107,157,.15);border:1px solid rgba(255,107,157,.3);border-radius:6px;padding:4px 10px;cursor:pointer">🔀 随机播放</button>
        </div>
        <div class="pl-list"><div style="text-align:center;padding:40px;color:#666">🎵 加载中...</div></div>
        <div class="mp-footer">🐟 小鱼儿音乐台 · Powered by Audius · 空格播放/暂停</div>
      </div>`;

      this.el.querySelector('.mp-wrap').__player = this;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishMusicPlayer());
  else new FishMusicPlayer();
})();
