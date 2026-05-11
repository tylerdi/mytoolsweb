/**
 * 🐟 碳基圈音乐广场 — fish-ai6666-music.js
 * 热门推荐 + AI创作 + 我的歌单
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
      this._generating = false;
      this._pollTimer = null;
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
        console.log('[Music] Loaded', this.songs.length, 'songs');
      } catch(e) { console.error('[Music] Load failed:', e); this.songs = []; }
      this.renderList();
    }

    render() {
      this.el.innerHTML = `
      <style>
        .f6m-toast{position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(100,108,255,.9);color:#fff;padding:8px 20px;border-radius:20px;font-size:13px;z-index:9999;opacity:0;transition:opacity .3s;pointer-events:none}
        .f6m-toast.show{opacity:1}
        .f6m-wrap{background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;-webkit-overflow-scrolling:touch}
        .f6m-topbar{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#161616;border-bottom:1px solid #222}
        .f6m-tabs{display:flex;gap:4px}
        .f6m-tab{background:none;border:none;color:#888;padding:6px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:.2s}
        .f6m-tab:hover{color:#ccc;background:#222}
        .f6m-tab-active{color:#f0f;background:#1a0030}
        .f6m-badge{font-size:11px;color:#666;background:#1a1a1a;padding:3px 10px;border-radius:20px}
        .f6m-body{display:flex;flex-direction:column}
        .f6m-player{padding:20px;text-align:center;background:linear-gradient(180deg,#161616 0%,#111 100%)}
        .f6m-cover-box{position:relative;width:140px;height:140px;margin:0 auto 16px}
        .f6m-cover{width:100%;height:100%;border-radius:50%;background:#1a1a1a;display:flex;align-items:center;justify-content:center;font-size:48px;background-size:cover;background-position:center;transition:transform .3s}
        .f6m-viz{position:absolute;inset:-8px;display:flex;align-items:flex-end;justify-content:center;gap:3px;pointer-events:none;opacity:0;transition:.3s}
        .f6m-viz-active{opacity:1}
        .f6m-viz span{width:4px;background:linear-gradient(0deg,#f0f,#646cff);border-radius:2px;animation:vizBar .8s ease-in-out infinite alternate}
        .f6m-viz span:nth-child(1){height:20px;animation-delay:0s}
        .f6m-viz span:nth-child(2){height:30px;animation-delay:.1s}
        .f6m-viz span:nth-child(3){height:25px;animation-delay:.2s}
        .f6m-viz span:nth-child(4){height:35px;animation-delay:.15s}
        .f6m-viz span:nth-child(5){height:18px;animation-delay:.25s}
        @keyframes vizBar{0%{transform:scaleY(.4)}100%{transform:scaleY(1)}}
        .f6m-meta{margin-bottom:12px}
        .f6m-song-title{font-size:16px;font-weight:700;color:#eee;margin-bottom:4px}
        .f6m-song-artist{font-size:13px;color:#888}
        .f6m-song-artist a{color:#a78bfa;text-decoration:none}
        .f6m-tags{font-size:11px;color:#666;margin-top:4px}
        .f6m-progress{height:4px;background:#222;border-radius:2px;cursor:pointer;position:relative;margin:8px 0}
        .f6m-progress-fill{height:100%;background:linear-gradient(90deg,#f0f,#646cff);border-radius:2px;width:0;transition:width .1s}
        .f6m-progress-knob{position:absolute;top:50%;width:12px;height:12px;background:#fff;border-radius:50%;transform:translate(-50%,-50%);left:0;opacity:0;transition:opacity .2s}
        .f6m-progress:hover .f6m-progress-knob{opacity:1}
        .f6m-time{display:flex;justify-content:space-between;font-size:11px;color:#555;margin-bottom:12px}
        .f6m-ctrls{display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px}
        .f6m-btn{background:none;border:none;color:#ccc;font-size:20px;cursor:pointer;width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:.2s}
        .f6m-btn:hover{background:#222;color:#fff}
        .f6m-btn-play{font-size:24px;width:52px;height:52px;background:linear-gradient(135deg,#f0f,#646cff);color:#fff}
        .f6m-btn-play:hover{transform:scale(1.05)}
        .f6m-btn-sm{font-size:16px;width:36px;height:36px}
        .f6m-btn-on{color:#f0f}
        .f6m-vol{display:flex;align-items:center;justify-content:center;gap:8px}
        .f6m-vol-icon{font-size:14px;color:#666}
        .f6m-vol-bar{width:100px;accent-color:#f0f}
        .f6m-list{max-height:400px;overflow-y:auto;padding:8px}
        .f6m-list::-webkit-scrollbar{width:4px}
        .f6m-list::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        .f6m-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;cursor:pointer;transition:.2s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
        .f6m-item:hover,.f6m-item:active{background:#1a1a1a}
        .f6m-item-on{background:#1a0030}
        .f6m-item-img{width:44px;height:44px;border-radius:8px;object-fit:cover;flex-shrink:0}
        .f6m-item-body{flex:1;min-width:0}
        .f6m-item-name{font-size:14px;font-weight:600;color:#eee;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .f6m-item-sub{font-size:12px;color:#666;display:flex;gap:8px;margin-top:2px}
        .f6m-item-sub a{color:#a78bfa;text-decoration:none}
        .f6m-item-act{background:none;border:none;color:#666;font-size:16px;cursor:pointer;padding:6px;border-radius:50%;transition:.2s}
        .f6m-item-act:hover{color:#f0f;background:#222}
        .f6m-empty{text-align:center;padding:3rem;color:#555;font-size:14px}
        .f6m-loading{text-align:center;padding:3rem;color:#666}
        .f6m-spinner{width:32px;height:32px;border:3px solid #222;border-top-color:#f0f;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 12px}
        @keyframes spin{to{transform:rotate(360deg)}}
        /* 创作面板 */
        .f6m-create{padding:20px}
        .f6m-create-title{font-size:15px;font-weight:700;color:#eee;margin-bottom:12px}
        .f6m-create textarea{width:100%;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:10px;padding:12px;color:#eee;font-size:14px;resize:none;font-family:inherit;outline:none;transition:.2s}
        .f6m-create textarea:focus{border-color:#f0f}
        .f6m-create textarea::placeholder{color:#444}
        .f6m-create-row{display:flex;gap:8px;margin-top:10px}
        .f6m-create input[type=text]{flex:1;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;color:#eee;font-size:13px;outline:none}
        .f6m-create input[type=text]:focus{border-color:#f0f}
        .f6m-create input[type=text]::placeholder{color:#444}
        .f6m-create-btn{background:linear-gradient(135deg,#f0f,#646cff);color:#fff;border:none;padding:10px 24px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:.2s;margin-top:12px;width:100%}
        .f6m-create-btn:hover{transform:scale(1.02)}
        .f6m-create-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
        .f6m-create-status{margin-top:12px;padding:12px;background:#1a1a1a;border-radius:10px;font-size:13px;color:#888;display:none}
        .f6m-create-status.show{display:block}
        .f6m-create-status .pct{color:#f0f;font-weight:700}
        .f6m-create-quick{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
        .f6m-create-quick button{background:#1a1a1a;border:1px solid #2a2a2a;color:#888;padding:5px 12px;border-radius:20px;font-size:12px;cursor:pointer;transition:.2s}
        .f6m-create-quick button:hover{border-color:#f0f;color:#f0f}
        .f6m-create-check{display:flex;align-items:center;gap:6px;margin-top:8px;font-size:12px;color:#888}
        .f6m-create-check input{accent-color:#f0f}
        .f6m-lyrics-box{margin-top:12px;padding:12px;background:#1a1a1a;border-radius:10px;font-size:12px;color:#888;max-height:200px;overflow-y:auto;white-space:pre-wrap;line-height:1.8;display:none}
        .f6m-lyrics-box.show{display:block}
      </style>
      <div class="f6m-wrap">
        <div class="f6m-topbar">
          <div class="f6m-tabs">
            <button class="f6m-tab f6m-tab-active" data-tab="hall">🔥 热门</button>
            <button class="f6m-tab" data-tab="create">✨ 创作</button>
            <button class="f6m-tab" data-tab="mine">🎤 我的</button>
          </div>
          <span class="f6m-badge">AI 音乐 · ai6666.com</span>
        </div>
        <div class="f6m-body">
          <div class="f6m-player" id="f6m-player">
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
          <div class="f6m-create" id="f6m-create" style="display:none">
            <div class="f6m-create-title">🎵 描述你想要的歌</div>
            <textarea id="f6m-prompt" rows="4" maxlength="700" placeholder="例如：失恋后深夜听的伤感情歌，女声，慢节奏"></textarea>
            <div class="f6m-create-quick" id="f6m-quick">
              <button data-p="欢快的夏日海边歌曲，男声">🏖️ 夏日海边</button>
              <button data-p="安静的深夜钢琴曲，适合学习">🎹 深夜钢琴</button>
              <button data-p="中国风古筝，空灵飘渺">🏮 中国风</button>
              <button data-p="电子舞曲，节奏感强">🎛️ 电子舞曲</button>
              <button data-p="温柔的民谣吉他，治愈系">🎸 治愈民谣</button>
              <button data-p="摇滚，热血激情">🤘 摇滚</button>
            </div>
            <div class="f6m-create-row">
              <input type="text" id="f6m-title-input" placeholder="歌曲标题（可选）" maxlength="80">
              <input type="text" id="f6m-style-input" placeholder="风格（可选）" maxlength="60">
            </div>
            <div class="f6m-create-check">
              <input type="checkbox" id="f6m-instr"> <label for="f6m-instr">纯音乐（无人声）</label>
            </div>
            <button class="f6m-create-btn" id="f6m-gen-btn">✨ 开始创作</button>
            <div class="f6m-create-status" id="f6m-gen-status"></div>
            <div class="f6m-lyrics-box" id="f6m-lyrics"></div>
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
      // tabs
      this.el.querySelectorAll('.f6m-tab').forEach(b => b.onclick = () => {
        this.tab = b.dataset.tab;
        this.el.querySelectorAll('.f6m-tab').forEach(x => x.classList.remove('f6m-tab-active'));
        b.classList.add('f6m-tab-active');
        const player = $('#f6m-player'), create = $('#f6m-create'), list = $('#f6m-list');
        if (this.tab === 'create') { player.style.display = 'none'; create.style.display = ''; list.style.display = 'none'; }
        else { player.style.display = ''; create.style.display = 'none'; list.style.display = ''; this.renderList(); }
      });
      // create
      $('#f6m-gen-btn').onclick = () => this.generate();
      this.el.querySelectorAll('.f6m-create-quick button').forEach(b => {
        b.onclick = () => { $('#f6m-prompt').value = b.dataset.p; $('#f6m-prompt').focus(); };
      });
    }

    renderList() {
      const el = this.el.querySelector('#f6m-list');
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      console.log('[Music] renderList, tab:', this.tab, 'songs:', songs.length);
      if (!songs.length) { el.innerHTML = `<div class="f6m-empty">${this.tab==='mine'?'🎤 还没有创作，点「✨ 创作」开始吧！':'暂无数据'}</div>`; return; }
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
      el.querySelectorAll('.f6m-item').forEach(x => {
        const idx = +x.dataset.i;
        x.addEventListener('click', e => { e.preventDefault(); if(e.target.closest('a'))return; this.play(idx); }, { passive: false });
        // 明确绑定播放按钮
        const btn = x.querySelector('.f6m-item-act');
        if (btn) btn.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); this.play(idx); }, { passive: false });
      });
    }

    // === 播放 ===
    play(i) {
      const songs = this.tab === 'mine' ? this.myMusic : this.songs;
      console.log('[Music] play called, idx:', i, 'songs:', songs.length, 'tab:', this.tab);
      if (!songs.length) { console.warn('[Music] No songs!'); return; }
      this.idx = i;
      const s = songs[i];
      if (!s || !s.mp3) { console.warn('[Music] No mp3 for song:', s); return; }
      console.log('[Music] Playing:', s.title, s.mp3.substring(0, 60));
      this.audio.src = s.mp3;
      this.audio.load();
      const p = this.audio.play();
      if (p) p.then(() => { this._toast('🎵 ' + (s.title || '正在播放')); }).catch(e => { console.error('[Music] Play error:', e.message || e); this._toast('⚠️ 播放失败: ' + (e.message || '未知错误')); });
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

    // === 创作 ===
    async generate() {
      const $ = s => this.el.querySelector(s);
      const prompt = $('#f6m-prompt').value.trim();
      if (!prompt) { alert('请先描述你想要的歌'); return; }
      if (this._generating) return;

      this._generating = true;
      const btn = $('#f6m-gen-btn');
      const status = $('#f6m-gen-status');
      const lyricsBox = $('#f6m-lyrics');
      btn.disabled = true;
      btn.textContent = '🎵 提交中…';
      status.className = 'f6m-create-status show';
      status.innerHTML = '⏳ 正在提交创作请求…';
      lyricsBox.className = 'f6m-lyrics-box';

      const body = { prompt };
      const title = $('#f6m-title-input').value.trim();
      const style = $('#f6m-style-input').value.trim();
      if (title) body.title = title;
      if (style) body.style = style;
      if ($('#f6m-instr').checked) body.instrumental = true;

      try {
        const r = await fetch('/api/ai6666-music/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const d = await r.json();

        if (d.error) {
          status.innerHTML = `❌ ${d.error}`;
          btn.disabled = false; btn.textContent = '✨ 开始创作'; this._generating = false;
          return;
        }

        const genId = d.generation_id;
        status.innerHTML = `✅ 已提交！任务ID: ${genId}<br>⏳ 等待生成中…`;
        btn.textContent = '⏳ 生成中…';

        // 轮询
        this._pollGen(genId, status, btn, lyricsBox);
      } catch (e) {
        status.innerHTML = `❌ 网络错误: ${e.message}`;
        btn.disabled = false; btn.textContent = '✨ 开始创作'; this._generating = false;
      }
    }

    async _pollGen(genId, status, btn, lyricsBox) {
      let tries = 0;
      const poll = async () => {
        tries++;
        try {
          const r = await fetch(`/api/ai6666-music/status/${genId}`);
          const d = await r.json();

          if (d.stage === 'success' && d.songs && d.songs.length) {
            status.innerHTML = `🎉 创作完成！共 ${d.songs.length} 首歌曲`;
            btn.textContent = '✨ 再来一首'; btn.disabled = false; this._generating = false;

            // 显示歌词
            const song = d.songs[0];
            if (song.lyrics) {
              lyricsBox.className = 'f6m-lyrics-box show';
              lyricsBox.textContent = song.lyrics;
            }

            // 加入我的歌单
            d.songs.forEach(s => {
              if (!this.myMusic.find(m => m.id === s.id)) {
                this.myMusic.unshift(s);
              }
            });
            localStorage.setItem('fish_6666_mine', JSON.stringify(this.myMusic));

            // 自动切到我的tab播放
            this.tab = 'mine';
            this.el.querySelectorAll('.f6m-tab').forEach(x => x.classList.remove('f6m-tab-active'));
            this.el.querySelector('[data-tab="mine"]').classList.add('f6m-tab-active');
            this.el.querySelector('#f6m-player').style.display = '';
            this.el.querySelector('#f6m-create').style.display = 'none';
            this.el.querySelector('#f6m-list').style.display = '';
            this.renderList();
            this.play(0);
            return;
          }

          if (d.stage === 'failed') {
            status.innerHTML = `❌ 生成失败: ${d.error_msg || '未知错误'}`;
            btn.textContent = '✨ 重新创作'; btn.disabled = false; this._generating = false;
            return;
          }

          // 还在生成中
          const pct = d.percent || 0;
          const label = d.label || '生成中…';
          status.innerHTML = `${label} <span class="pct">${pct}%</span><br>⏳ 已等待 ${tries * 5} 秒…`;
          setTimeout(poll, 5000);
        } catch {
          if (tries < 60) setTimeout(poll, 5000);
          else { status.innerHTML = '⏰ 查询超时，请稍后到「我的」查看'; btn.textContent = '✨ 再来一首'; btn.disabled = false; this._generating = false; }
        }
      };
      setTimeout(poll, 3000);
    }

    _toast(msg) {
      let t = document.querySelector('.f6m-toast');
      if (!t) { t = document.createElement('div'); t.className = 'f6m-toast'; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(this._toastT); this._toastT = setTimeout(() => t.classList.remove('show'), 2000);
    }
    fmt(s) { s=Math.round(s); return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`; }
    esc(t) { const d=document.createElement('div'); d.textContent=t||''; return d.innerHTML; }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishAi6666Music());
  else new FishAi6666Music();
})();
