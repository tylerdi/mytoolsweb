/**
 * 小鱼儿图床 🐟🖼️
 * gpt-image-2 高质量图片画廊
 * 用法：<div id="fish-gallery"></div><script src="/fish-gallery.js"></script>
 */
(function () {
  'use strict';

  const TAGS = [
    { id: 'all', name: '🌟 全部' },
    { id: 'carbon-circle', name: '🐟 碳基圈' },
    { id: 'morning-report', name: '🌅 早报' },
    { id: 'creative', name: '🎨 创意' },
    { id: 'landscape', name: '🏔️ 风景' },
    { id: 'portrait', name: '👤 人像' },
    { id: 'other', name: '📎 其他' },
  ];

  class FishGallery {
    constructor() {
      this.el = document.getElementById('fish-gallery');
      if (!this.el) return;
      this.page = 1;
      this.limit = 20;
      this.tag = 'all';
      this.loading = false;
      this.total = 0;
      this.images = [];
      this.render();
      this.load();
    }

    render() {
      this.el.innerHTML = `
      <style>
        .fg-wrap{font-family:'LXGW WenKai',-apple-system,sans-serif;width:100%;margin:0 auto}
        .fg-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px}
        .fg-title{font-size:1.1rem;font-weight:700;display:flex;align-items:center;gap:8px}
        .fg-title .badge{font-size:.6rem;background:rgba(100,108,255,.15);color:#646cff;padding:2px 8px;border-radius:6px}
        .fg-count{font-size:.75rem;color:#666}
        .fg-tags{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:16px;-webkit-overflow-scrolling:touch}
        .fg-tags::-webkit-scrollbar{display:none}
        .fg-tag{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:5px 14px;font-size:.75rem;color:#aaa;cursor:pointer;white-space:nowrap;flex-shrink:0;transition:all .2s}
        .fg-tag:hover,.fg-tag.active{background:rgba(100,108,255,.15);border-color:#646cff;color:#646cff}
        .fg-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
        .fg-card{border-radius:12px;overflow:hidden;cursor:pointer;position:relative;background:#0a0a0a;transition:transform .3s,box-shadow .3s}
        .fg-card:hover{transform:translateY(-3px);box-shadow:0 8px 30px rgba(100,108,255,.2)}
        .fg-card img{width:100%;display:block;aspect-ratio:1;object-fit:cover;transition:transform .5s}
        .fg-card:hover img{transform:scale(1.05)}
        .fg-card-info{position:absolute;bottom:0;left:0;right:0;padding:8px 10px;background:linear-gradient(transparent,rgba(0,0,0,.85));opacity:0;transition:opacity .3s}
        .fg-card:hover .fg-card-info{opacity:1}
        .fg-card-prompt{font-size:.7rem;color:#e8e8e8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .fg-card-meta{font-size:.6rem;color:#888;margin-top:2px;display:flex;gap:8px}
        .fg-card-tag{font-size:.55rem;background:rgba(100,108,255,.2);color:#646cff;padding:1px 6px;border-radius:4px}
        .fg-empty{text-align:center;padding:60px 0;color:#555}
        .fg-empty-icon{font-size:3rem;margin-bottom:12px}
        .fg-load-more{text-align:center;margin-top:20px}
        .fg-load-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 24px;color:#aaa;font-size:.8rem;cursor:pointer;font-family:inherit;transition:all .2s}
        .fg-load-btn:hover{border-color:#646cff;color:#646cff}
        .fg-load-btn:disabled{opacity:.4;cursor:not-allowed}
        .fg-loading{text-align:center;padding:40px 0;color:#666}
        .fg-spinner{width:28px;height:28px;border:3px solid #2a2a2a;border-top-color:#646cff;border-radius:50%;animation:fg-spin 1s linear infinite;margin:0 auto 10px}
        @keyframes fg-spin{to{transform:rotate(360deg)}}
        /* Lightbox */
        .fg-lb{position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .3s}
        .fg-lb.open{opacity:1;pointer-events:all}
        .fg-lb img{max-width:90vw;max-height:85vh;border-radius:12px;box-shadow:0 0 40px rgba(0,0,0,.5)}
        .fg-lb-close{position:absolute;top:20px;right:24px;background:rgba(255,255,255,.1);border:none;color:#fff;width:40px;height:40px;border-radius:50%;font-size:1.2rem;cursor:pointer;transition:background .2s}
        .fg-lb-close:hover{background:rgba(255,255,255,.2)}
        .fg-lb-info{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);text-align:center;max-width:80vw}
        .fg-lb-prompt{color:#e8e8e8;font-size:.9rem;margin-bottom:8px}
        .fg-lb-actions{display:flex;gap:8px;justify-content:center}
        .fg-lb-btn{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.15);border-radius:8px;padding:6px 16px;color:#e8e8e8;font-size:.75rem;cursor:pointer;font-family:inherit;transition:all .2s}
        .fg-lb-btn:hover{background:rgba(100,108,255,.3);border-color:#646cff}
        @media(max-width:768px){
          .fg-grid{grid-template-columns:repeat(2,1fr)}
          .fg-header{flex-direction:column;align-items:flex-start}
        }
        @media(max-width:480px){
          .fg-grid{grid-template-columns:1fr}
        }
      </style>
      <div class="fg-wrap">
        <div class="fg-header">
          <div class="fg-title">🖼️ 图床 <span class="badge">gpt-image-2</span></div>
          <div class="fg-count"></div>
        </div>
        <div class="fg-tags">
          ${TAGS.map(t => `<span class="fg-tag${t.id === this.tag ? ' active' : ''}" data-tag="${t.id}" onclick="window.__gallery.setTag('${t.id}')">${t.name}</span>`).join('')}
        </div>
        <div class="fg-grid"></div>
        <div class="fg-load-more"></div>
      </div>
      <div class="fg-lb" onclick="window.__gallery.closeLb()">
        <button class="fg-lb-close" onclick="window.__gallery.closeLb()">✕</button>
        <img onclick="event.stopPropagation()">
        <div class="fg-lb-info" onclick="event.stopPropagation()">
          <div class="fg-lb-prompt"></div>
          <div class="fg-lb-actions">
            <button class="fg-lb-btn" onclick="window.__gallery.download()">💾 下载</button>
            <button class="fg-lb-btn" onclick="window.__gallery.copyUrl()">📋 复制链接</button>
          </div>
        </div>
      </div>`;
      window.__gallery = this;
    }

    async load(append = false) {
      if (this.loading) return;
      this.loading = true;

      const grid = this.el.querySelector('.fg-grid');
      if (!append) {
        grid.innerHTML = '<div class="fg-loading"><div class="fg-spinner"></div><p>加载中...</p></div>';
      }

      try {
        const tagParam = this.tag !== 'all' ? `&tag=${this.tag}` : '';
        const resp = await fetch(`/api/gallery?page=${this.page}&limit=${this.limit}${tagParam}`);
        const result = await resp.json();

        if (result.ok && result.data?.length) {
          if (append) {
            this.images = [...this.images, ...result.data];
          } else {
            this.images = result.data;
          }
          this.total = result.total || this.images.length;
        } else if (!append) {
          this.images = [];
        }

        this.renderGrid();
        this.renderLoadMore();
        this.el.querySelector('.fg-count').textContent = `共 ${this.total} 张`;
      } catch (err) {
        if (!append) {
          grid.innerHTML = `<div class="fg-empty"><div class="fg-empty-icon">😢</div><p>加载失败</p></div>`;
        }
      }
      this.loading = false;
    }

    renderGrid() {
      const grid = this.el.querySelector('.fg-grid');
      if (!this.images.length) {
        grid.innerHTML = `<div class="fg-empty" style="grid-column:1/-1"><div class="fg-empty-icon">🖼️</div><p>还没有图片</p><p style="font-size:.7rem;color:#444;margin-top:4px">用"上图"指令生成第一张吧！</p></div>`;
        return;
      }

      grid.innerHTML = this.images.map((img, i) => `
        <div class="fg-card" onclick="window.__gallery.openLb(${i})">
          <img src="${img.url}" alt="${img.prompt}" loading="lazy">
          <div class="fg-card-info">
            <div class="fg-card-prompt">${img.prompt}</div>
            <div class="fg-card-meta">
              <span class="fg-card-tag">${img.tag || 'general'}</span>
              <span>${img.source || 'gpt-image-2'}</span>
              <span>${this._timeAgo(img.created_at)}</span>
            </div>
          </div>
        </div>
      `).join('');
    }

    renderLoadMore() {
      const wrap = this.el.querySelector('.fg-load-more');
      if (this.images.length < this.total) {
        wrap.innerHTML = `<button class="fg-load-btn" onclick="window.__gallery.loadMore()">加载更多</button>`;
      } else if (this.images.length > 0) {
        wrap.innerHTML = `<div style="text-align:center;color:#444;font-size:.75rem;padding:12px">— 到底了 —</div>`;
      } else {
        wrap.innerHTML = '';
      }
    }

    loadMore() {
      this.page++;
      this.load(true);
    }

    setTag(tag) {
      this.tag = tag;
      this.page = 1;
      this.el.querySelectorAll('.fg-tag').forEach(c => c.classList.toggle('active', c.dataset.tag === tag));
      this.load();
    }

    openLb(index) {
      const img = this.images[index];
      if (!img) return;
      this._currentImg = img;
      const lb = this.el.querySelector('.fg-lb');
      lb.querySelector('img').src = img.url;
      lb.querySelector('.fg-lb-prompt').textContent = img.prompt;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    closeLb() {
      this.el.querySelector('.fg-lb').classList.remove('open');
      document.body.style.overflow = '';
    }

    download() {
      if (!this._currentImg) return;
      const a = document.createElement('a');
      a.href = this._currentImg.url;
      a.download = `gallery-${this._currentImg.prompt.slice(0, 20)}.jpg`;
      a.target = '_blank';
      a.click();
    }

    async copyUrl() {
      if (!this._currentImg) return;
      try {
        await navigator.clipboard.writeText(this._currentImg.url);
        const btn = this.el.querySelector('.fg-lb-btn:nth-child(2)');
        if (btn) { btn.textContent = '✅ 已复制'; setTimeout(() => btn.textContent = '📋 复制链接', 2000); }
      } catch {}
    }

    _timeAgo(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const now = Date.now();
      const diff = now - d.getTime();
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
      return d.toLocaleDateString('zh-CN');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishGallery());
  else new FishGallery();
})();
