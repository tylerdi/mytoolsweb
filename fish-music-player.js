/**
 * 小鱼儿网站音乐播放器 🐟🎵
 * 多源音乐：Web Audio 生成 + Pixabay + Jamendo + Freesound
 * 精致 UI，进度条，音量控制，播放列表
 * 用法：<div id="fish-music-player"></div><script src="/fish-music-player.js"></script>
 */

(function () {
  'use strict';

  // ============ 音乐库 ============
  const MUSIC_SOURCES = {
    // Web Audio 生成式音乐
    generated: [
      { id: 'g1', title: 'Lo-fi Dreams', artist: 'AI 生成', genre: 'Lo-fi', type: 'generated', style: 'lofi' },
      { id: 'g2', title: 'Jazz Night', artist: 'AI 生成', genre: 'Jazz', type: 'generated', style: 'jazz' },
      { id: 'g3', title: 'Rain & Thunder', artist: 'AI 生成', genre: '环境音', type: 'generated', style: 'rain' },
    ],
    // Pixabay (免费商用)
    pixabay: [
      { id: 'p1', title: 'Inspiring Cinematic', artist: 'Pixabay', genre: 'Cinematic', type: 'url', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3' },
      { id: 'p2', title: 'Upbeat Fun', artist: 'Pixabay', genre: 'Upbeat', type: 'url', url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3' },
    ],
    // Jamendo (免费独立音乐)
    jamendo: [
      { id: 'j1', title: 'Ambient Flow', artist: 'Jamendo', genre: 'Ambient', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810608/mp32' },
      { id: 'j2', title: 'Chill Wave', artist: 'Jamendo', genre: 'Chill', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810615/mp32' },
      { id: 'j3', title: 'Deep Focus', artist: 'Jamendo', genre: 'Focus', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810620/mp32' },
      { id: 'j4', title: 'Ethereal Mind', artist: 'Jamendo', genre: 'Ethereal', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810625/mp32' },
      { id: 'j5', title: 'Gentle Breeze', artist: 'Jamendo', genre: 'Calm', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810645/mp32' },
      { id: 'j6', title: 'Morning Light', artist: 'Jamendo', genre: 'Morning', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810650/mp32' },
      { id: 'j7', title: 'Night Walk', artist: 'Jamendo', genre: 'Night', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810655/mp32' },
      { id: 'j8', title: 'Ocean Waves', artist: 'Jamendo', genre: 'Nature', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810660/mp32' },
      { id: 'j9', title: 'Peaceful Mind', artist: 'Jamendo', genre: 'Peaceful', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810665/mp32' },
      { id: 'j10', title: 'Soft Piano', artist: 'Jamendo', genre: 'Piano', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810670/mp32' },
      { id: 'j11', title: 'Summer Vibes', artist: 'Jamendo', genre: 'Summer', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810675/mp32' },
      { id: 'j12', title: 'Dream State', artist: 'Jamendo', genre: 'Dream', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810680/mp32' },
      { id: 'j13', title: 'Electric Soul', artist: 'Jamendo', genre: 'Electronic', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810685/mp32' },
      { id: 'j14', title: 'Cosmic Journey', artist: 'Jamendo', genre: 'Space', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810690/mp32' },
      { id: 'j15', title: 'Forest Rain', artist: 'Jamendo', genre: 'Nature', type: 'url', url: 'https://mp3d.jamendo.com/download/track/1810695/mp32' },
    ],
    // Freesound (CC 协议)
    freesound: [
      { id: 'f1', title: 'Ambient Pad', artist: 'Freesound', genre: 'Ambient', type: 'url', url: 'https://cdn.freesound.org/previews/612/612095_5674468-lq.mp3' },
      { id: 'f2', title: 'Soft Texture', artist: 'Freesound', genre: 'Texture', type: 'url', url: 'https://cdn.freesound.org/previews/131/131660_2398403-lq.mp3' },
      { id: 'f3', title: 'Gentle Tone', artist: 'Freesound', genre: 'Tone', type: 'url', url: 'https://cdn.freesound.org/previews/131/131662_2398403-lq.mp3' },
    ],
  };

  // 合并所有音乐
  const ALL_MUSIC = [
    ...MUSIC_SOURCES.generated,
    ...MUSIC_SOURCES.pixabay,
    ...MUSIC_SOURCES.jamendo,
    ...MUSIC_SOURCES.freesound,
  ];

  class FishMusicPlayer {
    constructor() {
      this.container = document.getElementById('fish-music-player');
      this.audio = new Audio();
      this.audio.preload = 'metadata';
      this.playlist = ALL_MUSIC;
      this.currentIdx = 0;
      this.isPlaying = false;
      this.volume = 0.5;
      this.isMuted = false;
      this.isShuffled = false;
      this.repeatMode = 'none';
      this.ctx = null;
      this.genNodes = {};
      this.currentTab = 'all';
      this.favorites = JSON.parse(localStorage.getItem('fish_music_fav') || '[]');

      this.audio.volume = this.volume;
      this.audio.addEventListener('timeupdate', () => this.updateProgress());
      this.audio.addEventListener('ended', () => this.handleEnded());
      this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
      this.audio.addEventListener('error', () => setTimeout(() => this.next(), 500));

      if (this.container) this.render();
    }

    // ============ 播放控制 ============

    play(idx) {
      if (idx !== undefined) this.currentIdx = idx;
      const track = this.playlist[this.currentIdx];
      if (!track) return;

      // 停止当前播放
      this.stopGenerated();
      this.audio.pause();

      if (track.type === 'generated') {
        this.playGenerated(track.style);
      } else {
        this.audio.src = track.url;
        this.audio.play().then(() => {
          this.isPlaying = true;
          this.updateUI();
        }).catch(e => {
          console.error('Play failed:', e);
          this.isPlaying = false;
          this.updateUI();
        });
      }
      this.isPlaying = true;
      this.updateUI();
      this.updateMediaSession();
    }

    togglePlay() {
      if (this.isPlaying) {
        const track = this.playlist[this.currentIdx];
        if (track?.type === 'generated') {
          this.stopGenerated();
        } else {
          this.audio.pause();
        }
        this.isPlaying = false;
      } else {
        this.play();
      }
      this.updateUI();
    }

    prev() {
      if (this.isShuffled) {
        this.currentIdx = Math.floor(Math.random() * this.playlist.length);
      } else {
        this.currentIdx = (this.currentIdx - 1 + this.playlist.length) % this.playlist.length;
      }
      this.play();
    }

    next() {
      if (this.repeatMode === 'one') { this.play(); return; }
      if (this.isShuffled) {
        this.currentIdx = Math.floor(Math.random() * this.playlist.length);
      } else {
        this.currentIdx = (this.currentIdx + 1) % this.playlist.length;
      }
      this.play();
    }

    handleEnded() {
      if (this.repeatMode === 'one') { this.play(); return; }
      if (this.repeatMode === 'all' || this.currentIdx < this.playlist.length - 1) {
        this.next();
      } else {
        this.isPlaying = false;
        this.updateUI();
      }
    }

    seek(e) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      this.audio.currentTime = (x / rect.width) * (this.audio.duration || 0);
    }

    setVolume(val) {
      this.volume = parseFloat(val);
      this.audio.volume = this.isMuted ? 0 : this.volume;
      if (this.ctx?.masterGain) this.ctx.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.updateUI();
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      this.audio.volume = this.isMuted ? 0 : this.volume;
      if (this.ctx?.masterGain) this.ctx.masterGain.gain.value = this.isMuted ? 0 : this.volume;
      this.updateUI();
    }

    toggleShuffle() { this.isShuffled = !this.isShuffled; this.updateUI(); }

    toggleRepeat() {
      const modes = ['none', 'all', 'one'];
      this.repeatMode = modes[(modes.indexOf(this.repeatMode) + 1) % 3];
      this.updateUI();
    }

    toggleFav() {
      const track = this.playlist[this.currentIdx];
      if (!track) return;
      const i = this.favorites.indexOf(track.id);
      if (i >= 0) this.favorites.splice(i, 1);
      else this.favorites.push(track.id);
      localStorage.setItem('fish_music_fav', JSON.stringify(this.favorites));
      this.updateUI();
    }

    switchTab(tab) {
      this.currentTab = tab;
      if (tab === 'all') this.playlist = ALL_MUSIC;
      else if (tab === 'generated') this.playlist = MUSIC_SOURCES.generated;
      else if (tab === 'pixabay') this.playlist = MUSIC_SOURCES.pixabay;
      else if (tab === 'jamendo') this.playlist = MUSIC_SOURCES.jamendo;
      else if (tab === 'freesound') this.playlist = MUSIC_SOURCES.freesound;
      else if (tab === 'fav') this.playlist = ALL_MUSIC.filter(t => this.favorites.includes(t.id));
      this.currentIdx = 0;
      this.render();
    }

    // ============ Web Audio 生成式音乐 ============

    initAudioCtx() {
      if (this.ctx?.audioCtx) return;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const masterGain = audioCtx.createGain();
      masterGain.gain.value = this.volume;
      masterGain.connect(audioCtx.destination);
      this.ctx = { audioCtx, masterGain };
    }

    playGenerated(style) {
      this.stopGenerated();
      this.initAudioCtx();
      const { audioCtx, masterGain } = this.ctx;
      const now = audioCtx.currentTime;

      if (style === 'lofi') this._genLofi(now);
      else if (style === 'jazz') this._genJazz(now);
      else if (style === 'rain') this._genRain(now);
    }

    _genLofi(now) {
      const { audioCtx, masterGain } = this.ctx;
      const chords = [[261.63,329.63,392],[220,277.18,329.63],[246.94,311.13,369.99],[196,246.94,293.66]];
      const oscs = [];
      chords.forEach((c, ci) => {
        c.forEach(f => {
          const o = audioCtx.createOscillator();
          o.type = 'sine'; o.frequency.value = f;
          const g = audioCtx.createGain(); g.gain.value = 0;
          o.connect(g); g.connect(masterGain);
          o.start(now + ci * 2);
          g.gain.linearRampToValueAtTime(0.2, now + ci * 2 + 0.5);
          g.gain.linearRampToValueAtTime(0, now + ci * 2 + 2);
          o.stop(now + ci * 2 + 2.1);
          oscs.push(o);
        });
      });
      const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.15;
      const ns = audioCtx.createBufferSource(); ns.buffer = buf; ns.loop = true;
      const lpf = audioCtx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 800;
      const ng = audioCtx.createGain(); ng.gain.value = 0.05;
      ns.connect(lpf); lpf.connect(ng); ng.connect(masterGain); ns.start(now);
      this.genNodes = { oscs, noise: ns };
    }

    _genJazz(now) {
      const { audioCtx, masterGain } = this.ctx;
      const chords = [[261.63,329.63,392,493.88],[220,277.18,329.63,415.3],[246.94,311.13,369.99,466.16],[196,246.94,293.66,369.99]];
      const oscs = [];
      chords.forEach((c, ci) => {
        c.forEach(f => {
          const o = audioCtx.createOscillator();
          o.type = 'sine'; o.frequency.value = f;
          const g = audioCtx.createGain(); g.gain.value = 0;
          o.connect(g); g.connect(masterGain);
          o.start(now + ci * 2.5);
          g.gain.linearRampToValueAtTime(0.18, now + ci * 2.5 + 0.3);
          g.gain.linearRampToValueAtTime(0, now + ci * 2.5 + 2.5);
          o.stop(now + ci * 2.5 + 2.6);
          oscs.push(o);
        });
      });
      this.genNodes = { oscs };
    }

    _genRain(now) {
      const { audioCtx, masterGain } = this.ctx;
      const buf = audioCtx.createBuffer(2, audioCtx.sampleRate * 4, audioCtx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = buf.getChannelData(ch);
        for (let i = 0; i < d.length; i++) {
          const drop = Math.random() > 0.997 ? Math.random() * 0.5 : 0;
          d[i] = (Math.random() * 2 - 1) * 0.3 * 0.4 + drop;
        }
      }
      const src = audioCtx.createBufferSource(); src.buffer = buf; src.loop = true;
      const bpf = audioCtx.createBiquadFilter(); bpf.type = 'bandpass'; bpf.frequency.value = 2000; bpf.Q.value = 0.5;
      const g = audioCtx.createGain(); g.gain.value = 0.15;
      src.connect(bpf); bpf.connect(g); g.connect(masterGain); src.start(now);
      this.genNodes = { rain: src };
    }

    stopGenerated() {
      Object.values(this.genNodes).forEach(n => {
        if (Array.isArray(n)) n.forEach(o => { try { o.stop(); } catch {} });
        else try { n.stop(); } catch {}
      });
      this.genNodes = {};
    }

    // ============ UI ============

    formatTime(s) {
      if (isNaN(s)) return '0:00';
      return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
    }

    updateProgress() {
      const fill = document.getElementById('mp-progress-fill');
      const time = document.getElementById('mp-time');
      if (fill && this.audio.duration) fill.style.width = `${(this.audio.currentTime / this.audio.duration * 100).toFixed(1)}%`;
      if (time) time.textContent = `${this.formatTime(this.audio.currentTime)} / ${this.formatTime(this.audio.duration || 0)}`;
    }

    updateDuration() {
      const time = document.getElementById('mp-time');
      if (time) time.textContent = `0:00 / ${this.formatTime(this.audio.duration)}`;
    }

    updateMediaSession() {
      if (!('mediaSession' in navigator)) return;
      const t = this.playlist[this.currentIdx];
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: t.artist, album: '小鱼儿 BGM' });
      navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => this.prev());
      navigator.mediaSession.setActionHandler('nexttrack', () => this.next());
    }

    updateUI() {
      const btn = document.getElementById('mp-play-btn');
      const favBtn = document.getElementById('mp-fav-btn');
      const title = document.getElementById('mp-title');
      const artist = document.getElementById('mp-artist');
      const shuffleBtn = document.getElementById('mp-shuffle');
      const repeatBtn = document.getElementById('mp-repeat');
      const muteBtn = document.getElementById('mp-mute');
      const visual = document.getElementById('mp-visual');

      const track = this.playlist[this.currentIdx];
      if (btn) btn.innerHTML = this.isPlaying ? '⏸' : '▶';
      if (title && track) title.textContent = track.title;
      if (artist && track) artist.textContent = `${track.artist} · ${track.genre}`;
      if (favBtn) favBtn.innerHTML = this.favorites.includes(track?.id) ? '❤️' : '🤍';
      if (shuffleBtn) shuffleBtn.className = `mp-btn-icon ${this.isShuffled ? 'active' : ''}`;
      if (repeatBtn) {
        repeatBtn.className = `mp-btn-icon ${this.repeatMode !== 'none' ? 'active' : ''}`;
        repeatBtn.innerHTML = this.repeatMode === 'one' ? '🔂' : '🔁';
      }
      if (muteBtn) muteBtn.innerHTML = this.isMuted ? '🔇' : this.volume > 0.5 ? '🔊' : '🔉';
      if (visual) visual.querySelectorAll('.mp-bar').forEach(b => b.classList.toggle('playing', this.isPlaying));

      // 播放列表高亮
      this.container?.querySelectorAll('.mp-track').forEach((el, i) => {
        el.classList.toggle('active', i === this.currentIdx);
      });
    }

    render() {
      const track = this.playlist[this.currentIdx] || ALL_MUSIC[0];
      const tabs = [
        { id: 'all', icon: '🎵', name: '全部' },
        { id: 'generated', icon: '🤖', name: 'AI生成' },
        { id: 'jamendo', icon: '🎸', name: 'Jamendo' },
        { id: 'pixabay', icon: '🎬', name: 'Pixabay' },
        { id: 'freesound', icon: '🔉', name: 'Freesound' },
        { id: 'fav', icon: '❤️', name: '收藏' },
      ];

      this.container.innerHTML = `
        <style>
          .mp{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:20px;padding:0;max-width:420px;margin:0 auto;font-family:'LXGW WenKai',-apple-system,sans-serif;overflow:hidden}
          .mp-cover{height:160px;background:linear-gradient(135deg,#0f0c29,#302b63,#24243e);display:flex;align-items:center;justify-content:center;position:relative}
          .mp-cover .bars{display:flex;align-items:flex-end;gap:3px;height:80px}
          .mp-bar{width:4px;border-radius:2px;background:linear-gradient(180deg,var(--accent,#646cff),var(--gold,#d4a853));transition:height .15s}
          .mp-bar.playing{animation:mpBar .8s ease-in-out infinite alternate}
          @keyframes mpBar{from{height:8px}to{height:60px}}
          .mp-body{padding:16px 20px}
          .mp-info{text-align:center;margin-bottom:12px}
          .mp-title{font-size:1rem;font-weight:700;color:var(--text,#e8e8e8);margin-bottom:2px}
          .mp-artist{font-size:.75rem;color:var(--text-dim,#888)}
          .mp-progress{cursor:pointer;margin-bottom:12px}
          .mp-progress-bar{height:4px;background:var(--border,#2a2a2a);border-radius:2px;overflow:hidden}
          .mp-progress-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--accent,#646cff),var(--pink,#ff6b9d));transition:width .1s linear}
          .mp-time{display:flex;justify-content:space-between;font-size:.65rem;color:var(--text-dim,#888);margin-top:4px}
          .mp-controls{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px}
          .mp-btn{background:none;border:none;color:var(--text-dim,#888);font-size:1.1rem;cursor:pointer;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;transition:all .2s}
          .mp-btn:hover{color:var(--text,#e8e8e8);background:rgba(255,255,255,.08)}
          .mp-btn.active{color:var(--accent,#646cff)}
          .mp-btn-main{width:48px;height:48px;font-size:1.4rem;background:linear-gradient(135deg,var(--accent,#646cff),var(--pink,#ff6b9d));color:#fff;border-radius:50%;border:none;cursor:pointer;transition:all .2s}
          .mp-btn-main:hover{transform:scale(1.1)}
          .mp-btn-icon{background:none;border:none;color:var(--text-dim,#888);font-size:.9rem;cursor:pointer;padding:4px;border-radius:4px;transition:all .2s}
          .mp-btn-icon:hover{color:var(--text,#e8e8e8)}
          .mp-btn-icon.active{color:var(--accent,#646cff)}
          .mp-volume{display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:12px}
          .mp-volume input[type=range]{width:80px;accent-color:var(--accent,#646cff)}
          .mp-tabs{display:flex;gap:4px;overflow-x:auto;padding:0 20px 12px;-webkit-overflow-scrolling:touch}
          .mp-tab{background:#0a0a0a;border:1px solid var(--border,#2a2a2a);border-radius:8px;padding:5px 10px;font-size:.7rem;color:var(--text-dim,#888);cursor:pointer;white-space:nowrap;transition:all .2s;font-family:inherit}
          .mp-tab:hover{border-color:var(--accent,#646cff)}
          .mp-tab.active{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8);background:rgba(100,108,255,.1)}
          .mp-list{max-height:180px;overflow-y:auto;padding:0 20px 16px}
          .mp-track{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;cursor:pointer;transition:all .2s}
          .mp-track:hover{background:rgba(255,255,255,.04)}
          .mp-track.active{background:rgba(100,108,255,.1)}
          .mp-track .num{font-size:.7rem;color:var(--text-dim,#888);min-width:20px;text-align:center}
          .mp-track .info{flex:1;min-width:0}
          .mp-track .name{font-size:.8rem;color:var(--text,#e8e8e8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .mp-track .meta{font-size:.65rem;color:var(--text-muted,#555)}
          .mp-track .tag{font-size:.6rem;background:rgba(100,108,255,.15);color:var(--accent,#646cff);padding:1px 6px;border-radius:4px}
        </style>
        <div class="mp">
          <div class="mp-cover">
            <div class="bars" id="mp-visual">
              ${Array(24).fill(0).map((_, i) => `<div class="mp-bar ${this.isPlaying ? 'playing' : ''}" style="height:${8+Math.random()*30}px;animation-delay:${i*.04}s"></div>`).join('')}
            </div>
          </div>
          <div class="mp-body">
            <div class="mp-info">
              <div class="mp-title" id="mp-title">${track.title}</div>
              <div class="mp-artist" id="mp-artist">${track.artist} · ${track.genre}</div>
            </div>
            <div class="mp-progress" onclick="window.__mp.seek(event)">
              <div class="mp-progress-bar"><div class="mp-progress-fill" id="mp-progress-fill" style="width:0%"></div></div>
              <div class="mp-time"><span id="mp-time">0:00 / 0:00</span></div>
            </div>
            <div class="mp-controls">
              <button class="mp-btn-icon ${this.isShuffled?'active':''}" id="mp-shuffle" onclick="window.__mp.toggleShuffle()">🔀</button>
              <button class="mp-btn" onclick="window.__mp.prev()">⏮</button>
              <button class="mp-btn-main" id="mp-play-btn" onclick="window.__mp.togglePlay()">${this.isPlaying?'⏸':'▶'}</button>
              <button class="mp-btn" onclick="window.__mp.next()">⏭</button>
              <button class="mp-btn-icon ${this.repeatMode!=='none'?'active':''}" id="mp-repeat" onclick="window.__mp.toggleRepeat()">${this.repeatMode==='one'?'🔂':'🔁'}</button>
              <button class="mp-btn-icon" id="mp-fav-btn" onclick="window.__mp.toggleFav()">${this.favorites.includes(track.id)?'❤️':'🤍'}</button>
            </div>
            <div class="mp-volume">
              <button class="mp-btn" id="mp-mute" onclick="window.__mp.toggleMute()" style="width:24px;height:24px;font-size:.8rem">${this.isMuted?'🔇':this.volume>.5?'🔊':'🔉'}</button>
              <input type="range" min="0" max="1" step=".05" value="${this.volume}" oninput="window.__mp.setVolume(this.value)">
            </div>
          </div>
          <div class="mp-tabs">
            ${tabs.map(t => `<button class="mp-tab ${t.id===this.currentTab?'active':''}" onclick="window.__mp.switchTab('${t.id}')">${t.icon} ${t.name}</button>`).join('')}
          </div>
          <div class="mp-list">
            ${this.playlist.map((t, i) => `
              <div class="mp-track ${i===this.currentIdx?'active':''}" onclick="window.__mp.play(${i})">
                <div class="num">${i+1}</div>
                <div class="info">
                  <div class="name">${t.title}</div>
                  <div class="meta">${t.artist}</div>
                </div>
                <div class="tag">${t.genre}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      window.__mp = this;
    }
  }

  window.FishMusicPlayer = FishMusicPlayer;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { if (document.getElementById('fish-music-player')) new FishMusicPlayer(); });
  } else { if (document.getElementById('fish-music-player')) new FishMusicPlayer(); }
})();
