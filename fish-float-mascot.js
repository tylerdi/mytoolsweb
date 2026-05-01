/**
 * 小鱼儿浮动吉祥物 🐟✨
 * 屏幕右下角浮动小鱼，跟随鼠标，点击显示小贴士
 * 用法：<script src="/fish-float-mascot.js"></script>
 */

(function () {
  'use strict';

  const MESSAGES = [
    '欢迎来到 tylerzhang.xyz！🐟',
    '试试签到功能，解锁成就哦 🎯',
    '博客每天更新，都是 AI 写的文章 ✍️',
    '灵感墙可以许愿，时间胶囊会帮你封存 🎁',
    '心情日记记录每一天的感受 📝',
    '留言板上说点什么吧，我会回复你的 💬',
    '你知道吗？这个网站是用 Cloudflare 搭建的 ☁️',
    '按 Tab 键可以快速导航网站 ♿',
    '深呼吸，你今天很棒 🌟',
    '代码改变世界，一行一个脚印 💻',
    '如果觉得无聊，试试小游戏 🎮',
    '每个访客都会被记住在访客地图上 🗺️',
    '生活不止眼前的代码，还有远方的 bug 🐛',
    '今天也要元气满满哦！⚡',
    '小鱼儿 24 小时在线陪你 🐟',
    '试试切换深色/浅色主题 🌓',
    '你的 IP 已经被标记在访客地图上了 📍',
    '这个网站没有广告，纯属热爱 ❤️',
    '想聊天？随时找我 🤖',
    '加载速度够快吗？用的是 CDN 🚀',
  ];

  const TIPS_INTERVAL = 15000; // 15秒换一条

  class FishFloatMascot {
    constructor() {
      this.minimized = false;
      this.currentMsg = 0;
      this.mouseX = window.innerWidth;
      this.mouseY = window.innerHeight;
      this.fishX = 0;
      this.fishY = 0;
      this.animFrame = null;
      this.tipTimer = null;
      this.dragging = false;
      this.dragOffsetX = 0;
      this.dragOffsetY = 0;
      this.build();
      this.startAnimation();
      this.bindMouse();
    }

    build() {
      const style = document.createElement('style');
      style.textContent = `
        .fm-container {
          position: fixed; bottom: 24px; right: 24px; z-index: 9990;
          font-family: 'LXGW WenKai', -apple-system, sans-serif;
          transition: opacity 0.3s, transform 0.3s;
        }
        .fm-container.fm-hidden { opacity: 0; pointer-events: none; transform: scale(0.8); }
        .fm-fish {
          width: 52px; height: 52px; border-radius: 50%;
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border: 2px solid rgba(100,108,255,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem; cursor: pointer; user-select: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 20px rgba(100,108,255,0.1);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          position: relative;
        }
        .fm-fish:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(0,0,0,0.5), 0 0 30px rgba(100,108,255,0.2);
          border-color: rgba(100,108,255,0.5);
        }
        .fm-fish:active { transform: scale(0.95); }
        .fm-fish-emoji {
          display: inline-block;
          animation: fmSwim 3s ease-in-out infinite;
        }
        @keyframes fmSwim {
          0%,100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(2px) rotate(3deg); }
          75% { transform: translateX(-2px) rotate(-3deg); }
        }

        /* 气泡 */
        .fm-bubble {
          position: absolute; bottom: calc(100% + 10px); right: 0;
          background: rgba(20,20,30,0.95); backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(100,108,255,0.2);
          border-radius: 14px 14px 4px 14px;
          padding: 10px 14px; min-width: 180px; max-width: 240px;
          font-size: 0.78rem; color: var(--text, #e0d8c8); line-height: 1.6;
          box-shadow: 0 8px 30px rgba(0,0,0,0.4);
          opacity: 0; transform: translateY(8px) scale(0.95);
          transition: opacity 0.3s, transform 0.3s;
          pointer-events: none;
        }
        .fm-bubble.fm-show {
          opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
        }
        .fm-bubble::after {
          content: ''; position: absolute; bottom: -6px; right: 18px;
          width: 12px; height: 12px; background: rgba(20,20,30,0.95);
          border-right: 1px solid rgba(100,108,255,0.2);
          border-bottom: 1px solid rgba(100,108,255,0.2);
          transform: rotate(45deg);
        }
        .fm-bubble-close {
          position: absolute; top: 4px; right: 8px;
          background: none; border: none; color: #555; cursor: pointer;
          font-size: 0.7rem; padding: 2px;
        }
        .fm-bubble-close:hover { color: #aaa; }

        /* 最小化按钮 */
        .fm-minimize {
          position: absolute; top: -6px; right: -6px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #333; border: 1px solid #555;
          color: #888; font-size: 0.6rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .fm-fish:hover .fm-minimize { opacity: 1; }
        .fm-minimize:hover { background: #555; color: #fff; }

        /* 恢复按钮 */
        .fm-restore {
          position: fixed; bottom: 24px; right: 24px; z-index: 9990;
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(20,20,30,0.8); border: 1px solid rgba(100,108,255,0.2);
          color: var(--text-dim, #888); font-size: 0.9rem; cursor: pointer;
          display: none; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .fm-restore:hover { border-color: var(--accent, #646cff); color: var(--text, #e8e8e8); }
        .fm-restore.fm-show { display: flex; }

        /* 跟随动画 */
        @keyframes fmBob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `;
      document.head.appendChild(style);

      // 主容器
      this.el = document.createElement('div');
      this.el.className = 'fm-container';
      this.el.innerHTML = `
        <div class="fm-bubble" id="fm-bubble">
          <button class="fm-bubble-close" id="fm-bubble-close">✕</button>
          <div class="fm-bubble-text">${MESSAGES[0]}</div>
        </div>
        <div class="fm-fish" id="fm-fish">
          <span class="fm-fish-emoji">🐟</span>
          <div class="fm-minimize" id="fm-minimize" title="最小化">−</div>
        </div>
      `;
      document.body.appendChild(this.el);

      // 恢复按钮
      this.restoreBtn = document.createElement('button');
      this.restoreBtn.className = 'fm-restore';
      this.restoreBtn.innerHTML = '🐟';
      this.restoreBtn.title = '打开小鱼儿';
      document.body.appendChild(this.restoreBtn);

      // 事件
      const fishEl = this.el.querySelector('#fm-fish');
      const bubbleEl = this.el.querySelector('#fm-bubble');
      const bubbleClose = this.el.querySelector('#fm-bubble-close');
      const minimizeBtn = this.el.querySelector('#fm-minimize');

      fishEl.addEventListener('click', (e) => {
        if (this.dragging) return;
        e.stopPropagation();
        this.toggleBubble();
      });

      bubbleClose.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideBubble();
      });

      minimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.minimize();
      });

      this.restoreBtn.addEventListener('click', () => this.restore());

      // 点击外部关闭气泡
      document.addEventListener('click', (e) => {
        if (!this.el.contains(e.target)) this.hideBubble();
      });

      // 拖拽
      this.initDrag(fishEl);
    }

    initDrag(el) {
      let startX, startY, startLeft, startBottom, moved;

      const onMouseDown = (e) => {
        if (e.button !== 0) return;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        const rect = this.el.getBoundingClientRect();
        startLeft = rect.left;
        startBottom = window.innerHeight - rect.bottom;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          moved = true;
          this.dragging = true;
          const newLeft = startLeft + dx;
          const newBottom = startBottom - dy;
          this.el.style.right = 'auto';
          this.el.style.bottom = Math.max(0, Math.min(window.innerHeight - 60, newBottom)) + 'px';
          this.el.style.left = Math.max(0, Math.min(window.innerWidth - 60, newLeft)) + 'px';
        }
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        setTimeout(() => { this.dragging = false; }, 50);
      };

      el.addEventListener('mousedown', onMouseDown);

      // Touch support
      el.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;
        const rect = this.el.getBoundingClientRect();
        startLeft = rect.left;
        startBottom = window.innerHeight - rect.bottom;
        moved = false;
      }, { passive: true });

      el.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
          moved = true;
          this.dragging = true;
          const newLeft = startLeft + dx;
          const newBottom = startBottom - dy;
          this.el.style.right = 'auto';
          this.el.style.bottom = Math.max(0, newBottom) + 'px';
          this.el.style.left = Math.max(0, Math.min(window.innerWidth - 60, newLeft)) + 'px';
        }
      }, { passive: true });

      el.addEventListener('touchend', () => {
        if (!moved) this.toggleBubble();
        setTimeout(() => { this.dragging = false; }, 50);
      });
    }

    bindMouse() {
      document.addEventListener('mousemove', (e) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
      });
    }

    startAnimation() {
      const animate = () => {
        if (!this.minimized) {
          // 微妙的视差效果
          const rect = this.el.getBoundingClientRect();
          const fishCenterX = rect.left + 26;
          const fishCenterY = rect.top + 26;
          const dx = (this.mouseX - fishCenterX) * 0.015;
          const dy = (this.mouseY - fishCenterY) * 0.015;
          const fishEmoji = this.el.querySelector('.fm-fish-emoji');
          if (fishEmoji) {
            fishEmoji.style.transform = `translate(${Math.max(-5, Math.min(5, dx))}px, ${Math.max(-5, Math.min(5, dy))}px)`;
          }
        }
        this.animFrame = requestAnimationFrame(animate);
      };
      animate();

      // 自动轮换消息
      this.tipTimer = setInterval(() => {
        this.currentMsg = (this.currentMsg + 1) % MESSAGES.length;
        const textEl = this.el.querySelector('.fm-bubble-text');
        if (textEl) textEl.textContent = MESSAGES[this.currentMsg];
      }, TIPS_INTERVAL);
    }

    toggleBubble() {
      const bubble = this.el.querySelector('#fm-bubble');
      if (bubble.classList.contains('fm-show')) {
        this.hideBubble();
      } else {
        this.showBubble();
      }
    }

    showBubble() {
      const bubble = this.el.querySelector('#fm-bubble');
      bubble.classList.add('fm-show');
    }

    hideBubble() {
      const bubble = this.el.querySelector('#fm-bubble');
      bubble.classList.remove('fm-show');
    }

    minimize() {
      this.minimized = true;
      this.hideBubble();
      this.el.classList.add('fm-hidden');
      this.restoreBtn.classList.add('fm-show');
    }

    restore() {
      this.minimized = false;
      this.el.classList.remove('fm-hidden');
      this.restoreBtn.classList.remove('fm-show');
    }

    destroy() {
      if (this.animFrame) cancelAnimationFrame(this.animFrame);
      if (this.tipTimer) clearInterval(this.tipTimer);
      this.el.remove();
      this.restoreBtn.remove();
    }
  }

  // 自动初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishFloatMascot());
  } else {
    new FishFloatMascot();
  }
})();
