/**
 * 小鱼儿 颜色调色板 🐟🎨
 * 取色器 + 调色板 + 色彩搭配生成
 * 用法：<div id="fish-color-palette"></div><script src="/fish-color-palette.js"></script>
 */
(function(){
'use strict';

class FishColorPalette {
  constructor() {
    this.el = document.getElementById('fish-color-palette');
    if (!this.el) return;
    this.color = '#646cff';
    this.render();
  }

  hexToHsl(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return '#' + f(0) + f(8) + f(4);
  }

  hexToRgb(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  generateHarmony(hex) {
    const hsl = this.hexToHsl(hex);
    const { h, s, l } = hsl;
    return {
      complementary: [this.hslToHex(h + 180, s, l)],
      analogous: [this.hslToHex(h - 30, s, l), this.hslToHex(h + 30, s, l)],
      triadic: [this.hslToHex(h + 120, s, l), this.hslToHex(h + 240, s, l)],
      split: [this.hslToHex(h + 150, s, l), this.hslToHex(h + 210, s, l)],
      shades: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95].map(lv => this.hslToHex(h, s, lv)),
    };
  }

  render() {
    const hsl = this.hexToHsl(this.color);
    const rgb = this.hexToRgb(this.color);
    const harmony = this.generateHarmony(this.color);

    this.el.innerHTML = `
      <div class="fcp-wrap">
        <div class="fcp-main">
          <div class="fcp-preview" style="background:${this.color}">
            <input type="color" class="fcp-picker" id="fcp-picker" value="${this.color}" />
          </div>
          <div class="fcp-info">
            <div class="fcp-values">
              <div class="fcp-val-row">
                <span class="fcp-val-label">HEX</span>
                <code class="fcp-val" id="fcp-hex">${this.color.toUpperCase()}</code>
                <button class="fcp-copy" data-val="${this.color.toUpperCase()}" title="复制">📋</button>
              </div>
              <div class="fcp-val-row">
                <span class="fcp-val-label">RGB</span>
                <code class="fcp-val">rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</code>
                <button class="fcp-copy" data-val="rgb(${rgb.r}, ${rgb.g}, ${rgb.b})" title="复制">📋</button>
              </div>
              <div class="fcp-val-row">
                <span class="fcp-val-label">HSL</span>
                <code class="fcp-val">hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)</code>
                <button class="fcp-copy" data-val="hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)" title="复制">📋</button>
              </div>
            </div>
          </div>
        </div>

        <div class="fcp-section">
          <h3 class="fcp-section-title">🌈 色彩搭配</h3>
          <div class="fcp-harmony-group">
            <div class="fcp-harmony-label">互补色</div>
            <div class="fcp-harmony-colors">
              ${harmony.complementary.map(c => `<div class="fcp-harmony-chip" style="background:${c}" title="${c}" data-color="${c}"></div>`).join('')}
            </div>
          </div>
          <div class="fcp-harmony-group">
            <div class="fcp-harmony-label">类似色</div>
            <div class="fcp-harmony-colors">
              ${harmony.analogous.map(c => `<div class="fcp-harmony-chip" style="background:${c}" title="${c}" data-color="${c}"></div>`).join('')}
            </div>
          </div>
          <div class="fcp-harmony-group">
            <div class="fcp-harmony-label">三色组</div>
            <div class="fcp-harmony-colors">
              ${harmony.triadic.map(c => `<div class="fcp-harmony-chip" style="background:${c}" title="${c}" data-color="${c}"></div>`).join('')}
            </div>
          </div>
          <div class="fcp-harmony-group">
            <div class="fcp-harmony-label">分裂互补</div>
            <div class="fcp-harmony-colors">
              ${harmony.split.map(c => `<div class="fcp-harmony-chip" style="background:${c}" title="${c}" data-color="${c}"></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="fcp-section">
          <h3 class="fcp-section-title">🎨 明度阶梯</h3>
          <div class="fcp-shades">
            ${harmony.shades.map((c, i) => `
              <div class="fcp-shade" style="background:${c}" title="${c}" data-color="${c}">
                <span>${i * 10}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="fcp-section">
          <h3 class="fcp-section-title">🎲 随机配色</h3>
          <div class="fcp-random" id="fcp-random">
            ${this.generateRandomPalette().map(c => `
              <div class="fcp-random-chip" style="background:${c}" title="${c}" data-color="${c}"></div>
            `).join('')}
          </div>
          <button class="fcp-refresh" id="fcp-refresh">🔄 换一组</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  generateRandomPalette() {
    const base = Math.floor(Math.random() * 360);
    const palettes = [
      [0, 30, 60, 120, 180].map(d => this.hslToHex((base + d) % 360, 60 + Math.random() * 30, 50 + Math.random() * 20)),
      [0, 120, 240, 60, 180].map(d => this.hslToHex((base + d) % 360, 50 + Math.random() * 40, 40 + Math.random() * 30)),
    ];
    return palettes[Math.floor(Math.random() * palettes.length)];
  }

  bindEvents() {
    document.getElementById('fcp-picker').addEventListener('input', e => {
      this.color = e.target.value;
      this.render();
    });

    this.el.querySelectorAll('.fcp-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.val).then(() => {
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        });
      });
    });

    this.el.querySelectorAll('[data-color]').forEach(el => {
      el.addEventListener('click', () => {
        this.color = el.dataset.color;
        this.render();
      });
    });

    document.getElementById('fcp-refresh')?.addEventListener('click', () => {
      const random = document.getElementById('fcp-random');
      if (random) {
        random.innerHTML = this.generateRandomPalette().map(c => `
          <div class="fcp-random-chip" style="background:${c}" title="${c}" data-color="${c}"></div>
        `).join('');
        random.querySelectorAll('[data-color]').forEach(el => {
          el.addEventListener('click', () => { this.color = el.dataset.color; this.render(); });
        });
      }
    });
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fcp-wrap{max-width:600px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fcp-main{display:flex;gap:20px;margin-bottom:24px;align-items:stretch}
.fcp-preview{width:140px;height:140px;border-radius:16px;position:relative;flex-shrink:0;border:2px solid var(--border,#2a2a3e);cursor:pointer;transition:transform .3s}
.fcp-preview:hover{transform:scale(1.05)}
.fcp-picker{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
.fcp-info{flex:1;display:flex;flex-direction:column;justify-content:center}
.fcp-values{display:flex;flex-direction:column;gap:8px}
.fcp-val-row{display:flex;align-items:center;gap:8px}
.fcp-val-label{font-size:.75rem;color:var(--text-secondary,#888);width:32px;font-weight:700}
.fcp-val{font-size:.85rem;color:var(--text,#e8e8e8);font-family:'Courier New',monospace;flex:1;background:var(--surface,#1a1a2e);padding:6px 10px;border-radius:8px;border:1px solid var(--border,#2a2a3e)}
.fcp-copy{background:none;border:none;cursor:pointer;font-size:.85rem;opacity:.5;transition:all .2s}
.fcp-copy:hover{opacity:1;transform:scale(1.15)}
.fcp-section{margin-bottom:24px}
.fcp-section-title{font-size:1rem;font-weight:700;color:var(--text,#e8e8e8);margin-bottom:12px}
.fcp-harmony-group{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.fcp-harmony-label{font-size:.8rem;color:var(--text-secondary,#888);width:64px;flex-shrink:0}
.fcp-harmony-colors{display:flex;gap:6px}
.fcp-harmony-chip{width:40px;height:40px;border-radius:10px;cursor:pointer;border:2px solid transparent;transition:all .3s}
.fcp-harmony-chip:hover{transform:scale(1.15);border-color:var(--text,#e8e8e8)}
.fcp-shades{display:flex;border-radius:12px;overflow:hidden}
.fcp-shade{flex:1;height:50px;display:flex;align-items:flex-end;justify-content:center;cursor:pointer;transition:transform .2s;position:relative}
.fcp-shade:hover{transform:scaleY(1.2);z-index:1}
.fcp-shade span{font-size:.6rem;color:rgba(128,128,128,.6);padding-bottom:4px}
.fcp-random{display:flex;gap:6px;margin-bottom:12px}
.fcp-random-chip{flex:1;height:50px;border-radius:10px;cursor:pointer;border:2px solid transparent;transition:all .3s}
.fcp-random-chip:hover{transform:scale(1.05);border-color:var(--text,#e8e8e8)}
.fcp-refresh{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:10px;padding:8px 20px;color:var(--text-secondary,#888);font-size:.8rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fcp-refresh:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
@media(max-width:480px){
  .fcp-main{flex-direction:column;align-items:center}
  .fcp-preview{width:100%;height:100px}
  .fcp-harmony-chip{width:32px;height:32px}
  .fcp-shade{height:40px}
}
`;
document.head.appendChild(style);

new FishColorPalette();
})();
