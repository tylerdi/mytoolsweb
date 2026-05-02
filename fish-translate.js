/**
 * 小鱼儿 AI多语言翻译 🐟🌐
 * 基于 MIMO Chat（小米大模型）
 * 用法：<div id="fish-translate"></div><script src="/fish-translate.js"></script>
 */
(function(){
'use strict';

const CHAT_API = '/api/chat';
const TTS_API = '/api/tts';
const MAX_CHARS = 5000;

const LANG_PAIRS = [
  { from: 'zh', to: 'en', label: '中→英', fromName: '中文', toName: 'English' },
  { from: 'en', to: 'zh', label: '英→中', fromName: 'English', toName: '中文' },
  { from: 'zh', to: 'ja', label: '中→日', fromName: '中文', toName: '日本語' },
  { from: 'zh', to: 'ko', label: '中→韩', fromName: '中文', toName: '한국어' },
  { from: 'zh', to: 'fr', label: '中→法', fromName: '中文', toName: 'Français' },
  { from: 'zh', to: 'de', label: '中→德', fromName: '中文', toName: 'Deutsch' },
  { from: 'zh', to: 'es', label: '中→西', fromName: '中文', toName: 'Español' },
  { from: 'zh', to: 'ru', label: '中→俄', fromName: '中文', toName: 'Русский' },
  { from: 'auto', to: 'zh', label: '自动→中', fromName: '自动检测', toName: '中文' },
];

class FishTranslate {
  constructor(){
    this.el = document.getElementById('fish-translate');
    if(!this.el) return;
    this.pair = LANG_PAIRS[0];
    this.translating = false;
    this._debounceTimer = null;
    this.history = JSON.parse(localStorage.getItem('fish_trans_history')||'[]');
    this.render();
  }

  render(){
    this.el.innerHTML = `
    <style>
      .tr-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:20px;font-family:'LXGW WenKai',-apple-system,sans-serif;width:100%;margin:0 auto}
      .tr-title{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
      .tr-title .badge{font-size:.6rem;background:rgba(100,108,255,.15);color:#646cff;padding:2px 8px;border-radius:6px}
      .tr-pair-bar{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:14px;-webkit-overflow-scrolling:touch}
      .tr-pair-bar::-webkit-scrollbar{display:none}
      .tr-pair-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:5px 14px;font-size:.75rem;color:#aaa;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s}
      .tr-pair-chip:hover,.tr-pair-chip.active{background:rgba(100,108,255,.15);border-color:#646cff;color:#646cff}
      .tr-panels{display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .tr-panel{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:12px;padding:14px;position:relative;min-height:160px}
      .tr-panel-label{font-size:.7rem;color:#555;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
      .tr-panel-label .tr-swap-btn{background:none;border:1px solid #2a2a2a;border-radius:6px;padding:2px 8px;color:#888;font-size:.65rem;cursor:pointer;position:absolute;left:50%;transform:translateX(-50%);z-index:2;transition:all .2s}
      .tr-panel-label .tr-swap-btn:hover{border-color:#646cff;color:#646cff}
      .tr-input{width:100%;min-height:100px;background:transparent;border:none;color:#e8e8e8;font-size:.9rem;font-family:inherit;outline:none;resize:vertical;line-height:1.8}
      .tr-input::placeholder{color:#333}
      .tr-output{width:100%;min-height:100px;color:#e8e8e8;font-size:.9rem;line-height:1.8;white-space:pre-wrap;word-break:break-word}
      .tr-output.empty{color:#333;font-style:italic}
      .tr-panel-actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
      .tr-act-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:5px 12px;font-size:.7rem;color:#aaa;cursor:pointer;font-family:inherit;transition:all .2s}
      .tr-act-btn:hover{border-color:#646cff;color:#646cff}
      .tr-act-btn.speaking{border-color:#22c55e;color:#22c55e}
      .tr-translate-btn{width:100%;margin-top:14px;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#646cff,#a855f7);color:#fff;font-size:.9rem;font-weight:700;cursor:pointer;font-family:inherit;transition:all .25s}
      .tr-translate-btn:hover{transform:translateY(-1px);box-shadow:0 4px 15px rgba(100,108,255,.3)}
      .tr-translate-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      .tr-status{text-align:center;font-size:.75rem;color:#555;margin-top:10px;min-height:20px}
      .tr-status.error{color:#ff6b9d}
      .tr-meta{display:flex;justify-content:center;gap:16px;margin-top:6px;font-size:.65rem;color:#444}
      .tr-history{margin-top:16px;border-top:1px solid var(--border,#1e1e1e);padding-top:12px}
      .tr-history h4{font-size:.75rem;color:#666;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between}
      .tr-history h4 button{background:none;border:none;color:#555;font-size:.7rem;cursor:pointer;font-family:inherit}
      .tr-history h4 button:hover{color:#ff6b9d}
      .tr-hist-list{display:flex;flex-direction:column;gap:6px;max-height:200px;overflow-y:auto}
      .tr-hist-item{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:10px 12px;cursor:pointer;transition:all .2s}
      .tr-hist-item:hover{border-color:#646cff}
      .tr-hist-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
      .tr-hist-pair{font-size:.6rem;background:rgba(100,108,255,.1);color:#646cff;padding:1px 6px;border-radius:4px}
      .tr-hist-time{font-size:.6rem;color:#444}
      .tr-hist-text{font-size:.75rem;color:#aaa;line-height:1.6}
      .tr-hist-text .tr-hist-arrow{color:#555;margin:0 4px}
      .tr-loading{display:inline-flex;align-items:center;gap:6px}
      .tr-loading .tr-dot{width:5px;height:5px;border-radius:50%;background:#646cff;animation:tr-bounce .6s ease-in-out infinite}
      .tr-loading .tr-dot:nth-child(2){animation-delay:.15s}
      .tr-loading .tr-dot:nth-child(3){animation-delay:.3s}
      @keyframes tr-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
      @media(max-width:768px){
        .tr-panels{grid-template-columns:1fr}
        .tr-panel-label .tr-swap-btn{position:static;transform:none;display:inline-block;margin-top:4px}
        .tr-pair-bar{gap:4px}
        .tr-pair-chip{padding:6px 10px;font-size:.7rem}
      }
    </style>
    <div class="tr-wrap">
      <div class="tr-title">🌐 AI 翻译 <span class="badge">MIMO · 多语言</span></div>
      <div class="tr-pair-bar">
        ${LANG_PAIRS.map((p,i)=>`<span class="tr-pair-chip${i===0?' active':''}" data-idx="${i}" onclick="window.__trans.setPair(${i})">${p.label}</span>`).join('')}
      </div>
      <div class="tr-panels">
        <div class="tr-panel">
          <div class="tr-panel-label">
            <span id="tr-from-label">${this.pair.fromName}</span>
            <button class="tr-swap-btn" onclick="window.__trans.swap()">⇄ 交换</button>
          </div>
          <textarea class="tr-input" id="tr-input" placeholder="输入要翻译的文字..." maxlength="${MAX_CHARS}" oninput="window.__trans.onInput()"></textarea>
          <div class="tr-panel-actions">
            <button class="tr-act-btn" onclick="window.__trans.clearInput()">🗑 清空</button>
            <button class="tr-act-btn" onclick="window.__trans.pasteInput()">📋 粘贴</button>
          </div>
        </div>
        <div class="tr-panel">
          <div class="tr-panel-label">
            <span id="tr-to-label">${this.pair.toName}</span>
          </div>
          <div class="tr-output empty" id="tr-output">翻译结果将显示在这里</div>
          <div class="tr-panel-actions">
            <button class="tr-act-btn" onclick="window.__trans.copyOutput()">📋 复制</button>
            <button class="tr-act-btn" id="tr-speak-btn" onclick="window.__trans.speakOutput()">🔊 朗读</button>
          </div>
        </div>
      </div>
      <button class="tr-translate-btn" id="tr-translate-btn" onclick="window.__trans.translate()">🌐 翻译</button>
      <div class="tr-status" id="tr-status"></div>
      <div class="tr-meta" id="tr-meta"></div>
      <div class="tr-history">
        <h4>📜 翻译历史 <button onclick="window.__trans.clearHistory()">清空</button></h4>
        <div class="tr-hist-list" id="tr-hist-list"></div>
      </div>
    </div>`;

    window.__trans = this;
    this.renderHistory();
  }

  setPair(idx){
    this.pair = LANG_PAIRS[idx];
    this.el.querySelectorAll('.tr-pair-chip').forEach(c=>c.classList.toggle('active', +c.dataset.idx===idx));
    document.getElementById('tr-from-label').textContent = this.pair.fromName;
    document.getElementById('tr-to-label').textContent = this.pair.toName;
  }

  swap(){
    const cur = this.pair;
    if(cur.from==='auto') return;
    const idx = LANG_PAIRS.findIndex(p=>p.from===cur.to&&p.to===cur.from);
    if(idx>=0) this.setPair(idx);
  }

  onInput(){
    const ta = document.getElementById('tr-input');
    if(!ta) return;
    // 实时翻译 debounce
    clearTimeout(this._debounceTimer);
    if(ta.value.trim().length > 1){
      this._debounceTimer = setTimeout(()=>this.translate(), 800);
    }
  }

  async translate(){
    const ta = document.getElementById('tr-input');
    const text = ta?.value?.trim();
    if(!text){ this._showStatus('请先输入文字','error'); return; }
    if(this.translating) return;

    this.translating = true;
    const btn = document.getElementById('tr-translate-btn');
    if(btn){ btn.disabled = true; btn.innerHTML = '<span class="tr-loading"><span class="tr-dot"></span><span class="tr-dot"></span><span class="tr-dot"></span> 翻译中...</span>'; }
    this._showStatus('');
    document.getElementById('tr-meta').textContent = '';

    const startTime = Date.now();

    try {
      const langHint = this.pair.from==='auto'
        ? `将以下文本翻译成${this.pair.toName}，只返回翻译结果，不要解释。`
        : `将以下${this.pair.fromName}文本翻译成${this.pair.toName}，只返回翻译结果，不要解释。`;

      const resp = await fetch(CHAT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mimo-v2-pro',
          messages: [
            { role: 'system', content: langHint },
            { role: 'user', content: text }
          ],
          stream: true
        })
      });

      if(!resp.ok) throw new Error(`API返回 ${resp.status}`);

      // 解析 SSE 流
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let result = '';
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        const chunk = decoder.decode(value, {stream:true});
        const lines = chunk.split('\n');
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if(data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            result += delta;
          } catch{}
        }
      }
      result = result.trim() || '翻译失败';
      const elapsed = ((Date.now()-startTime)/1000).toFixed(1);

      const outEl = document.getElementById('tr-output');
      outEl.textContent = result;
      outEl.classList.remove('empty');
      this._lastResult = result;
      this._showStatus('✅ 翻译完成');
      document.getElementById('tr-meta').innerHTML = `<span>⏱ ${elapsed}s</span><span>📝 ${text.length}字 → ${result.length}字</span>`;

      this._addHistory(text, result);
    } catch(e) {
      this._showStatus('翻译失败: '+e.message,'error');
    } finally {
      this.translating = false;
      if(btn){ btn.disabled = false; btn.innerHTML = '🌐 翻译'; }
    }
  }

  async copyOutput(){
    const text = this._lastResult;
    if(!text) return;
    try {
      await navigator.clipboard.writeText(text);
      const btn = this.el.querySelector('.tr-act-btn:nth-child(1)');
      if(btn){ btn.textContent = '✅ 已复制'; setTimeout(()=>btn.textContent = '📋 复制', 2000); }
    } catch{}
  }

  async speakOutput(){
    const text = this._lastResult;
    if(!text) return;
    const btn = document.getElementById('tr-speak-btn');
    if(btn){ btn.classList.add('speaking'); btn.textContent = '🔊 生成中...'; }
    try {
      const resp = await fetch(TTS_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });
      if(!resp.ok) throw new Error('TTS失败');
      const blob = await resp.blob();
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = ()=>{ if(btn){ btn.classList.remove('speaking'); btn.textContent = '🔊 朗读'; } };
      audio.play();
    } catch(e) {
      if(btn){ btn.classList.remove('speaking'); btn.textContent = '🔊 朗读'; }
    }
  }

  clearInput(){
    const ta = document.getElementById('tr-input');
    if(ta) ta.value = '';
    const out = document.getElementById('tr-output');
    out.textContent = '翻译结果将显示在这里';
    out.classList.add('empty');
    this._lastResult = null;
    document.getElementById('tr-meta').textContent = '';
  }

  async pasteInput(){
    try {
      const text = await navigator.clipboard.readText();
      const ta = document.getElementById('tr-input');
      if(ta) ta.value = text;
    } catch{}
  }

  _showStatus(msg, type){
    const el = document.getElementById('tr-status');
    if(!el) return;
    el.innerHTML = msg;
    el.className = 'tr-status'+(type==='error'?' error':'');
  }

  _addHistory(from, to){
    this.history.unshift({ from, to, pair: this.pair.label, time: Date.now() });
    if(this.history.length > 20) this.history.pop();
    localStorage.setItem('fish_trans_history', JSON.stringify(this.history));
    this.renderHistory();
  }

  renderHistory(){
    const el = document.getElementById('tr-hist-list');
    if(!el) return;
    if(!this.history.length){ el.innerHTML='<div style="text-align:center;color:#444;font-size:.7rem;padding:8px">暂无记录</div>'; return; }
    el.innerHTML = this.history.slice(0,10).map(h=>{
      const t = new Date(h.time);
      const ts = `${t.getMonth()+1}/${t.getDate()} ${t.getHours()}:${String(t.getMinutes()).padStart(2,'0')}`;
      return `<div class="tr-hist-item" onclick="window.__trans.loadHistory('${h.from.replace(/'/g,"\\'").replace(/\n/g,' ')}','${h.to.replace(/'/g,"\\'").replace(/\n/g,' ')}')">
        <div class="tr-hist-top"><span class="tr-hist-pair">${h.pair}</span><span class="tr-hist-time">${ts}</span></div>
        <div class="tr-hist-text">${h.from.slice(0,50)}<span class="tr-hist-arrow">→</span>${h.to.slice(0,50)}</div>
      </div>`;
    }).join('');
  }

  loadHistory(from, to){
    const ta = document.getElementById('tr-input');
    if(ta) ta.value = from;
    const out = document.getElementById('tr-output');
    out.textContent = to;
    out.classList.remove('empty');
    this._lastResult = to;
  }

  clearHistory(){
    this.history = [];
    localStorage.removeItem('fish_trans_history');
    this.renderHistory();
  }
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>new FishTranslate());
else new FishTranslate();
})();
