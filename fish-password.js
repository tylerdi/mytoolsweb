/**
 * 小鱼儿 密码生成器 🐟🔐
 * 安全随机密码生成 + 强度检测
 * 用法：<div id="fish-password"></div><script src="/fish-password.js"></script>
 */
(function(){
'use strict';

const CHARS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

class FishPassword {
  constructor() {
    this.el = document.getElementById('fish-password');
    if (!this.el) return;
    this.length = 16;
    this.useUpper = true;
    this.useLower = true;
    this.useDigits = true;
    this.useSymbols = true;
    this.password = '';
    this.history = JSON.parse(localStorage.getItem('fish_pw_history') || '[]');
    this.generate();
    this.render();
  }

  generate() {
    let pool = '';
    if (this.useUpper) pool += CHARS.upper;
    if (this.useLower) pool += CHARS.lower;
    if (this.useDigits) pool += CHARS.digits;
    if (this.useSymbols) pool += CHARS.symbols;
    if (!pool) { pool = CHARS.lower; this.useLower = true; }

    const arr = new Uint32Array(this.length);
    crypto.getRandomValues(arr);
    this.password = Array.from(arr, v => pool[v % pool.length]).join('');

    // 确保至少包含每种选中的字符
    const ensure = [];
    if (this.useUpper) ensure.push(CHARS.upper);
    if (this.useLower) ensure.push(CHARS.lower);
    if (this.useDigits) ensure.push(CHARS.digits);
    if (this.useSymbols) ensure.push(CHARS.symbols);

    if (ensure.length > 1 && this.length >= ensure.length) {
      const pw = this.password.split('');
      const positions = new Set();
      ensure.forEach((charset, i) => {
        let pos;
        do { pos = Math.floor(Math.random() * this.length); } while (positions.has(pos));
        positions.add(pos);
        pw[pos] = charset[Math.floor(Math.random() * charset.length)];
      });
      this.password = pw.join('');
    }
  }

  getStrength() {
    const pw = this.password;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (pw.length >= 12) score += 1;
    if (pw.length >= 16) score += 1;
    if (pw.length >= 20) score += 1;
    if (/[a-z]/.test(pw)) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pw)) score += 1;
    if (new Set(pw).size >= pw.length * 0.7) score += 1;

    if (score <= 3) return { level: 'weak', label: '弱', color: '#ef4444', pct: 25 };
    if (score <= 5) return { level: 'fair', label: '一般', color: '#f59e0b', pct: 50 };
    if (score <= 7) return { level: 'good', label: '良好', color: '#22c55e', pct: 75 };
    return { level: 'strong', label: '极强', color: '#06b6d4', pct: 100 };
  }

  saveToHistory() {
    this.history.unshift({
      pw: this.password,
      time: Date.now(),
    });
    if (this.history.length > 20) this.history = this.history.slice(0, 20);
    localStorage.setItem('fish_pw_history', JSON.stringify(this.history));
  }

  render() {
    const strength = this.getStrength();
    const timeStr = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    this.el.innerHTML = `
      <div class="fpw-wrap">
        <div class="fpw-output">
          <div class="fpw-pw" id="fpw-pw">${this.password}</div>
          <div class="fpw-actions">
            <button class="fpw-btn" id="fpw-copy" title="复制">📋</button>
            <button class="fpw-btn" id="fpw-refresh" title="重新生成">🔄</button>
          </div>
        </div>

        <div class="fpw-strength">
          <div class="fpw-strength-bar">
            <div class="fpw-strength-fill" style="width:${strength.pct}%;background:${strength.color}"></div>
          </div>
          <span class="fpw-strength-label" style="color:${strength.color}">${strength.label}</span>
        </div>

        <div class="fpw-options">
          <div class="fpw-slider-row">
            <label>长度</label>
            <input type="range" id="fpw-length" min="6" max="64" value="${this.length}" class="fpw-slider" />
            <span class="fpw-length-val" id="fpw-length-val">${this.length}</span>
          </div>
          <div class="fpw-checks">
            <label class="fpw-check"><input type="checkbox" id="fpw-upper" ${this.useUpper?'checked':''} /> ABC</label>
            <label class="fpw-check"><input type="checkbox" id="fpw-lower" ${this.useLower?'checked':''} /> abc</label>
            <label class="fpw-check"><input type="checkbox" id="fpw-digits" ${this.useDigits?'checked':''} /> 123</label>
            <label class="fpw-check"><input type="checkbox" id="fpw-symbols" ${this.useSymbols?'checked':''} /> !@#</label>
          </div>
        </div>

        ${this.history.length > 0 ? `
          <div class="fpw-history">
            <div class="fpw-history-title">最近生成</div>
            ${this.history.slice(0, 5).map(h => `
              <div class="fpw-history-item">
                <code class="fpw-history-pw">${h.pw}</code>
                <button class="fpw-history-copy" data-pw="${h.pw}" title="复制">📋</button>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 复制
    document.getElementById('fpw-copy').addEventListener('click', () => {
      navigator.clipboard.writeText(this.password).then(() => {
        const btn = document.getElementById('fpw-copy');
        btn.textContent = '✅';
        setTimeout(() => btn.textContent = '📋', 1500);
        this.saveToHistory();
      });
    });

    // 刷新
    document.getElementById('fpw-refresh').addEventListener('click', () => {
      this.generate();
      this.render();
    });

    // 长度滑块
    const slider = document.getElementById('fpw-length');
    const valEl = document.getElementById('fpw-length-val');
    slider.addEventListener('input', () => {
      this.length = parseInt(slider.value);
      valEl.textContent = this.length;
      this.generate();
      this.updateDisplay();
    });

    // 选项
    ['upper','lower','digits','symbols'].forEach(key => {
      document.getElementById(`fpw-${key}`).addEventListener('change', e => {
        this['use' + key.charAt(0).toUpperCase() + key.slice(1)] = e.target.checked;
        // 至少保留一种
        if (!this.useUpper && !this.useLower && !this.useDigits && !this.useSymbols) {
          e.target.checked = true;
          this['use' + key.charAt(0).toUpperCase() + key.slice(1)] = true;
          return;
        }
        this.generate();
        this.render();
      });
    });

    // 历史复制
    this.el.querySelectorAll('.fpw-history-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.pw).then(() => {
          btn.textContent = '✅';
          setTimeout(() => btn.textContent = '📋', 1500);
        });
      });
    });
  }

  updateDisplay() {
    const pwEl = document.getElementById('fpw-pw');
    const strength = this.getStrength();
    if (pwEl) pwEl.textContent = this.password;
    // 更新强度条
    const fill = this.el.querySelector('.fpw-strength-fill');
    const label = this.el.querySelector('.fpw-strength-label');
    if (fill) { fill.style.width = strength.pct + '%'; fill.style.background = strength.color; }
    if (label) { label.textContent = strength.label; label.style.color = strength.color; }
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fpw-wrap{max-width:550px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fpw-output{display:flex;align-items:center;gap:12px;background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:14px;padding:16px 20px;margin-bottom:16px}
.fpw-pw{flex:1;font-size:1.2rem;font-weight:700;color:var(--text,#e8e8e8);word-break:break-all;font-family:'Courier New',monospace;letter-spacing:1px;user-select:all}
.fpw-actions{display:flex;gap:6px;flex-shrink:0}
.fpw-btn{background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a3e);border-radius:10px;width:40px;height:40px;cursor:pointer;font-size:1.1rem;transition:all .3s;display:flex;align-items:center;justify-content:center}
.fpw-btn:hover{border-color:var(--accent,#646cff);transform:scale(1.08)}
.fpw-strength{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.fpw-strength-bar{flex:1;height:6px;background:var(--border,#2a2a3e);border-radius:3px;overflow:hidden}
.fpw-strength-fill{height:100%;border-radius:3px;transition:all .5s}
.fpw-strength-label{font-size:.85rem;font-weight:700;min-width:36px}
.fpw-options{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:14px;padding:20px;margin-bottom:16px}
.fpw-slider-row{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.fpw-slider-row label{font-size:.85rem;color:var(--text-secondary,#888);min-width:30px}
.fpw-slider{flex:1;-webkit-appearance:none;height:6px;background:var(--border,#2a2a3e);border-radius:3px;outline:none}
.fpw-slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--accent,#646cff);cursor:pointer;transition:transform .2s}
.fpw-slider::-webkit-slider-thumb:hover{transform:scale(1.2)}
.fpw-length-val{font-size:1.1rem;font-weight:800;color:var(--accent,#646cff);min-width:28px;text-align:right;font-variant-numeric:tabular-nums}
.fpw-checks{display:flex;gap:10px;flex-wrap:wrap}
.fpw-check{display:flex;align-items:center;gap:6px;font-size:.85rem;color:var(--text-secondary,#888);cursor:pointer;user-select:none}
.fpw-check input{accent-color:var(--accent,#646cff);width:16px;height:16px}
.fpw-history{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:14px;padding:16px}
.fpw-history-title{font-size:.8rem;color:var(--text-secondary,#888);margin-bottom:10px}
.fpw-history-item{display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border,#2a2a3e)}
.fpw-history-item:last-child{border-bottom:none}
.fpw-history-pw{flex:1;font-size:.8rem;color:var(--text,#e8e8e8);font-family:'Courier New',monospace;word-break:break-all;user-select:all}
.fpw-history-copy{background:none;border:none;cursor:pointer;font-size:.85rem;opacity:.5;transition:all .2s}
.fpw-history-copy:hover{opacity:1;transform:scale(1.15)}
@media(max-width:480px){
  .fpw-pw{font-size:1rem}
  .fpw-checks{gap:8px}
}
`;
document.head.appendChild(style);

new FishPassword();
})();
