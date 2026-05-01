/**
 * 小鱼儿 AI 画图 🐟🎨
 * 基于 Pollinations.ai（免费，Flux 模型）
 * 用法：<div id="fish-image-gen"></div><script src="/fish-image-gen.js"></script>
 */
(function () {
  'use strict';

  const API = 'https://image.pollinations.ai/prompt';
  const STYLES = [
    { id: 'auto', name: '🎨 自动', prompt: '' },
    { id: 'anime', name: '🌸 动漫', prompt: ', anime style, vibrant colors' },
    { id: 'oil', name: '🖼️ 油画', prompt: ', oil painting, classical art' },
    { id: 'photo', name: '📷 写实', prompt: ', photorealistic, 8k, detailed' },
    { id: 'pixel', name: '👾 像素', prompt: ', pixel art, retro game' },
    { id: 'watercolor', name: '💧 水彩', prompt: ', watercolor painting, soft' },
    { id: 'cyberpunk', name: '🌆 赛博', prompt: ', cyberpunk, neon lights' },
    { id: 'chinese', name: '🏮 国风', prompt: ', Chinese ink painting, traditional' },
    { id: '3d', name: '🧊 3D', prompt: ', 3D render, blender, octane' },
    { id: 'sketch', name: '✏️ 素描', prompt: ', pencil sketch, black and white' },
  ];

  const SIZES = [
    { id: '1:1', w: 1024, h: 1024, name: '1:1' },
    { id: '16:9', w: 1280, h: 720, name: '16:9' },
    { id: '9:16', w: 720, h: 1280, name: '9:16' },
    { id: '4:3', w: 1024, h: 768, name: '4:3' },
  ];

  const SAMPLES = [
    '一只穿宇航服的猫在月球上钓鱼',
    '赛博朋克风格的东京街头，霓虹灯闪烁',
    '水墨画风格的山水，有仙鹤飞过',
    '巨大的机械龙在云层中翱航',
    '海底城市的珊瑚宫殿',
    '一棵发光的世界树在星空下',
    '蒸汽朋克风格的飞艇',
    '一只柴犬穿着西装在弹钢琴',
  ];

  class FishImageGen {
    constructor() {
      this.el = document.getElementById('fish-image-gen');
      if (!this.el) return;
      this.style = 'auto';
      this.size = SIZES[0];
      this.history = JSON.parse(localStorage.getItem('fish_img_history') || '[]');
      this.generating = false;
      this.render();
      this.syncFromDb();
    }

    async generate(prompt) {
      if (!prompt?.trim() || this.generating) return;
      this.generating = true;

      const styleObj = STYLES.find(s => s.id === this.style) || STYLES[0];
      const fullPrompt = prompt + styleObj.prompt;
      const seed = Math.floor(Math.random() * 999999);
      const url = `${API}/${encodeURIComponent(fullPrompt)}?width=${this.size.w}&height=${this.size.h}&seed=${seed}&nologo=true&model=flux`;

      // 显示加载
      const resultArea = this.el.querySelector('.img-result');
      resultArea.innerHTML = `
        <div class="img-loading">
          <div class="img-spinner"></div>
          <p>🎨 AI 正在创作中...</p>
          <p class="img-prompt-text">"${prompt}"</p>
        </div>`;

      // 加载图片
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.generating = false;
        resultArea.innerHTML = `
          <div class="img-display">
            <img src="${url}" alt="${prompt}" />
            <div class="img-actions">
              <button class="img-action-btn" onclick="window.__imgGen.download('${url}', '${prompt.replace(/'/g, '')}')">💾 下载</button>
              <button class="img-action-btn" onclick="window.__imgGen.copyUrl('${url}')">📋 复制链接</button>
              <button class="img-action-btn" onclick="window.__imgGen.share('${prompt}')">🔗 分享</button>
            </div>
            <div class="img-info">"${prompt}" · ${styleObj.name} · ${this.size.id}</div>
          </div>`;

        // 保存历史
        const entry = { prompt, url, style: this.style, size: this.size.id, time: Date.now() };
        this.history.unshift(entry);
        if (this.history.length > 20) this.history.pop();
        localStorage.setItem('fish_img_history', JSON.stringify(this.history));
        this._dbSaveImage(entry);
        this.renderHistory();
      };
      img.onerror = () => {
        this.generating = false;
        resultArea.innerHTML = `<div class="img-error">😢 生成失败，请稍后重试</div>`;
      };
      img.src = url;
    }

    download(url, name) {
      const a = document.createElement('a');
      a.href = url;
      a.download = `fish-ai-${name.slice(0, 20)}.jpg`;
      a.target = '_blank';
      a.click();
    }

    async copyUrl(url) {
      try {
        await navigator.clipboard.writeText(url);
        const btn = this.el.querySelector('.img-action-btn:nth-child(2)');
        if (btn) { btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制链接', 2000); }
      } catch {}
    }

    share(prompt) {
      if (navigator.share) {
        navigator.share({ title: `AI画作: ${prompt}`, text: `看看AI画的「${prompt}」`, url: location.href });
      }
    }

    random() {
      const p = SAMPLES[Math.floor(Math.random() * SAMPLES.length)];
      this.el.querySelector('.img-input').value = p;
      this.generate(p);
    }

    renderHistory() {
      const histEl = this.el.querySelector('.img-history-list');
      if (!histEl || !this.history.length) return;
      histEl.innerHTML = this.history.slice(0, 8).map(h =>
        `<div class="img-hist-item" onclick="window.__imgGen.el.querySelector('.img-input').value='${h.prompt.replace(/'/g, "\\'")}';window.__imgGen.generate('${h.prompt.replace(/'/g, "\\'")}')">
          <img src="${h.url}" alt="${h.prompt}" loading="lazy" />
          <div class="img-hist-prompt">${h.prompt}</div>
        </div>`
      ).join('');
    }

    render() {
      this.el.innerHTML = `
      <style>
        .ig-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:20px;font-family:'LXGW WenKai',-apple-system,sans-serif;;width:100%;margin:0 auto}
        .ig-title{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .ig-title .badge{font-size:.6rem;background:rgba(100,108,255,.15);color:#646cff;padding:2px 8px;border-radius:6px}
        .ig-input-row{display:flex;gap:8px;margin-bottom:12px}
        .img-input{flex:1;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;padding:10px 14px;color:#e8e8e8;font-size:.85rem;font-family:inherit;outline:none;resize:none}
        .img-input:focus{border-color:#646cff}
        .ig-gen-btn{background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;border-radius:10px;padding:10px 18px;color:#fff;font-size:.85rem;cursor:pointer;font-weight:600;white-space:nowrap;transition:transform .2s}
        .ig-gen-btn:hover{transform:translateY(-1px)}
        .ig-gen-btn:disabled{opacity:.5;cursor:not-allowed}
        .ig-rand-btn{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;padding:10px 14px;color:#aaa;font-size:.85rem;cursor:pointer;white-space:nowrap}
        .ig-rand-btn:hover{border-color:#646cff;color:#e8e8e8}
        .ig-styles{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;-webkit-overflow-scrolling:touch}
        .ig-styles::-webkit-scrollbar{display:none}
        .ig-style-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:4px 12px;font-size:.7rem;color:#aaa;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s}
        .ig-style-chip:hover,.ig-style-chip.active{background:rgba(100,108,255,.15);border-color:#646cff;color:#646cff}
        .ig-sizes{display:flex;gap:6px;margin-bottom:16px}
        .ig-size-chip{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:4px 10px;font-size:.7rem;color:#aaa;cursor:pointer;transition:all .2s}
        .ig-size-chip:hover,.ig-size-chip.active{background:rgba(100,108,255,.15);border-color:#646cff;color:#646cff}
        .img-result{min-height:200px;display:flex;align-items:center;justify-content:center}
        .img-loading{text-align:center;color:#888}
        .img-spinner{width:36px;height:36px;border:3px solid #2a2a2a;border-top-color:#646cff;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .img-prompt-text{font-size:.75rem;color:#555;margin-top:4px;font-style:italic}
        .img-display{width:100%;text-align:center}
        .img-display img{width:100%;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.3)}
        .img-actions{display:flex;gap:8px;justify-content:center;margin-top:12px}
        .img-action-btn{background:#0a0a0a;border:1px solid #2a2a2a;border-radius:8px;padding:6px 14px;color:#e8e8e8;font-size:.75rem;cursor:pointer;font-family:inherit;transition:all .2s}
        .img-action-btn:hover{border-color:#646cff}
        .img-info{font-size:.7rem;color:#555;margin-top:8px}
        .img-error{text-align:center;color:#ff6b9d;padding:40px 0}
        .ig-history{margin-top:16px;border-top:1px solid var(--border,#1e1e1e);padding-top:12px}
        .ig-history h4{font-size:.75rem;color:#666;margin-bottom:8px}
        .img-history-list{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
        .img-hist-item{border-radius:8px;overflow:hidden;cursor:pointer;position:relative;aspect-ratio:1}
        .img-hist-item img{width:100%;height:100%;object-fit:cover;transition:transform .3s}
        .img-hist-item:hover img{transform:scale(1.05)}
        .img-hist-prompt{position:absolute;bottom:0;left:0;right:0;padding:4px 6px;background:linear-gradient(transparent,rgba(0,0,0,.8));font-size:.55rem;color:#ddd;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        @media(){.img-history-list{grid-template-columns:repeat(3,1fr)}.ig-wrap{padding:12px}}
        @media(){
          .ig-wrap{max-width:100%!important;padding:12px!important}
          .ig-input-row{flex-direction:column}
          .ig-gen-btn,.ig-rand-btn{width:100%;text-align:center}
          .ig-sizes{flex-wrap:wrap}
          .ig-size-chip{flex:1;text-align:center;min-width:60px}
          .img-history-list{grid-template-columns:repeat(3,1fr)}
          .ig-style-chip{padding:6px 10px;font-size:.75rem}
        }
      </style>
      <div class="ig-wrap">
        <div class="ig-title">🎨 AI 画图 <span class="badge">Pollinations · 免费</span></div>
        <div class="ig-styles">
          ${STYLES.map(s => `<span class="ig-style-chip${s.id === this.style ? ' active' : ''}" data-style="${s.id}" onclick="window.__imgGen.setStyle('${s.id}')">${s.name}</span>`).join('')}
        </div>
        <div class="ig-sizes">
          ${SIZES.map(s => `<span class="ig-size-chip${s.id === this.size.id ? ' active' : ''}" onclick="window.__imgGen.setSize('${s.id}')">${s.name}</span>`).join('')}
        </div>
        <div class="ig-input-row">
          <input class="img-input" placeholder="描述你想画的内容..." onkeydown="if(event.key==='Enter')window.__imgGen.generate(this.value)">
          <button class="ig-gen-btn" onclick="window.__imgGen.generate(this.previousElementSibling.value)">🎨 生成</button>
          <button class="ig-rand-btn" onclick="window.__imgGen.random()">🎲</button>
        </div>
        <div class="img-result">
          <div style="text-align:center;color:#555;padding:40px 0">
            <div style="font-size:2rem;margin-bottom:8px">🎨</div>
            <p>输入描述，点击生成</p>
            <p style="font-size:.7rem;color:#444;margin-top:4px">或点击 🎲 随机灵感</p>
          </div>
        </div>
        <div class="ig-history">
          <h4>📜 历史记录</h4>
          <div class="img-history-list"></div>
        </div>
      </div>`;

      window.__imgGen = this;
      this.renderHistory();
    }

    setStyle(id) {
      this.style = id;
      this.el.querySelectorAll('.ig-style-chip').forEach(c => c.classList.toggle('active', c.dataset.style === id));
    }

    _getVisitorId() { let id=localStorage.getItem('vid'); if(!id){id='v_'+Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('vid',id);} return id; }
    async syncFromDb() { try { const r=await fetch(`/api/images?visitor_id=${this._getVisitorId()}&limit=20`); const j=await r.json(); if(j.ok&&j.data?.length){ const dbHistory=j.data.map(d=>({prompt:d.prompt,url:d.url,style:d.style,size:'',time:new Date(d.created_at).getTime(),dbId:d.id})); const localIds=new Set(this.history.map(h=>h.url)); const merged=[...dbHistory.filter(d=>!localIds.has(d.url)),...this.history].sort((a,b)=>b.time-a.time).slice(0,20); this.history=merged; localStorage.setItem('fish_img_history',JSON.stringify(merged)); this.renderHistory(); } } catch{} }
    async _dbSaveImage(e) { try { await fetch('/api/images',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({visitor_id:this._getVisitorId(),prompt:e.prompt,style:e.style,url:e.url})}); } catch{} }
    async _dbDeleteImage(id) { try { await fetch(`/api/images?visitor_id=${this._getVisitorId()}&id=${id}`,{method:'DELETE'}); } catch{} }
    setSize(id) {
      this.size = SIZES.find(s => s.id === id) || SIZES[0];
      this.el.querySelectorAll('.ig-size-chip').forEach(c => c.classList.toggle('active', c.textContent.trim() === this.size.id));
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishImageGen());
  else new FishImageGen();
})();
