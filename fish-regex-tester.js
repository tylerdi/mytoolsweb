/**
 * 小鱼儿 正则测试器 🐟🔍
 * 实时正则表达式测试 + 匹配高亮
 * 用法：<div id="fish-regex-tester"></div><script src="/fish-regex-tester.js"></script>
 */
(function(){
'use strict';

const PRESETS = [
  { name: '手机号', regex: '1[3-9]\\d{9}', flags: 'g', text: '我的手机号是13812345678，座机010-88886666' },
  { name: '邮箱', regex: '[\\w.-]+@[\\w.-]+\\.\\w+', flags: 'gi', text: '联系我：test@example.com 或 admin@site.org' },
  { name: 'URL', regex: 'https?://[^\\s<>"{}|\\\\^`\\[\\]]+', flags: 'gi', text: '访问 https://tylerzhang.xyz 或 http://example.com/path?q=1' },
  { name: 'IP地址', regex: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g', text: '服务器 192.168.1.100 和 10.0.0.1' },
  { name: '日期', regex: '\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}', flags: 'g', text: '生日 2000-01-15，纪念日 2025/12/25' },
  { name: 'HTML标签', regex: '<[^>]+>', flags: 'g', text: '<div class="hello">Hello</div><br/><img src="a.png" />' },
  { name: '中文', regex: '[\\u4e00-\\u9fff]+', flags: 'g', text: 'Hello世界！这是123中文test测试' },
  { name: '十六进制颜色', regex: '#[0-9a-fA-F]{3,8}\\b', flags: 'gi', text: '颜色 #ff6600、#fff、#646cff、#00000080' },
];

class FishRegexTester {
  constructor() {
    this.el = document.getElementById('fish-regex-tester');
    if (!this.el) return;
    this.render();
  }

  render() {
    this.el.innerHTML = `
      <div class="frx-wrap">
        <div class="frx-inputs">
          <div class="frx-regex-row">
            <span class="frx-slash">/</span>
            <input class="frx-regex" id="frx-regex" placeholder="正则表达式" value="" />
            <span class="frx-slash">/</span>
            <input class="frx-flags" id="frx-flags" placeholder="g" value="g" maxlength="6" />
          </div>
          <textarea class="frx-text" id="frx-text" placeholder="测试文本..." rows="5"></textarea>
        </div>

        <div class="frx-presets">
          <span class="frx-presets-label">常用：</span>
          ${PRESETS.map((p, i) => `<button class="frx-preset" data-idx="${i}">${p.name}</button>`).join('')}
        </div>

        <div class="frx-result" id="frx-result">
          <div class="frx-empty">输入正则和文本，实时查看匹配结果</div>
        </div>

        <div class="frx-matches" id="frx-matches"></div>

        <div class="frx-cheatsheet">
          <details>
            <summary>正则速查表</summary>
            <div class="frx-cheat-grid">
              <div class="frx-cheat-item"><code>.</code> 任意字符</div>
              <div class="frx-cheat-item"><code>\\d</code> 数字</div>
              <div class="frx-cheat-item"><code>\\w</code> 字母数字</div>
              <div class="frx-cheat-item"><code>\\s</code> 空白</div>
              <div class="frx-cheat-item"><code>\\b</code> 单词边界</div>
              <div class="frx-cheat-item"><code>^</code> 行首</div>
              <div class="frx-cheat-item"><code>$</code> 行尾</div>
              <div class="frx-cheat-item"><code>*</code> 0次或多次</div>
              <div class="frx-cheat-item"><code>+</code> 1次或多次</div>
              <div class="frx-cheat-item"><code>?</code> 0次或1次</div>
              <div class="frx-cheat-item"><code>{n}</code> n次</div>
              <div class="frx-cheat-item"><code>{n,m}</code> n到m次</div>
              <div class="frx-cheat-item"><code>[abc]</code> 字符集</div>
              <div class="frx-cheat-item"><code>[^abc]</code> 排除</div>
              <div class="frx-cheat-item"><code>(abc)</code> 分组</div>
              <div class="frx-cheat-item"><code>a|b</code> 或</div>
              <div class="frx-cheat-item"><code>(?=)</code> 前瞻</div>
              <div class="frx-cheat-item"><code>(?!)</code> 负前瞻</div>
            </div>
          </details>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const regexInput = document.getElementById('frx-regex');
    const flagsInput = document.getElementById('frx-flags');
    const textInput = document.getElementById('frx-text');

    const test = () => this.test(regexInput.value, flagsInput.value, textInput.value);

    regexInput.addEventListener('input', test);
    flagsInput.addEventListener('input', test);
    textInput.addEventListener('input', test);

    // 预设
    this.el.querySelectorAll('.frx-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = PRESETS[parseInt(btn.dataset.idx)];
        regexInput.value = p.regex;
        flagsInput.value = p.flags;
        textInput.value = p.text;
        test();
      });
    });
  }

  test(pattern, flags, text) {
    const resultEl = document.getElementById('frx-result');
    const matchesEl = document.getElementById('frx-matches');

    if (!pattern || !text) {
      resultEl.innerHTML = '<div class="frx-empty">输入正则和文本，实时查看匹配结果</div>';
      matchesEl.innerHTML = '';
      return;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;

      if (flags.includes('g')) {
        while ((match = regex.exec(text)) !== null) {
          matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
          if (match[0].length === 0) regex.lastIndex++;
        }
      } else {
        match = regex.exec(text);
        if (match) matches.push({ value: match[0], index: match.index, groups: match.slice(1) });
      }

      // 高亮文本
      let highlighted = this.escape(text);
      if (matches.length > 0) {
        // 从后往前替换避免偏移
        const sortedMatches = [...matches].sort((a, b) => b.index - a.index);
        for (const m of sortedMatches) {
          const before = highlighted.slice(0, m.index);
          const matchText = highlighted.slice(m.index, m.index + m.value.length);
          const after = highlighted.slice(m.index + m.value.length);
          highlighted = before + '<mark>' + matchText + '</mark>' + after;
        }
      }

      resultEl.innerHTML = `
        <div class="frx-highlighted">${highlighted}</div>
        <div class="frx-status ${matches.length > 0 ? 'found' : 'none'}">
          ${matches.length > 0 ? `✅ 找到 ${matches.length} 个匹配` : '❌ 无匹配'}
        </div>
      `;

      // 匹配详情
      if (matches.length > 0) {
        matchesEl.innerHTML = `
          <div class="frx-match-list">
            ${matches.slice(0, 50).map((m, i) => `
              <div class="frx-match-item">
                <span class="frx-match-idx">#${i + 1}</span>
                <code class="frx-match-val">${this.escape(m.value)}</code>
                <span class="frx-match-pos">位置 ${m.index}${m.value.length > 0 ? '-' + (m.index + m.value.length - 1) : ''}</span>
                ${m.groups.length > 0 ? `<span class="frx-match-groups">分组: ${m.groups.map(g => `<code>${this.escape(g || '')}</code>`).join(' ')}</span>` : ''}
              </div>
            `).join('')}
            ${matches.length > 50 ? `<div class="frx-match-more">...还有 ${matches.length - 50} 个匹配</div>` : ''}
          </div>
        `;
      } else {
        matchesEl.innerHTML = '';
      }
    } catch (e) {
      resultEl.innerHTML = `<div class="frx-error">⚠️ ${this.escape(e.message)}</div>`;
      matchesEl.innerHTML = '';
    }
  }

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.frx-wrap{max-width:700px;margin:0 auto;padding:20px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.frx-inputs{margin-bottom:16px}
.frx-regex-row{display:flex;align-items:center;gap:4px;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:10px 14px;margin-bottom:12px;font-family:'Courier New',monospace;transition:border-color .3s}
.frx-regex-row:focus-within{border-color:var(--accent,#646cff)}
.frx-slash{color:var(--accent,#646cff);font-size:1.2rem;font-weight:700}
.frx-regex{flex:1;background:none;border:none;color:var(--text,#e8e8e8);font-size:1rem;font-family:inherit;outline:none}
.frx-flags{width:48px;background:none;border:none;color:var(--accent,#646cff);font-size:1rem;font-family:inherit;outline:none;font-weight:700}
.frx-text{width:100%;background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:12px;padding:12px 14px;color:var(--text,#e8e8e8);font-size:.9rem;font-family:inherit;resize:vertical;outline:none;line-height:1.8;transition:border-color .3s}
.frx-text:focus{border-color:var(--accent,#646cff)}
.frx-text::placeholder{color:var(--text-secondary,#666)}
.frx-presets{display:flex;align-items:center;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.frx-presets-label{font-size:.8rem;color:var(--text-secondary,#888)}
.frx-preset{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:16px;padding:4px 12px;color:var(--text-secondary,#888);font-size:.75rem;cursor:pointer;font-family:inherit;transition:all .3s}
.frx-preset:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
.frx-result{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:14px;padding:16px;margin-bottom:12px;min-height:80px}
.frx-empty{color:var(--text-secondary,#666);text-align:center;font-size:.85rem}
.frx-error{color:#ef4444;font-size:.85rem}
.frx-highlighted{font-size:.9rem;line-height:2;color:var(--text,#e8e8e8);word-break:break-all;font-family:inherit;white-space:pre-wrap}
.frx-highlighted mark{background:rgba(100,108,255,.3);color:var(--text,#e8e8e8);border-radius:3px;padding:1px 2px;border-bottom:2px solid var(--accent,#646cff)}
.frx-status{margin-top:10px;font-size:.8rem;font-weight:700}
.frx-status.found{color:#22c55e}
.frx-status.none{color:var(--text-secondary,#888)}
.frx-match-list{display:flex;flex-direction:column;gap:6px}
.frx-match-item{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:10px;font-size:.8rem;flex-wrap:wrap}
.frx-match-idx{color:var(--accent,#646cff);font-weight:700;font-size:.75rem}
.frx-match-val{background:rgba(100,108,255,.1);padding:2px 8px;border-radius:6px;font-family:'Courier New',monospace;color:var(--text,#e8e8e8);word-break:break-all}
.frx-match-pos{color:var(--text-secondary,#666);font-size:.7rem}
.frx-match-groups{color:var(--text-secondary,#888);font-size:.7rem}
.frx-match-groups code{background:rgba(34,197,94,.1);padding:1px 6px;border-radius:4px;margin:0 2px}
.frx-match-more{color:var(--text-secondary,#666);font-size:.8rem;text-align:center;padding:8px}
.frx-cheatsheet{margin-top:16px}
.frx-cheatsheet summary{font-size:.85rem;color:var(--text-secondary,#888);cursor:pointer;user-select:none}
.frx-cheatsheet summary:hover{color:var(--text,#e8e8e8)}
.frx-cheat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:12px;padding:12px;background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px}
.frx-cheat-item{font-size:.8rem;color:var(--text-secondary,#aaa)}
.frx-cheat-item code{color:var(--accent,#646cff);font-weight:700;margin-right:4px}
`;
document.head.appendChild(style);

new FishRegexTester();
})();
