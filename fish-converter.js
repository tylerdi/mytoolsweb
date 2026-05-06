/**
 * 小鱼儿 单位换算 🐟📐
 * 长度/重量/温度/面积/体积/速度/数据/时间 换算
 * 用法：<div id="fish-converter"></div><script src="/fish-converter.js"></script>
 */
(function(){
'use strict';

const CATEGORIES = [
  {
    name: '长度', icon: '📏',
    units: [
      { name: '毫米 mm', factor: 0.001 },
      { name: '厘米 cm', factor: 0.01 },
      { name: '米 m', factor: 1 },
      { name: '千米 km', factor: 1000 },
      { name: '英寸 in', factor: 0.0254 },
      { name: '英尺 ft', factor: 0.3048 },
      { name: '码 yd', factor: 0.9144 },
      { name: '英里 mi', factor: 1609.344 },
      { name: '海里 nmi', factor: 1852 },
    ],
  },
  {
    name: '重量', icon: '⚖️',
    units: [
      { name: '毫克 mg', factor: 0.000001 },
      { name: '克 g', factor: 0.001 },
      { name: '千克 kg', factor: 1 },
      { name: '吨 t', factor: 1000 },
      { name: '盎司 oz', factor: 0.0283495 },
      { name: '磅 lb', factor: 0.453592 },
      { name: '斤', factor: 0.5 },
      { name: '两', factor: 0.05 },
    ],
  },
  {
    name: '温度', icon: '🌡️',
    units: [
      { name: '摄氏度 °C', factor: 'celsius' },
      { name: '华氏度 °F', factor: 'fahrenheit' },
      { name: '开尔文 K', factor: 'kelvin' },
    ],
    special: true,
  },
  {
    name: '面积', icon: '📐',
    units: [
      { name: '平方毫米 mm²', factor: 0.000001 },
      { name: '平方厘米 cm²', factor: 0.0001 },
      { name: '平方米 m²', factor: 1 },
      { name: '公顷 ha', factor: 10000 },
      { name: '平方千米 km²', factor: 1000000 },
      { name: '亩', factor: 666.667 },
      { name: '平方英尺 ft²', factor: 0.092903 },
      { name: '英亩 ac', factor: 4046.86 },
    ],
  },
  {
    name: '体积', icon: '🧪',
    units: [
      { name: '毫升 mL', factor: 0.000001 },
      { name: '升 L', factor: 0.001 },
      { name: '立方米 m³', factor: 1 },
      { name: '加仑 gal', factor: 0.00378541 },
      { name: '立方英尺 ft³', factor: 0.0283168 },
    ],
  },
  {
    name: '速度', icon: '🚀',
    units: [
      { name: '米/秒 m/s', factor: 1 },
      { name: '千米/时 km/h', factor: 0.277778 },
      { name: '英里/时 mph', factor: 0.44704 },
      { name: '节 kn', factor: 0.514444 },
      { name: '马赫 Mach', factor: 343 },
    ],
  },
  {
    name: '数据', icon: '💾',
    units: [
      { name: '字节 B', factor: 1 },
      { name: 'KB', factor: 1024 },
      { name: 'MB', factor: 1048576 },
      { name: 'GB', factor: 1073741824 },
      { name: 'TB', factor: 1099511627776 },
    ],
  },
  {
    name: '时间', icon: '⏱️',
    units: [
      { name: '毫秒 ms', factor: 0.001 },
      { name: '秒 s', factor: 1 },
      { name: '分钟 min', factor: 60 },
      { name: '小时 h', factor: 3600 },
      { name: '天 d', factor: 86400 },
      { name: '周', factor: 604800 },
      { name: '月 (30天)', factor: 2592000 },
      { name: '年 (365天)', factor: 31536000 },
    ],
  },
];

function convertTemp(value, from, to) {
  let celsius;
  if (from === 'celsius') celsius = value;
  else if (from === 'fahrenheit') celsius = (value - 32) * 5 / 9;
  else celsius = value - 273.15;

  if (to === 'celsius') return celsius;
  if (to === 'fahrenheit') return celsius * 9 / 5 + 32;
  return celsius + 273.15;
}

class FishConverter {
  constructor() {
    this.el = document.getElementById('fish-converter');
    if (!this.el) return;
    this.category = 0;
    this.fromUnit = 0;
    this.toUnit = 1;
    this.value = '';
    this.render();
  }

  render() {
    const cat = CATEGORIES[this.category];
    const result = this.calculate();

    this.el.innerHTML = `
      <div class="fcv-wrap">
        <div class="fcv-cats">
          ${CATEGORIES.map((c, i) => `
            <button class="fcv-cat ${i === this.category ? 'active' : ''}" data-idx="${i}">
              ${c.icon} ${c.name}
            </button>
          `).join('')}
        </div>

        <div class="fcv-convert">
          <div class="fcv-input-group">
            <select class="fcv-select" id="fcv-from">
              ${cat.units.map((u, i) => `<option value="${i}" ${i === this.fromUnit ? 'selected' : ''}>${u.name}</option>`).join('')}
            </select>
            <input class="fcv-input" id="fcv-value" type="number" placeholder="输入数值" value="${this.value}" />
          </div>

          <div class="fcv-swap" id="fcv-swap">⇅</div>

          <div class="fcv-input-group">
            <select class="fcv-select" id="fcv-to">
              ${cat.units.map((u, i) => `<option value="${i}" ${i === this.toUnit ? 'selected' : ''}>${u.name}</option>`).join('')}
            </select>
            <div class="fcv-result" id="fcv-result">${result}</div>
          </div>
        </div>

        <div class="fcv-table">
          <h3 class="fcv-table-title">${cat.icon} ${cat.name}换算表</h3>
          <div class="fcv-table-grid">
            ${cat.units.map((u, i) => {
              const val = this.value ? this.convert(parseFloat(this.value), this.fromUnit, i) : '—';
              const display = typeof val === 'number' ? this.formatNum(val) : val;
              return `
                <div class="fcv-table-row ${i === this.fromUnit ? 'from' : ''} ${i === this.toUnit ? 'to' : ''}">
                  <span class="fcv-table-name">${u.name}</span>
                  <span class="fcv-table-val">${display}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // 分类切换
    this.el.querySelectorAll('.fcv-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        this.category = parseInt(btn.dataset.idx);
        this.fromUnit = 0;
        this.toUnit = Math.min(1, CATEGORIES[this.category].units.length - 1);
        this.render();
      });
    });

    // 单位切换
    document.getElementById('fcv-from').addEventListener('change', e => {
      this.fromUnit = parseInt(e.target.value);
      this.render();
      document.getElementById('fcv-value').focus();
    });
    document.getElementById('fcv-to').addEventListener('change', e => {
      this.toUnit = parseInt(e.target.value);
      this.render();
    });

    // 输入
    document.getElementById('fcv-value').addEventListener('input', e => {
      this.value = e.target.value;
      const result = this.calculate();
      document.getElementById('fcv-result').textContent = result;
      this.updateTable();
    });

    // 交换
    document.getElementById('fcv-swap').addEventListener('click', () => {
      [this.fromUnit, this.toUnit] = [this.toUnit, this.fromUnit];
      this.render();
    });
  }

  calculate() {
    if (!this.value) return '—';
    const val = parseFloat(this.value);
    if (isNaN(val)) return '—';
    const result = this.convert(val, this.fromUnit, this.toUnit);
    return this.formatNum(result);
  }

  convert(value, fromIdx, toIdx) {
    const cat = CATEGORIES[this.category];
    if (cat.special) {
      const from = cat.units[fromIdx].factor;
      const to = cat.units[toIdx].factor;
      return convertTemp(value, from, to);
    }
    const fromFactor = cat.units[fromIdx].factor;
    const toFactor = cat.units[toIdx].factor;
    return value * fromFactor / toFactor;
  }

  formatNum(num) {
    if (Math.abs(num) >= 1e10 || (Math.abs(num) < 0.0001 && num !== 0)) {
      return num.toExponential(4);
    }
    if (Number.isInteger(num)) return num.toLocaleString();
    return parseFloat(num.toPrecision(8)).toString();
  }

  updateTable() {
    const cat = CATEGORIES[this.category];
    const rows = this.el.querySelectorAll('.fcv-table-row');
    rows.forEach((row, i) => {
      const valEl = row.querySelector('.fcv-table-val');
      if (!this.value || isNaN(parseFloat(this.value))) {
        valEl.textContent = '—';
      } else {
        const result = this.convert(parseFloat(this.value), this.fromUnit, i);
        valEl.textContent = this.formatNum(result);
      }
    });
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fcv-wrap{max-width:600px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fcv-cats{display:flex;gap:6px;margin-bottom:24px;flex-wrap:wrap;justify-content:center}
.fcv-cat{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:20px;padding:6px 14px;color:var(--text-secondary,#888);font-size:.8rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fcv-cat.active{background:rgba(100,108,255,.15);border-color:var(--accent,#646cff);color:var(--accent,#646cff);font-weight:700}
.fcv-cat:hover{border-color:var(--accent,#646cff)}
.fcv-convert{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
.fcv-input-group{display:flex;gap:10px;align-items:center}
.fcv-select{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:10px;padding:12px 14px;color:var(--text,#e8e8e8);font-size:.85rem;font-family:inherit;outline:none;min-width:120px;flex-shrink:0}
.fcv-input{flex:1;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 16px;color:var(--text,#e8e8e8);font-size:1.2rem;font-weight:700;font-family:inherit;outline:none;transition:border-color .3s;font-variant-numeric:tabular-nums}
.fcv-input:focus{border-color:var(--accent,#646cff)}
.fcv-input::placeholder{color:var(--text-secondary,#666);font-weight:400}
.fcv-result{flex:1;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 16px;color:var(--accent,#646cff);font-size:1.2rem;font-weight:700;font-variant-numeric:tabular-nums;min-height:48px;display:flex;align-items:center;word-break:break-all}
.fcv-swap{text-align:center;cursor:pointer;font-size:1.4rem;color:var(--text-secondary,#888);transition:all .3s;user-select:none}
.fcv-swap:hover{color:var(--accent,#646cff);transform:scale(1.2)}
.fcv-table{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:14px;padding:16px}
.fcv-table-title{font-size:.9rem;font-weight:700;color:var(--text,#e8e8e8);margin-bottom:12px}
.fcv-table-grid{display:flex;flex-direction:column;gap:4px}
.fcv-table-row{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border-radius:8px;transition:background .2s}
.fcv-table-row:hover{background:rgba(255,255,255,.03)}
.fcv-table-row.from{background:rgba(100,108,255,.1);border-left:3px solid var(--accent,#646cff)}
.fcv-table-row.to{background:rgba(34,197,94,.1);border-left:3px solid #22c55e}
.fcv-table-name{font-size:.8rem;color:var(--text-secondary,#888)}
.fcv-table-val{font-size:.85rem;font-weight:600;color:var(--text,#e8e8e8);font-family:'Courier New',monospace;font-variant-numeric:tabular-nums}
@media(max-width:480px){
  .fcv-cats{gap:4px}
  .fcv-cat{padding:5px 10px;font-size:.7rem}
  .fcv-input-group{flex-direction:column;gap:6px}
  .fcv-select{width:100%;min-width:auto}
  .fcv-input,.fcv-result{font-size:1rem}
}
`;
document.head.appendChild(style);

new FishConverter();
})();
