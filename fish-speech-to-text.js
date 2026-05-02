/**
 * 小鱼儿 语音转文字 🐟🎙️
 * 基于浏览器原生 Web Speech API
 * 用法：<div id="fish-speech-to-text"></div><script src="/fish-speech-to-text.js"></script>
 */
(function(){
'use strict';

const TTS_API = '/api/tts';

const LANGS = [
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
  { code: 'yue-Hant-HK', name: '粤语', flag: '🇭🇰' },
];

class FishSpeechToText {
  constructor(){
    this.el = document.getElementById('fish-speech-to-text');
    if(!this.el) return;
    this.recognizing = false;
    this.recognition = null;
    this.lang = 'zh-CN';
    this._finalText = '';
    this._interimText = '';
    this._startTime = 0;
    this._timer = null;
    this._audioCtx = null;
    this._analyser = null;
    this._stream = null;
    this.history = JSON.parse(localStorage.getItem('fish_stt_history')||'[]');
    this._checkSupport();
    this.render();
  }

  _checkSupport(){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.supported = !!SR;
    if(this.supported) this._SR = SR;
  }

  render(){
    this.el.innerHTML = `
    <style>
      .st-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:20px;font-family:'LXGW WenKai',-apple-system,sans-serif;width:100%;margin:0 auto}
      .st-title{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
      .st-title .badge{font-size:.6rem;background:rgba(255,107,157,.15);color:#ff6b9d;padding:2px 8px;border-radius:6px}
      .st-lang-bar{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;-webkit-overflow-scrolling:touch}
      .st-lang-bar::-webkit-scrollbar{display:none}
      .st-lang-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:5px 14px;font-size:.75rem;color:#aaa;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s}
      .st-lang-chip:hover,.st-lang-chip.active{background:rgba(255,107,157,.15);border-color:#ff6b9d;color:#ff6b9d}
      .st-record-area{display:flex;flex-direction:column;align-items:center;gap:16px;margin:20px 0}
      .st-record-btn{width:100px;height:100px;border-radius:50%;border:3px solid #2a2a2a;background:#0a0a0a;color:#e8e8e8;font-size:1.8rem;cursor:pointer;transition:all .3s;position:relative;display:flex;align-items:center;justify-content:center}
      .st-record-btn:hover{border-color:#ff6b9d;transform:scale(1.05)}
      .st-record-btn.recording{border-color:#ff4444;background:rgba(255,68,68,.1);animation:st-breath 1.5s ease-in-out infinite}
      @keyframes st-breath{0%,100%{box-shadow:0 0 0 0 rgba(255,68,68,.3)}50%{box-shadow:0 0 0 15px rgba(255,68,68,0)}}
      .st-record-btn .st-pulse-ring{position:absolute;inset:-8px;border-radius:50%;border:2px solid rgba(255,68,68,.3);opacity:0;animation:st-ring 1.5s ease-out infinite}
      .st-record-btn.recording .st-pulse-ring{opacity:1}
      @keyframes st-ring{0%{transform:scale(.9);opacity:.6}100%{transform:scale(1.3);opacity:0}}
      .st-timer{font-size:1.5rem;font-weight:700;color:#e8e8e8;font-variant-numeric:tabular-nums}
      .st-timer.active{color:#ff4444}
      .st-wave-area{width:100%;height:80px;background:#0a0a0a;border-radius:12px;overflow:hidden}
      .st-wave-canvas{width:100%;height:100%}
      .st-result-wrap{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:14px;min-height:120px;position:relative}
      .st-result-label{font-size:.7rem;color:#555;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center}
      .st-result-text{color:#e8e8e8;font-size:.9rem;line-height:1.8;white-space:pre-wrap;word-break:break-word;min-height:60px}
      .st-result-text:empty::before{content:'识别结果将显示在这里...';color:#333}
      .st-result-text .interim{color:#666;font-style:italic}
      .st-actions{display:flex;gap:8px;justify-content:center;margin-top:14px;flex-wrap:wrap}
      .st-act-btn{padding:8px 18px;border-radius:10px;border:1px solid #2a2a2a;background:#0a0a0a;color:#aaa;font-size:.8rem;cursor:pointer;font-family:inherit;transition:all .2s}
      .st-act-btn:hover{border-color:#ff6b9d;color:#ff6b9d}
      .st-act-btn:disabled{opacity:.4;cursor:not-allowed}
      .st-status{text-align:center;font-size:.75rem;color:#555;margin-top:10px;min-height:20px}
      .st-status.error{color:#ff6b9d}
      .st-not-supported{text-align:center;padding:40px 20px;color:#888}
      .st-not-supported .st-ns-icon{font-size:3rem;margin-bottom:12px}
      .st-not-supported .st-ns-text{font-size:.85rem;line-height:1.8}
      .st-history{margin-top:16px;border-top:1px solid var(--border,#1e1e1e);padding-top:12px}
      .st-history h4{font-size:.75rem;color:#666;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
      .st-history h4 button{background:none;border:none;color:#555;font-size:.7rem;cursor:pointer;font-family:inherit}
      .st-history h4 button:hover{color:#ff6b9d}
      .st-hist-list{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto}
      .st-hist-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px 12px;transition:all .2s}
      .st-hist-item:hover{border-color:#ff6b9d}
      .st-hist-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
      .st-hist-lang{font-size:.6rem;background:rgba(255,107,157,.1);color:#ff6b9d;padding:1px 6px;border-radius:4px}
      .st-hist-time{font-size:.6rem;color:#444}
      .st-hist-text{font-size:.75rem;color:#aaa;line-height:1.6}
      .st-hist-actions{display:flex;gap:6px;margin-top:6px}
      .st-hist-btn{background:none;border:1px solid rgba(255,255,255,.08);border-radius:6px;padding:3px 8px;color:#666;font-size:.6rem;cursor:pointer;font-family:inherit;transition:all .2s}
      .st-hist-btn:hover{border-color:#ff6b9d;color:#ff6b9d}
      @media(max-width:768px){
        .st-record-btn{width:80px;height:80px;font-size:1.5rem}
        .st-timer{font-size:1.2rem}
      }
    </style>
    <div class="st-wrap">
      <div class="st-title">🎙️ 语音转文字 <span class="badge">Web Speech API</span></div>
      ${this.supported ? `
      <div class="st-lang-bar">
        ${LANGS.map((l,i)=>`<span class="st-lang-chip${i===0?' active':''}" data-code="${l.code}" onclick="window.__stt.setLang('${l.code}')">${l.flag} ${l.name}</span>`).join('')}
      </div>
      <div class="st-record-area">
        <button class="st-record-btn" id="st-record-btn" onclick="window.__stt.toggleRecord()">
          <span class="st-pulse-ring"></span>
          <span id="st-record-icon">🎤</span>
        </button>
        <div class="st-timer" id="st-timer">00:00</div>
      </div>
      <div class="st-wave-area">
        <canvas class="st-wave-canvas" id="st-wave-canvas"></canvas>
      </div>
      <div class="st-result-wrap">
        <div class="st-result-label">
          <span>识别结果</span>
          <span id="st-char-count">0字</span>
        </div>
        <div class="st-result-text" id="st-result-text"></div>
      </div>
      <div class="st-actions">
        <button class="st-act-btn" onclick="window.__stt.copyResult()">📋 复制</button>
        <button class="st-act-btn" onclick="window.__stt.speakResult()">🔊 朗读</button>
        <button class="st-act-btn" onclick="window.__stt.downloadResult()">💾 下载</button>
        <button class="st-act-btn" onclick="window.__stt.clearResult()">🗑 清空</button>
      </div>
      <div class="st-status" id="st-status"></div>
      ` : `
      <div class="st-not-supported">
        <div class="st-ns-icon">😢</div>
        <div class="st-ns-text">
          <p>你的浏览器不支持 Web Speech API</p>
          <p style="margin-top:8px;font-size:.75rem;color:#555">推荐使用 <strong>Chrome / Edge</strong> 浏览器</p>
          <p style="font-size:.75rem;color:#555">或使用我们的 <strong>文字转语音</strong> 工具</p>
        </div>
      </div>
      `}
      <div class="st-history">
        <h4>📜 识别历史 <button onclick="window.__stt.clearHistory()">清空</button></h4>
        <div class="st-hist-list" id="st-hist-list"></div>
      </div>
    </div>`;

    window.__stt = this;
    if(this.supported){
      this._initWaveCanvas();
      this._initRecognition();
    }
    this.renderHistory();
  }

  _initWaveCanvas(){
    const canvas = document.getElementById('st-wave-canvas');
    if(!canvas) return;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = 160;
    this._drawIdleWave();
  }

  _drawIdleWave(){
    const canvas = document.getElementById('st-wave-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0,0,w,h);
    const bars = 80;
    const barW = w / bars;
    for(let i=0;i<bars;i++){
      const x = i * barW + barW/2;
      const barH = 6 + Math.sin(i*0.25)*3;
      ctx.fillStyle = 'rgba(255,107,157,0.15)';
      ctx.fillRect(x-barW/2+1, h/2-barH/2, barW-2, barH);
    }
  }

  _startWaveAnimation(){
    const canvas = document.getElementById('st-wave-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    let frame = 0;

    const draw = ()=>{
      if(!this.recognizing){ this._drawIdleWave(); return; }
      ctx.clearRect(0,0,w,h);
      const bars = 80;
      const barW = w / bars;

      // 用音量数据驱动波形
      let vol = 0.5;
      if(this._analyser){
        const data = new Uint8Array(this._analyser.frequencyBinCount);
        this._analyser.getByteFrequencyData(data);
        vol = data.reduce((a,b)=>a+b,0) / data.length / 255;
      }

      for(let i=0;i<bars;i++){
        const x = i * barW + barW/2;
        const barH = 6 + vol * h * 0.6 * Math.abs(Math.sin(frame*0.06 + i*0.18));
        const alpha = 0.2 + vol * 0.6;
        const hue = 340 + Math.sin(frame*0.04+i*0.12)*30;
        ctx.fillStyle = `hsla(${hue},80%,60%,${alpha})`;
        ctx.fillRect(x-barW/2+1, h/2-barH/2, barW-2, barH);
      }
      frame++;
      requestAnimationFrame(draw);
    };
    draw();
  }

  _initRecognition(){
    const SR = this._SR;
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.lang;

    this.recognition.onstart = ()=>{
      this.recognizing = true;
      this._startTime = Date.now();
      this._startTimer();
      this._startWaveAnimation();
      document.getElementById('st-record-btn')?.classList.add('recording');
      document.getElementById('st-record-icon').textContent = '⏹';
      this._showStatus('🎤 正在录音，请说话...');
    };

    this.recognition.onresult = (e)=>{
      let interim = '', final = '';
      for(let i=e.resultIndex; i<e.results.length; i++){
        const t = e.results[i][0].transcript;
        if(e.results[i].isFinal) final += t;
        else interim += t;
      }
      if(final) this._finalText += final;
      this._interimText = interim;
      this._updateResultDisplay();
    };

    this.recognition.onerror = (e)=>{
      if(e.error==='no-speech') this._showStatus('未检测到语音，请再试一次','error');
      else if(e.error==='audio-capture') this._showStatus('无法访问麦克风','error');
      else if(e.error==='not-allowed') this._showStatus('麦克风权限被拒绝','error');
      else this._showStatus('识别错误: '+e.error,'error');
    };

    this.recognition.onend = ()=>{
      if(this.recognizing){
        // 自动重连（保持连续识别）
        try { this.recognition.start(); } catch{}
      }
    };
  }

  async toggleRecord(){
    if(!this.supported) return;
    if(this.recognizing){
      this.stopRecord();
    } else {
      await this.startRecord();
    }
  }

  async startRecord(){
    try {
      // 请求麦克风权限并初始化音频分析
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this._audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      const source = this._audioCtx.createMediaStreamSource(this._stream);
      this._analyser = this._audioCtx.createAnalyser();
      this._analyser.fftSize = 256;
      source.connect(this._analyser);

      this._finalText = '';
      this._interimText = '';
      this.recognition.lang = this.lang;
      this.recognition.start();
    } catch(e) {
      this._showStatus('无法访问麦克风: '+e.message,'error');
    }
  }

  stopRecord(){
    this.recognizing = false;
    try { this.recognition.stop(); } catch{}
    if(this._stream){ this._stream.getTracks().forEach(t=>t.stop()); this._stream = null; }
    if(this._audioCtx){ this._audioCtx.close(); this._audioCtx = null; }
    this._analyser = null;
    this._stopTimer();

    document.getElementById('st-record-btn')?.classList.remove('recording');
    document.getElementById('st-record-icon').textContent = '🎤';
    this._drawIdleWave();

    const final = this._finalText + this._interimText;
    if(final.trim()){
      this._showStatus('✅ 识别完成');
      this._addHistory(final.trim());
    } else {
      this._showStatus('未识别到内容');
    }
  }

  _updateResultDisplay(){
    const el = document.getElementById('st-result-text');
    if(!el) return;
    const text = this._finalText + (this._interimText ? `<span class="interim">${this._interimText}</span>` : '');
    el.innerHTML = text || '';
    const count = document.getElementById('st-char-count');
    if(count) count.textContent = (this._finalText + this._interimText).length + '字';
  }

  _startTimer(){
    const el = document.getElementById('st-timer');
    if(el) el.classList.add('active');
    const update = ()=>{
      if(!this.recognizing) return;
      const sec = Math.floor((Date.now()-this._startTime)/1000);
      const m = String(Math.floor(sec/60)).padStart(2,'0');
      const s = String(sec%60).padStart(2,'0');
      if(el) el.textContent = `${m}:${s}`;
      this._timer = setTimeout(update, 1000);
    };
    update();
  }

  _stopTimer(){
    clearTimeout(this._timer);
    const el = document.getElementById('st-timer');
    if(el) el.classList.remove('active');
  }

  setLang(code){
    this.lang = code;
    this.el.querySelectorAll('.st-lang-chip').forEach(c=>c.classList.toggle('active', c.dataset.code===code));
    if(this.recognizing){
      this.stopRecord();
      setTimeout(()=>this.startRecord(), 300);
    }
  }

  async copyResult(){
    const text = this._finalText + this._interimText;
    if(!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      this._showStatus('✅ 已复制到剪贴板');
    } catch{}
  }

  async speakResult(){
    const text = this._finalText + this._interimText;
    if(!text.trim()) return;
    this._showStatus('正在生成语音...');
    try {
      const resp = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() })
      });
      if(!resp.ok) throw new Error('TTS失败');
      const blob = await resp.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = ()=>this._showStatus('✅ 播放完成');
      audio.play();
    } catch(e) {
      this._showStatus('语音生成失败','error');
    }
  }

  downloadResult(){
    const text = this._finalText + this._interimText;
    if(!text.trim()) return;
    const blob = new Blob([text.trim()], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `fish-stt-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
    this._showStatus('✅ 已下载');
  }

  clearResult(){
    this._finalText = '';
    this._interimText = '';
    this._updateResultDisplay();
    document.getElementById('st-timer').textContent = '00:00';
    this._showStatus('');
  }

  _showStatus(msg, type){
    const el = document.getElementById('st-status');
    if(!el) return;
    el.innerHTML = msg;
    el.className = 'st-status'+(type==='error'?' error':'');
  }

  _addHistory(text){
    this.history.unshift({ text: text.slice(0,200), lang: this.lang, time: Date.now() });
    if(this.history.length > 15) this.history.pop();
    localStorage.setItem('fish_stt_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory(){
    const el = document.getElementById('st-hist-list');
    if(!el) return;
    if(!this.history.length){ el.innerHTML='<div style="text-align:center;color:#444;font-size:.7rem;padding:8px">暂无记录</div>'; return; }
    el.innerHTML = this.history.slice(0,10).map((h,i)=>{
      const t = new Date(h.time);
      const ts = `${t.getMonth()+1}/${t.getDate()} ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`;
      const langObj = LANGS.find(l=>l.code===h.lang);
      return `<div class="st-hist-item">
        <div class="st-hist-top"><span class="st-hist-lang">${langObj?.flag||''} ${langObj?.name||h.lang}</span><span class="st-hist-time">${ts}</span></div>
        <div class="st-hist-text">${h.text}</div>
        <div class="st-hist-actions">
          <button class="st-hist-btn" onclick="window.__stt.loadHistText(${i})">📝 使用</button>
          <button class="st-hist-btn" onclick="window.__stt.copyHistText(${i})">📋 复制</button>
        </div>
      </div>`;
    }).join('');
  }

  loadHistText(i){
    const h = this.history[i];
    if(!h) return;
    this._finalText = h.text;
    this._interimText = '';
    this._updateResultDisplay();
  }

  async copyHistText(i){
    const h = this.history[i];
    if(!h) return;
    try { await navigator.clipboard.writeText(h.text); this._showStatus('✅ 已复制'); } catch{}
  }

  clearHistory(){
    this.history = [];
    localStorage.removeItem('fish_stt_history');
    this.renderHistory();
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>new FishSpeechToText());
else new FishSpeechToText();
})();
