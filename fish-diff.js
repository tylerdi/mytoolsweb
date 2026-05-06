/**
 * 小鱼儿 文本对比 🐟📝
 * 逐行对比两段文本，高亮差异
 * 用法：<div id="fish-diff"></div><script src="/fish-diff.js"></script>
 */
(function(){
'use strict';

class FishDiff {
  constructor() {
    this.el = document.getElementById('fish-diff');
    if (!this.el) return;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="fdiff-wrap">
        <div class="fdiff-inputs">
          <div class="fdiff-input-group">
            <label class="fdiff-label">📝 原始文本</label>
            <textarea class="fdiff-textarea" id="fdiff-a" placeholder="粘贴原始文本..." rows="8"></textarea>
          </div>
          <div class="fdiff-input-group">
            <label class="fdiff-label">📝 修改后文本</label>
            <textarea class="fdiff-textarea" id="fdiff-b" placeholder="粘贴修改后文本..." rows="8"></textarea>
          </div>
        </div>
        <div class="fdiff-actions">
          <button class="fdiff-btn" id="fdiff-compare">🔍 开始对比</button>
          <button class="fdiff-btn fdiff-secondary" id="fdiff-swap">⇅ 交换</button>
          <button class="fdiff-btn fdiff-secondary" id="fdiff-clear">🗑️ 清空</button>
        </div>
        <div class="fdiff-stats" id="fdiff-stats" style="display:none"></div>
        <div class="fdiff-result" id="fdiff-result"></div>
      </div>
    `;
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('fdiff-compare').addEventListener('click', () => this.compare());
    document.getElementById('fdiff-swap').addEventListener('click', () => {
      const a = document.getElementById('fdiff-a');
      const b = document.getElementById('fdiff-b');
      [a.value, b.value] = [b.value, a.value];
    });
    document.getElementById('fdiff-clear').addEventListener('click', () => {
      document.getElementById('fdiff-a').value = '';
      document.getElementById('fdiff-b').value = '';
      document.getElementById('fdiff-result').innerHTML = '';
      document.getElementById('fdiff-stats').style.display = 'none';
    });
  }

  compare() {
    const textA = document.getElementById('fdiff-a').value;
    const textB = document.getElementById('fdiff-b').value;
    const linesA = textA.split('\n');
    const linesB = textB.split('\n');

    const result = this.lcs(linesA, linesB);
    const stats = { added: 0, removed: 0, unchanged: 0 };
    let html = '<div class="fdiff-table"><table>';

    for (const item of result) {
      if (item.type === 'same') {
        stats.unchanged++;
        html += `<tr class="fdiff-same"><td class="fdiff-num">${item.lineA}</td><td class="fdiff-num">${item.lineB}</td><td class="fdiff-mark"> </td><td class="fdiff-text">${this.escape(item.text)}</td></tr>`;
      } else if (item.type === 'removed') {
        stats.removed++;
        html += `<tr class="fdiff-removed"><td class="fdiff-num">${item.lineA}</td><td class="fdiff-num"></td><td class="fdiff-mark">−</td><td class="fdiff-text">${this.escape(item.text)}</td></tr>`;
      } else if (item.type === 'added') {
        stats.added++;
        html += `<tr class="fdiff-added"><td class="fdiff-num"></td><td class="fdiff-num">${item.lineB}</td><td class="fdiff-mark">+</td><td class="fdiff-text">${this.escape(item.text)}</td></tr>`;
      }
    }

    html += '</table></div>';

    const statsEl = document.getElementById('fdiff-stats');
    statsEl.style.display = 'flex';
    statsEl.innerHTML = `
      <span class="fdiff-stat fdiff-stat-same">不变 ${stats.unchanged}</span>
      <span class="fdiff-stat fdiff-stat-add">新增 ${stats.added}</span>
      <span class="fdiff-stat fdiff-stat-del">删除 ${stats.removed}</span>
      <span class="fdiff-stat">总行 ${Math.max(linesA.length, linesB.length)}</span>
    `;

    document.getElementById('fdiff-result').innerHTML = html;
  }

  lcs(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1]);

    const result = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
        result.unshift({ type: 'same', text: a[i-1], lineA: i, lineB: j });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
        result.unshift({ type: 'added', text: b[j-1], lineB: j });
        j--;
      } else {
        result.unshift({ type: 'removed', text: a[i-1], lineA: i });
        i--;
      }
    }
    return result;
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
}

const style = document.createElement('style');
style.textContent = `
.fdiff-wrap{max-width:800px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fdiff-inputs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
.fdiff-input-group{display:flex;flex-direction:column}
.fdiff-label{font-size:.85rem;color:var(--text-secondary,#888);margin-bottom:6px;font-weight:600}
.fdiff-textarea{flex:1;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 14px;color:var(--text,#e8e8e8);font-size:.85rem;font-family:'Courier New',monospace;resize:vertical;outline:none;line-height:1.6;transition:border-color .3s;box-sizing:border-box;min-width:0}
.fdiff-textarea:focus{border-color:var(--accent,#646cff)}
.fdiff-textarea::placeholder{color:var(--text-secondary,#666)}
.fdiff-actions{display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap}
.fdiff-btn{background:var(--accent,#646cff);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:.85rem;cursor:pointer;font-family:inherit;transition:all .3s}
.fdiff-btn:hover{filter:brightness(1.1);transform:translateY(-2px)}
.fdiff-btn.fdiff-secondary{background:var(--surface,#1a1a2e);color:var(--text-secondary,#888);border:1px solid var(--border,#2a2a3e)}
.fdiff-btn.fdiff-secondary:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
.fdiff-stats{display:flex;gap:16px;padding:12px 16px;background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px;margin-bottom:16px;flex-wrap:wrap}
.fdiff-stat{font-size:.8rem;font-weight:600}
.fdiff-stat-same{color:var(--text-secondary,#888)}
.fdiff-stat-add{color:#22c55e}
.fdiff-stat-del{color:#ef4444}
.fdiff-table{overflow-x:auto;border:1px solid var(--border,#2a2a3e);border-radius:12px}
.fdiff-table table{width:100%;border-collapse:collapse;font-size:.8rem;font-family:'Courier New',monospace;line-height:1.8}
.fdiff-table tr{border-bottom:1px solid rgba(42,42,62,.3)}
.fdiff-table tr:last-child{border-bottom:none}
.fdiff-num{padding:4px 10px;color:var(--text-secondary,#666);text-align:right;width:36px;user-select:none;border-right:1px solid var(--border,#2a2a3e);font-size:.7rem}
.fdiff-mark{padding:4px 6px;width:20px;text-align:center;font-weight:700;user-select:none}
.fdiff-text{padding:4px 14px;white-space:pre-wrap;word-break:break-all}
.fdiff-same{background:transparent}
.fdiff-same .fdiff-text{color:var(--text,#aaa)}
.fdiff-removed{background:rgba(239,68,68,.08)}
.fdiff-removed .fdiff-mark{color:#ef4444}
.fdiff-removed .fdiff-text{color:#ef4444}
.fdiff-added{background:rgba(34,197,94,.08)}
.fdiff-added .fdiff-mark{color:#22c55e}
.fdiff-added .fdiff-text{color:#22c55e}
@media(max-width:600px){
  .fdiff-inputs{grid-template-columns:1fr}
  .fdiff-textarea{min-height:120px}
}
`;
document.head.appendChild(style);

new FishDiff();
})();
