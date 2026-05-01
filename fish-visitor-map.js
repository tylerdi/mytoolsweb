/**
 * 小鱼儿访客地图 🐟🗺️
 * IP 定位 + 世界地图 SVG + 访客统计
 * 用法：<div id="fish-visitor-map"></div><script src="/fish-visitor-map.js"></script>
 */

(function () {
  'use strict';

  const API_STATS = '/api/stats';
  const GEO_API = 'https://ipapi.co/json/';

  function getVisitorId() {
    let id = localStorage.getItem('fish_visitor_id');
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('fish_visitor_id', id);
    }
    return id;
  }

  class FishVisitorMap {
    constructor() {
      this.container = document.getElementById('fish-visitor-map');
      if (!this.container) return;
      this.visitorId = getVisitorId();
      this.stats = { page_views: 0, unique_visitors: 0, today_checkins: 0, today_moods: 0 };
      this.totalStats = { page_views: 0, checkins: 0, moods: 0, comments: 0, capsules: 0 };
      this.visitorLocation = null;
      this.build();
      this.loadData();
    }

    build() {
      const style = document.createElement('style');
      style.textContent = `
        .vm-widget {
          background: var(--surface, #111); border: 1px solid var(--border, #2a2a2a);
          border-radius: 20px; padding:20px; max-width: 560px; width:100%; margin: 0 auto;
          font-family: 'LXGW WenKai', -apple-system, sans-serif;
          position: relative; overflow: hidden;
        }
        .vm-header { text-align: center; margin-bottom: 20px; }
        .vm-title { font-size: 1.2rem; font-weight: 700; color: var(--text, #e8e8e8); }
        .vm-subtitle { font-size: 0.78rem; color: var(--text-dim, #666); margin-top: 4px; }

        /* 地图区 */
        .vm-map-wrap {
          position: relative; background: rgba(0,0,0,0.3); border-radius: 14px;
          padding: 16px; margin-bottom: 20px; overflow: hidden;
        }
        .vm-map-wrap svg { width: 100%; height: auto; display: block; }
        .vm-map-wrap .land { fill: #1a1a2e; stroke: #2a2a4a; stroke-width: 0.3; }
        .vm-map-wrap .visitor-dot {
          fill: var(--accent, #646cff); filter: drop-shadow(0 0 4px rgba(100,108,255,0.6));
          animation: vmPulse 2s ease-in-out infinite;
        }
        .vm-map-wrap .visitor-dot-you {
          fill: #ec4899; filter: drop-shadow(0 0 6px rgba(236,72,153,0.7));
          animation: vmPulseYou 1.5s ease-in-out infinite;
        }
        @keyframes vmPulse { 0%,100% { r: 2; opacity: 0.7; } 50% { r: 3.5; opacity: 1; } }
        @keyframes vmPulseYou { 0%,100% { r: 3; opacity: 0.8; } 50% { r: 5; opacity: 1; } }
        .vm-map-legend {
          display: flex; gap: 16px; justify-content: center; margin-top: 10px;
          font-size: 0.7rem; color: var(--text-dim, #888);
        }
        .vm-legend-dot {
          width: 8px; height: 8px; border-radius: 50%; display: inline-block;
          margin-right: 4px; vertical-align: middle;
        }

        /* 统计数字 */
        .vm-stats-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;
          margin-bottom: 16px;
        }
        .vm-stat-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px; padding: 14px; text-align: center;
        }
        .vm-stat-num {
          font-size: 1.5rem; font-weight: 900; color: var(--text, #e8e8e8);
          font-variant-numeric: tabular-nums;
        }
        .vm-stat-label { font-size: 0.7rem; color: var(--text-dim, #888); margin-top: 2px; }

        /* 位置信息 */
        .vm-location {
          text-align: center; padding: 10px; background: rgba(100,108,255,0.06);
          border-radius: 10px; margin-bottom: 16px;
        }
        .vm-location-text { font-size: 0.82rem; color: var(--text, #ccc); }
        .vm-location-flag { font-size: 1.2rem; margin-right: 6px; }

        /* 总计统计 */
        .vm-total-section { padding-top: 16px; border-top: 1px solid var(--border, #2a2a2a); }
        .vm-total-title { font-size: 0.75rem; color: var(--text-dim, #888); margin-bottom: 10px; text-align: center; }
        .vm-total-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        }
        .vm-total-item { text-align: center; }
        .vm-total-num { font-size: 1.1rem; font-weight: 800; color: var(--accent, #646cff); }
        .vm-total-label { font-size: 0.65rem; color: var(--text-dim, #666); }

        .vm-loading { text-align: center; padding:20px 0; color: var(--text-dim, #888); font-size: 0.85rem; }
        .vm-loading .fish { font-size: 2rem; animation: vmFloat 2s ease-in-out infinite; margin-bottom: 8px; }
        @keyframes vmFloat { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      
        @media(max-width:480px){
          .vm-widget{padding:16px !important;border-radius:12px !important}
          .vm-widget *{max-width:100% !important;box-sizing:border-box}
        }`;
      document.head.appendChild(style);

      this.container.innerHTML = `
        <div class="vm-widget">
          <div class="vm-header">
            <div class="vm-title">🗺️ 访客地图</div>
            <div class="vm-subtitle">来看看谁来过这里</div>
          </div>
          <div class="vm-map-wrap" id="vm-map">
            <div class="vm-loading"><div class="fish">🐟</div>加载地图中...</div>
          </div>
          <div id="vm-stats-area">
            <div class="vm-loading"><div class="fish">🐟</div>加载统计数据...</div>
          </div>
        </div>
      `;
    }

    async loadData() {
      // 并行加载
      await Promise.allSettled([
        this.loadTodayStats(),
        this.loadTotalStats(),
        this.loadVisitorLocation(),
      ]);
      this.renderMap();
      this.renderStats();
    }

    async loadTodayStats() {
      try {
        const res = await fetch(`${API_STATS}?type=today`);
        const data = await res.json();
        if (data.ok && data.stats) {
          this.stats = data.stats;
        }
      } catch (e) { console.warn('今日统计加载失败:', e); }
    }

    async loadTotalStats() {
      try {
        const res = await fetch(`${API_STATS}?type=total`);
        const data = await res.json();
        if (data.ok && data.total) {
          this.totalStats = data.total;
        }
      } catch (e) { console.warn('总统计加载失败:', e); }
    }

    async loadVisitorLocation() {
      try {
        const cached = localStorage.getItem('fish_visitor_location');
        if (cached) {
          this.visitorLocation = JSON.parse(cached);
          return;
        }
        const res = await fetch(GEO_API);
        const data = await res.json();
        if (data.latitude && data.longitude) {
          this.visitorLocation = {
            lat: data.latitude,
            lon: data.longitude,
            city: data.city || '',
            region: data.region || '',
            country: data.country_name || '',
            countryCode: (data.country_code || '').toLowerCase(),
          };
          localStorage.setItem('fish_visitor_location', JSON.stringify(this.visitorLocation));
        }
      } catch (e) { console.warn('位置获取失败:', e); }
    }

    renderMap() {
      const mapEl = this.container.querySelector('#vm-map');
      if (!mapEl) return;

      // 简化的世界地图 SVG（主要大陆轮廓）
      const svgMap = this.getWorldSVG();

      // 计算访客点位置
      let dots = '';
      if (this.visitorLocation) {
        const pos = this.latLonToSvg(this.visitorLocation.lat, this.visitorLocation.lon);
        dots += `<circle class="visitor-dot-you" cx="${pos.x}" cy="${pos.y}" r="4" />`;
      }

      // 添加一些模拟的历史访客点（如果有的话，从 localStorage 读取）
      const historyDots = this.getHistoryDots();
      historyDots.forEach(d => {
        const pos = this.latLonToSvg(d.lat, d.lon);
        dots += `<circle class="visitor-dot" cx="${pos.x}" cy="${pos.y}" r="2.5" opacity="0.6" />`;
      });

      mapEl.innerHTML = `
        ${svgMap.replace('</svg>', dots + '</svg>')}
        <div class="vm-map-legend">
          <span><span class="vm-legend-dot" style="background:#ec4899"></span> 你</span>
          <span><span class="vm-legend-dot" style="background:#646cff"></span> 其他访客</span>
        </div>
      `;

      // 保存当前位置到历史
      if (this.visitorLocation) {
        this.saveHistoryDot(this.visitorLocation.lat, this.visitorLocation.lon);
      }
    }

    renderStats() {
      const area = this.container.querySelector('#vm-stats-area');
      if (!area) return;

      const { page_views, unique_visitors, today_checkins, today_moods } = this.stats;
      const { page_views: totalViews, checkins, moods, comments, capsules } = this.totalStats;
      const loc = this.visitorLocation;

      area.innerHTML = `
        ${loc ? `
          <div class="vm-location">
            <span class="vm-location-text">
              <span class="vm-location-flag">${this.getFlag(loc.countryCode)}</span>
              ${loc.city ? loc.city + ', ' : ''}${loc.region ? loc.region + ', ' : ''}${loc.country}
            </span>
          </div>
        ` : ''}
        <div class="vm-stats-grid">
          <div class="vm-stat-card">
            <div class="vm-stat-num" data-target="${page_views || 0}">0</div>
            <div class="vm-stat-label">今日浏览</div>
          </div>
          <div class="vm-stat-card">
            <div class="vm-stat-num" data-target="${unique_visitors || 0}">0</div>
            <div class="vm-stat-label">今日访客</div>
          </div>
          <div class="vm-stat-card">
            <div class="vm-stat-num" data-target="${today_checkins || 0}">0</div>
            <div class="vm-stat-label">今日签到</div>
          </div>
          <div class="vm-stat-card">
            <div class="vm-stat-num" data-target="${today_moods || 0}">0</div>
            <div class="vm-stat-label">今日心情</div>
          </div>
        </div>
        <div class="vm-total-section">
          <div class="vm-total-title">📊 累计数据</div>
          <div class="vm-total-grid">
            <div class="vm-total-item">
              <div class="vm-total-num" data-target="${totalViews || 0}">0</div>
              <div class="vm-total-label">总浏览</div>
            </div>
            <div class="vm-total-item">
              <div class="vm-total-num" data-target="${checkins || 0}">0</div>
              <div class="vm-total-label">总签到</div>
            </div>
            <div class="vm-total-item">
              <div class="vm-total-num" data-target="${moods || 0}">0</div>
              <div class="vm-total-label">总心情</div>
            </div>
            <div class="vm-total-item">
              <div class="vm-total-num" data-target="${comments || 0}">0</div>
              <div class="vm-total-label">总评论</div>
            </div>
            <div class="vm-total-item">
              <div class="vm-total-num" data-target="${capsules || 0}">0</div>
              <div class="vm-total-label">总胶囊</div>
            </div>
            <div class="vm-total-item">
              <div class="vm-total-num" data-target="${unique_visitors || 0}">0</div>
              <div class="vm-total-label">今日UV</div>
            </div>
          </div>
        </div>
      `;

      // 动画计数器
      this.animateCounters();
    }

    animateCounters() {
      const counters = this.container.querySelectorAll('[data-target]');
      counters.forEach(el => {
        const target = parseInt(el.dataset.target);
        if (target === 0) return;
        const duration = 1200;
        const start = performance.now();
        const animate = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
          el.textContent = Math.floor(target * eased).toLocaleString();
          if (progress < 1) requestAnimationFrame(animate);
          else el.textContent = target.toLocaleString();
        };
        requestAnimationFrame(animate);
      });
    }

    latLonToSvg(lat, lon) {
      // Mercator-like projection to SVG coordinates (viewBox 0 0 360 180)
      const x = (lon + 180);
      const y = (90 - lat);
      return { x, y };
    }

    getFlag(countryCode) {
      if (!countryCode || countryCode.length !== 2) return '🌍';
      const offset = 127397;
      return String.fromCodePoint(
        ...countryCode.toUpperCase().split('').map(c => c.charCodeAt(0) + offset)
      );
    }

    getHistoryDots() {
      try {
        return JSON.parse(localStorage.getItem('fish_visitor_dots') || '[]');
      } catch { return []; }
    }

    saveHistoryDot(lat, lon) {
      try {
        let dots = this.getHistoryDots();
        // 去重（精度 0.5 度内视为同一点）
        const exists = dots.some(d => Math.abs(d.lat - lat) < 0.5 && Math.abs(d.lon - lon) < 0.5);
        if (!exists) {
          dots.push({ lat, lon, time: Date.now() });
          dots = dots.slice(-50); // 最多 50 个点
          localStorage.setItem('fish_visitor_dots', JSON.stringify(dots));
        }
      } catch {}
    }

    getWorldSVG() {
      // Simplified world map SVG with major continental outlines
      return `<svg viewBox="0 0 360 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="360" height="180" fill="transparent"/>
        <!-- 北美洲 -->
        <path class="land" d="M40,25 L55,20 L70,22 L85,28 L95,35 L100,45 L95,55 L90,60 L85,65 L80,70 L75,72 L70,68 L65,60 L60,55 L55,50 L50,45 L45,40 L40,35 Z"/>
        <path class="land" d="M30,35 L40,30 L45,40 L42,50 L38,55 L32,50 L28,42 Z"/>
        <!-- 南美洲 -->
        <path class="land" d="M80,80 L90,75 L100,78 L105,85 L108,95 L110,105 L108,115 L105,125 L100,130 L95,132 L88,128 L82,120 L78,110 L76,100 L78,90 Z"/>
        <!-- 欧洲 -->
        <path class="land" d="M155,22 L165,18 L175,20 L185,25 L190,30 L188,38 L182,42 L175,45 L168,42 L160,38 L155,32 Z"/>
        <path class="land" d="M148,28 L155,25 L158,32 L155,38 L150,35 Z"/>
        <!-- 非洲 -->
        <path class="land" d="M155,55 L170,50 L185,52 L195,58 L200,68 L202,80 L200,92 L195,102 L188,110 L180,115 L172,112 L165,105 L160,95 L155,85 L152,75 L153,65 Z"/>
        <!-- 亚洲 -->
        <path class="land" d="M190,20 L210,15 L230,18 L250,22 L270,25 L285,30 L290,38 L288,48 L280,55 L270,58 L260,55 L250,50 L240,48 L230,45 L220,42 L210,38 L200,35 L192,28 Z"/>
        <path class="land" d="M275,40 L285,35 L295,40 L298,50 L295,60 L288,65 L280,62 L275,55 L272,48 Z"/>
        <!-- 东南亚 -->
        <path class="land" d="M260,65 L270,60 L280,65 L285,72 L282,78 L275,80 L268,76 L262,72 Z"/>
        <!-- 澳大利亚 -->
        <path class="land" d="M280,100 L300,95 L315,100 L320,110 L318,120 L310,125 L300,122 L290,118 L282,110 Z"/>
        <!-- 格陵兰 -->
        <path class="land" d="M100,8 L115,5 L125,10 L128,18 L122,22 L112,20 L105,15 Z"/>
        <!-- 日本 -->
        <path class="land" d="M298,32 L302,28 L306,32 L305,38 L300,40 L296,36 Z"/>
      </svg>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishVisitorMap());
  } else {
    new FishVisitorMap();
  }
})();
