/**
 * 小鱼儿打字测速 ⌨️🐟
 * 测你的打字速度（WPM）
 * 用法：<div id="fish-typing-test"></div><script src="/fish-typing-test.js"></script>
 */
(function () {
  'use strict';

  const SENTENCES = [
    '小鱼儿在数字花园里自由自在地游来游去',
    '人工智能正在改变我们生活的方方面面',
    '每天进步一点点，积少成多就会有大变化',
    '代码是程序员写给机器的情书',
    '生活就像一盒巧克力，你永远不知道下一颗是什么味道',
    '世界上最快乐的事，莫过于为理想而奋斗',
    '学而不思则罔，思而不学则殆',
    '千里之行，始于足下',
    '今天你摸鱼了吗？',
    '保持热爱，奔赴下一场山海',
  ];

  class FishTypingTest {
    constructor() {
      this.el = document.getElementById('fish-typing-test');
      if (!this.el) return;
      this.sentence = '';
      this.startTime = 0;
      this.running = false;
      this.finished = false;
      this.bestWpm = parseInt(localStorage.getItem('typing_best') || '0');
      this.render();
    }

    start() {
      this.sentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
      this.startTime = 0;
      this.running = false;
      this.finished = false;
      const input = this.el.querySelector('.tt-input');
      input.value = '';
      input.disabled = false;
      input.focus();
      this.el.querySelector('.tt-target').textContent = this.sentence;
      this.el.querySelector('.tt-result').innerHTML = '';
      this.el.querySelector('.tt-status').textContent = '开始输入即可计时';
      this.updateHighlight('');
    }

    onInput(val) {
      if (this.finished) return;
      if (!this.running && val.length > 0) {
        this.running = true;
        this.startTime = Date.now();
        this.el.querySelector('.tt-status').textContent = '⏱ 计时中...';
      }
      this.updateHighlight(val);

      if (val === this.sentence) {
        this.finished = true;
        this.running = false;
        const elapsed = (Date.now() - this.startTime) / 1000;
        const wpm = Math.round((this.sentence.length / 5) / (elapsed / 60));
        const input = this.el.querySelector('.tt-input');
        input.disabled = true;

        let isNewBest = false;
        if (wpm > this.bestWpm) {
          this.bestWpm = wpm;
          localStorage.setItem('typing_best', wpm);
          isNewBest = true;
        }

        this.el.querySelector('.tt-result').innerHTML = `
          <div style="font-size:2rem;margin-bottom:8px">🏆</div>
          <div style="font-size:1.5rem;font-weight:900;color:#22c55e">${wpm} WPM</div>
          <div style="font-size:.8rem;color:#888;margin-top:4px">用时 ${elapsed.toFixed(1)} 秒</div>
          ${isNewBest ? '<div style="color:#d4a853;margin-top:8px;font-size:.85rem">🎉 新纪录！</div>' : `<div style="color:#555;margin-top:4px;font-size:.7rem">最佳: ${this.bestWpm} WPM</div>`}
        `;
        this.el.querySelector('.tt-status').textContent = '✅ 完成！';
      }
    }

    updateHighlight(val) {
      const target = this.sentence;
      let html = '';
      for (let i = 0; i < target.length; i++) {
        if (i < val.length) {
          html += val[i] === target[i]
            ? `<span style="color:#22c55e">${target[i]}</span>`
            : `<span style="color:#ff6b9d;text-decoration:underline">${target[i]}</span>`;
        } else if (i === val.length) {
          html += `<span style="background:rgba(100,108,255,.3);border-bottom:2px solid #646cff">${target[i]}</span>`;
        } else {
          html += `<span style="color:#555">${target[i]}</span>`;
        }
      }
      this.el.querySelector('.tt-target').innerHTML = html;
    }

    render() {
      this.el.innerHTML = `
      <style>
        .tt-wrap{background:var(--surface,#111);border:1px solid var(--border,#1e1e1e);border-radius:16px;padding:24px;font-family:'LXGW WenKai',-apple-system,sans-serif;max-width:480px;margin:0 auto}
        .tt-title{font-size:1rem;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
        .tt-title .badge{font-size:.6rem;background:rgba(255,107,157,.15);color:#ff6b9d;padding:2px 8px;border-radius:6px}
        .tt-target{font-size:1.1rem;line-height:2;padding:16px;background:#0a0a0a;border-radius:10px;margin-bottom:12px;min-height:60px;letter-spacing:1px}
        .tt-input{width:100%;background:#0a0a0a;border:1px solid #2a2a2a;border-radius:10px;padding:12px;color:#e8e8e8;font-size:1rem;font-family:inherit;outline:none;letter-spacing:1px}
        .tt-input:focus{border-color:#646cff}
        .tt-input:disabled{opacity:.5}
        .tt-status{font-size:.75rem;color:#888;margin-top:8px;text-align:center}
        .tt-result{text-align:center;margin-top:16px;padding:16px;background:rgba(255,255,255,.02);border-radius:10px}
        .tt-actions{margin-top:12px;text-align:center}
        .tt-btn{background:linear-gradient(135deg,#646cff,#ff6b9d);border:none;border-radius:10px;padding:10px 24px;color:#fff;font-size:.85rem;cursor:pointer;font-family:inherit;font-weight:600}
        .tt-best{font-size:.7rem;color:#555;text-align:center;margin-top:8px}
      </style>
      <div class="tt-wrap">
        <div class="tt-title">⌨️ 打字测速 <span class="badge">WPM</span></div>
        <div class="tt-target" style="color:#555;text-align:center">点击「开始」挑战</div>
        <input class="tt-input" placeholder="在这里输入..." disabled oninput="this.closest('.tt-wrap').__tt.onInput(this.value)">
        <div class="tt-status">准备好了吗？</div>
        <div class="tt-result"></div>
        <div class="tt-actions"><button class="tt-btn" onclick="this.closest('.tt-wrap').__tt.start()">🚀 开始</button></div>
        <div class="tt-best">最佳记录: ${this.bestWpm} WPM</div>
      </div>`;
      this.el.querySelector('.tt-wrap').__tt = this;
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => new FishTypingTest());
  else new FishTypingTest();
})();
