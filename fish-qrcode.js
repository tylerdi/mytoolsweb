/**
 * 小鱼儿 二维码生成器 🐟📱
 * 文本/URL 生成二维码
 * 用法：<div id="fish-qrcode"></div><script src="/fish-qrcode.js"></script>
 */
(function(){
'use strict';

class FishQRCode {
  constructor() {
    this.el = document.getElementById('fish-qrcode');
    if (!this.el) return;
    this.size = 256;
    this.fg = '#e8e8e8';
    this.bg = '#0a0a0a';
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="fqr-wrap">
        <div class="fqr-input-area">
          <textarea class="fqr-input" id="fqr-input" placeholder="输入文本或网址..." rows="3" maxlength="2000"></textarea>
          <div class="fqr-options">
            <div class="fqr-opt">
              <label>尺寸</label>
              <select id="fqr-size">
                <option value="128">128px</option>
                <option value="256" selected>256px</option>
                <option value="512">512px</option>
                <option value="1024">1024px</option>
              </select>
            </div>
            <div class="fqr-opt">
              <label>前景色</label>
              <input type="color" id="fqr-fg" value="${this.fg}" />
            </div>
            <div class="fqr-opt">
              <label>背景色</label>
              <input type="color" id="fqr-bg" value="${this.bg}" />
            </div>
          </div>
        </div>
        <div class="fqr-preview" id="fqr-preview">
          <div class="fqr-placeholder">
            <span>📱</span>
            <p>输入内容后自动生成</p>
          </div>
        </div>
        <div class="fqr-actions" id="fqr-actions" style="display:none">
          <button class="fqr-btn" id="fqr-download">💾 下载 PNG</button>
          <button class="fqr-btn" id="fqr-copy-img">📋 复制图片</button>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const input = document.getElementById('fqr-input');
    const sizeEl = document.getElementById('fqr-size');
    const fgEl = document.getElementById('fqr-fg');
    const bgEl = document.getElementById('fqr-bg');

    let debounce;
    const generate = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        this.size = parseInt(sizeEl.value);
        this.fg = fgEl.value;
        this.bg = bgEl.value;
        this.generate(input.value);
      }, 300);
    };

    input.addEventListener('input', generate);
    sizeEl.addEventListener('change', generate);
    fgEl.addEventListener('input', generate);
    bgEl.addEventListener('input', generate);

    document.getElementById('fqr-download')?.addEventListener('click', () => this.download());
    document.getElementById('fqr-copy-img')?.addEventListener('click', () => this.copyImage());
  }

  generate(text) {
    const preview = document.getElementById('fqr-preview');
    const actions = document.getElementById('fqr-actions');

    if (!text.trim()) {
      preview.innerHTML = '<div class="fqr-placeholder"><span>📱</span><p>输入内容后自动生成</p></div>';
      actions.style.display = 'none';
      return;
    }

    try {
      const qr = this.encode(text, 'M');
      const modules = qr.modules;
      const count = modules.length;
      const cellSize = Math.floor(this.size / (count + 8));
      const canvasSize = cellSize * (count + 8);

      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      // 背景
      ctx.fillStyle = this.bg;
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // 二维码
      ctx.fillStyle = this.fg;
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (modules[r][c]) {
            ctx.fillRect((c + 4) * cellSize, (r + 4) * cellSize, cellSize, cellSize);
          }
        }
      }

      preview.innerHTML = '';
      canvas.style.maxWidth = '100%';
      canvas.style.borderRadius = '12px';
      canvas.style.cursor = 'pointer';
      canvas.title = '点击下载';
      canvas.addEventListener('click', () => this.download());
      preview.appendChild(canvas);
      actions.style.display = 'flex';
      this._canvas = canvas;
    } catch (e) {
      preview.innerHTML = `<div class="fqr-placeholder"><span>⚠️</span><p>内容过长或包含不支持的字符</p></div>`;
      actions.style.display = 'none';
    }
  }

  download() {
    if (!this._canvas) return;
    const a = document.createElement('a');
    a.download = 'qrcode.png';
    a.href = this._canvas.toDataURL('image/png');
    a.click();
  }

  copyImage() {
    if (!this._canvas) return;
    this._canvas.toBlob(blob => {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => {
        const btn = document.getElementById('fqr-copy-img');
        btn.textContent = '✅ 已复制';
        setTimeout(() => btn.textContent = '📋 复制图片', 2000);
      }).catch(() => alert('复制失败，请直接右键保存'));
    });
  }

  // QR Code 编码器（简化版，支持文本/URL）
  encode(text, ecl) {
    const data = this.getData(text);
    const version = this.getMinVersion(data.length, ecl);
    const ecLevel = { L: 0, M: 1, Q: 2, H: 3 }[ecl] || 1;
    const totalCodewords = this.getTotalCodewords(version);
    const ecCodewords = this.getEcCodewords(version, ecLevel);
    const dataCodewords = totalCodewords - ecCodewords;

    // 填充数据
    const buffer = new Uint8Array(totalCodewords);
    for (let i = 0; i < data.length && i < dataCodewords; i++) buffer[i] = data[i];
    // 填充码字
    const pad = [0xEC, 0x11];
    let padIdx = 0;
    for (let i = data.length; i < dataCodewords; i++) {
      buffer[i] = pad[padIdx % 2];
      padIdx++;
    }

    // 生成模块矩阵
    const size = version * 4 + 17;
    const matrix = Array.from({ length: size }, () => Array(size).fill(null));
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));

    this.placeFinders(matrix, reserved, size);
    this.placeAlignments(matrix, reserved, version, size);
    this.placeTiming(matrix, reserved, size);
    this.placeData(matrix, reserved, buffer, size);
    this.applyMask(matrix, reserved, size, 0);
    this.placeFormatInfo(matrix, ecLevel, 0, size);

    return { modules: matrix, version, size };
  }

  getData(text) {
    const bytes = [];
    // Byte mode indicator: 0100
    bytes.push(0x40 | (text.length >> 4));
    bytes.push((text.length & 0x0F) << 4);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (i === 0) {
        bytes[bytes.length - 1] |= (code >> 4);
        bytes.push((code & 0x0F) << 4);
      } else if (i % 2 === 0) {
        bytes[bytes.length - 1] |= (code >> 4);
        bytes.push((code & 0x0F) << 4);
      } else {
        bytes[bytes.length - 1] |= (code >> 4);
        bytes.push((code & 0x0F) << 4);
      }
    }
    // 终止符
    if (bytes.length % 2 === 1) bytes.push(0);
    return bytes;
  }

  getMinVersion(dataBytes, ecl) {
    for (let v = 1; v <= 10; v++) {
      const total = this.getTotalCodewords(v);
      const ec = this.getEcCodewords(v, { L: 0, M: 1, Q: 2, H: 3 }[ecl] || 1);
      if (total - ec >= Math.ceil(dataBytes / 2)) return v;
    }
    return 10;
  }

  getTotalCodewords(v) {
    const sizes = [0,26,44,70,100,134,172,196,242,292,346];
    return sizes[v] || 346;
  }

  getEcCodewords(v, ecl) {
    const table = [
      [0,0,0,0],
      [7,10,13,17],
      [10,16,22,28],
      [15,26,18,22],
      [20,18,26,16],
      [26,24,18,22],
      [18,16,24,28],
      [20,18,18,26],
      [24,22,22,26],
      [30,22,20,24],
      [18,26,24,28],
    ];
    return (table[v] || table[10])[ecl];
  }

  placeFinders(matrix, reserved, size) {
    const positions = [[0, 0], [0, size - 7], [size - 7, 0]];
    for (const [r, c] of positions) {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
          reserved[rr][cc] = true;
          if (dr === -1 || dr === 7 || dc === -1 || dc === 7) {
            matrix[rr][cc] = false;
          } else if (dr === 0 || dr === 6 || dc === 0 || dc === 6) {
            matrix[rr][cc] = true;
          } else if (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4) {
            matrix[rr][cc] = true;
          } else {
            matrix[rr][cc] = false;
          }
        }
      }
    }
  }

  placeAlignments(matrix, reserved, version, size) {
    if (version < 2) return;
    const positions = this.getAlignmentPositions(version);
    for (const r of positions) {
      for (const c of positions) {
        if (reserved[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const rr = r + dr, cc = c + dc;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
            reserved[rr][cc] = true;
            if (Math.abs(dr) === 2 || Math.abs(dc) === 2) {
              matrix[rr][cc] = true;
            } else if (dr === 0 && dc === 0) {
              matrix[rr][cc] = true;
            } else {
              matrix[rr][cc] = false;
            }
          }
        }
      }
    }
  }

  getAlignmentPositions(v) {
    if (v === 1) return [];
    const first = 6;
    const last = v * 4 + 10;
    const count = Math.floor(v / 7) + 2;
    const step = Math.ceil((last - first) / (count - 1));
    const positions = [first];
    for (let i = 1; i < count - 1; i++) positions.push(first + step * i);
    positions.push(last);
    return positions;
  }

  placeTiming(matrix, reserved, size) {
    for (let i = 8; i < size - 8; i++) {
      if (!reserved[6][i]) {
        reserved[6][i] = true;
        matrix[6][i] = i % 2 === 0;
      }
      if (!reserved[i][6]) {
        reserved[i][6] = true;
        matrix[i][6] = i % 2 === 0;
      }
    }
    // Dark module
    matrix[size - 8][8] = true;
    reserved[size - 8][8] = true;
  }

  placeData(matrix, reserved, data, size) {
    let bitIdx = 0;
    const bits = [];
    for (const byte of data) {
      for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
    }

    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const col = right - j;
          const upward = ((right + 1) & 2) === 0;
          const row = upward ? size - 1 - vert : vert;
          if (row < 0 || row >= size || col < 0 || col >= size) continue;
          if (reserved[row][col]) continue;
          matrix[row][col] = bitIdx < bits.length ? bits[bitIdx] === 1 : false;
          bitIdx++;
        }
      }
    }
  }

  applyMask(matrix, reserved, size, mask) {
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (reserved[r][c]) continue;
        let invert = false;
        switch (mask) {
          case 0: invert = (r + c) % 2 === 0; break;
          default: invert = (r + c) % 2 === 0;
        }
        if (invert) matrix[r][c] = !matrix[r][c];
      }
    }
  }

  placeFormatInfo(matrix, ecLevel, mask, size) {
    const formatBits = ((ecLevel << 3) | mask) << 10;
    let bits = formatBits;
    // BCH error correction
    let gen = 0x537;
    for (let i = 14; i >= 10; i--) {
      if (bits & (1 << i)) bits ^= gen << (i - 10);
    }
    bits = (formatBits | bits) ^ 0x5412;

    // Place around top-left finder
    const positions1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i++) {
      const bit = (bits >> (14 - i)) & 1;
      const [r, c] = positions1[i];
      matrix[r][c] = bit === 1;
    }

    // Place around bottom-left and top-right finders
    const positions2 = [
      [size - 1, 8], [size - 2, 8], [size - 3, 8], [size - 4, 8],
      [size - 5, 8], [size - 6, 8], [size - 7, 8],
      [8, size - 8], [8, size - 7], [8, size - 6], [8, size - 5],
      [8, size - 4], [8, size - 3], [8, size - 2], [8, size - 1]
    ];
    for (let i = 0; i < 15; i++) {
      const bit = (bits >> (14 - i)) & 1;
      const [r, c] = positions2[i];
      if (r >= 0 && r < size && c >= 0 && c < size) {
        matrix[r][c] = bit === 1;
      }
    }
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fqr-wrap{max-width:550px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fqr-input-area{margin-bottom:20px}
.fqr-input{width:100%;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:14px;padding:14px 16px;color:var(--text,#e8e8e8);font-size:.95rem;font-family:inherit;resize:vertical;outline:none;transition:border-color .3s}
.fqr-input:focus{border-color:var(--accent,#646cff)}
.fqr-input::placeholder{color:var(--text-secondary,#666)}
.fqr-options{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;align-items:center}
.fqr-opt{display:flex;align-items:center;gap:6px}
.fqr-opt label{font-size:.8rem;color:var(--text-secondary,#888)}
.fqr-opt select{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:8px;padding:6px 10px;color:var(--text,#e8e8e8);font-size:.8rem;font-family:inherit;outline:none}
.fqr-opt input[type="color"]{width:32px;height:32px;border:1px solid var(--border,#2a2a3e);border-radius:8px;cursor:pointer;padding:2px;background:var(--surface,#1a1a2e)}
.fqr-preview{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:16px;padding:24px;text-align:center;min-height:200px;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.fqr-placeholder{color:var(--text-secondary,#666)}
.fqr-placeholder span{font-size:2.5rem;display:block;margin-bottom:8px;opacity:.4}
.fqr-placeholder p{font-size:.85rem}
.fqr-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.fqr-btn{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px;padding:10px 20px;color:var(--text,#e8e8e8);font-size:.85rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fqr-btn:hover{border-color:var(--accent,#646cff);transform:translateY(-2px)}
@media(max-width:480px){
  .fqr-options{gap:8px}
  .fqr-preview{padding:16px}
}
`;
document.head.appendChild(style);

new FishQRCode();
})();
