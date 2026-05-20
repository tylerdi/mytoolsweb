/**
 * 小鱼儿网站统计面板 🐟📊
 * 展示访问量、日活、热门页面等数据
 * 用法：<div id="fish-stats"></div><script src="/fish-stats.js"></script>
 */

(function () {
  'use strict';

  const API = '/api/stats';

  class FishStats {
    constructor() {
      this.container = document.getElementById('fish-stats');
      if (!this.container) return;
      this.load();
    }

    async load() {
      try {
        const [todayRes, totalRes, popularRes] = await Promise.all([
          fetch(`${API}?type=today`).then(r => r.json()),
          fetch(`${API}?type=total`).then(r => r.json()),
          fetch(`${API}?type=popular`).then(r => r.json()),
        ]);

        this.render({
          today: todayRes.stats || {},
          total: totalRes.total || {},
          popular: popularRes.popular || [],
        });
      } catch (e) {
        console.warn('统计数据加载失败:', e);
        this.renderError();
      }
    }

    render({ today, total, popular }) {
      const pageNames = {
        'home': '🏠 首页',
        'blog': '📝 博客',
        'ideas': '💡 灵感墙',
        'resources': '📚 资源库',
        'about': '👤 关于',
        'changelog': '📋 更新日志',
        'games': '🎮 游戏',
        'novel': '📖 武侠连载',
      };

      this.container.innerHTML = `
        <style>
          .stats-widget {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; ; width:100%; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif;
          }
          .stats-title {
            font-size: 1.1rem; font-weight: 700; margin-bottom: 20px;
            display: flex; align-items: center; gap: 8px;
            color: var(--text, #e8e8e8);
          }
          .stats-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
            margin-bottom: 20px;
          }
          .stats-card {
            background: #0a0a0a; border: 1px solid var(--border, #2a2a2a);
            border-radius: 12px; padding: 16px; text-align: center;
          }
          .stats-card .num {
            font-size: 1.8rem; font-weight: 900;
            background: linear-gradient(135deg, var(--accent, #646cff), var(--gold, #d4a853));
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .stats-card .label {
            font-size: 0.75rem; color: var(--text-dim, #888); margin-top: 4px;
          }
          .stats-section {
            margin-bottom: 16px; padding-top: 16px;
            border-top: 1px solid var(--border, #2a2a2a);
          }
          .stats-section-title {
            font-size: 0.8rem; color: var(--text-dim, #888);
            margin-bottom: 12px; font-weight: 600;
          }
          .stats-bar {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 8px;
          }
          .stats-bar .name {
            font-size: 0.8rem; color: var(--text, #e8e8e8);
            min-width: 80px;
          }
          .stats-bar .bar {
            flex: 1; height: 8px; background: #1a1a1a; border-radius: 4px;
            overflow: hidden;
          }
          .stats-bar .fill {
            height: 100%; border-radius: 4px;
            background: linear-gradient(90deg, var(--accent, #646cff), var(--gold, #d4a853));
            transition: width 0.6s ease;
          }
          .stats-bar .count {
            font-size: 0.75rem; color: var(--text-dim, #888);
            min-width: 30px; text-align: right;
          }
          .stats-total {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
            margin-top: 16px; padding-top: 16px;
            border-top: 1px solid var(--border, #2a2a2a);
          }
          .stats-total-item {
            text-align: center;
          }
          .stats-total-item .num {
            font-size: 1.2rem; font-weight: 700; color: var(--text, #e8e8e8);
          }
          .stats-total-item .label {
            font-size: 0.7rem; color: var(--text-dim, #888);
          }
          .stats-footer {
            margin-top: 16px; padding-top: 12px;
            border-top: 1px solid var(--border, #2a2a2a);
            font-size: 0.7rem; color: var(--text-muted, #555);
            text-align: center;
          }
        
        @media(max-width:768px){
          .stats-widget{padding:16px !important;border-radius:12px !important}
          .stats-widget *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
        <div class="stats-widget">
          <div class="stats-title">📊 网站数据</div>

          <div class="stats-grid">
            <div class="stats-card">
              <div class="num">${today.page_views || 0}</div>
              <div class="label">今日访问 (PV)</div>
            </div>
            <div class="stats-card">
              <div class="num">${today.unique_visitors || 0}</div>
              <div class="label">今日访客 (UV)</div>
            </div>
            <div class="stats-card">
              <div class="num">${today.today_checkins || 0}</div>
              <div class="label">今日签到</div>
            </div>
            <div class="stats-card">
              <div class="num">${today.today_moods || 0}</div>
              <div class="label">今日心情</div>
            </div>
          </div>

          ${popular.length > 0 ? `
            <div class="stats-section">
              <div class="stats-section-title">🔥 今日热门页面</div>
              ${popular.slice(0, 5).map(p => {
                const maxCount = popular[0]?.count || 1;
                const percent = Math.round((p.count / maxCount) * 100);
                const name = pageNames[p.page] || p.page;
                return `
                  <div class="stats-bar">
                    <div class="name">${name}</div>
                    <div class="bar"><div class="fill" style="width:${percent}%"></div></div>
                    <div class="count">${p.count}</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : ''}

          <div class="stats-total">
            <div class="stats-total-item">
              <div class="num">${this.formatNum(total.page_views)}</div>
              <div class="label">总访问量</div>
            </div>
            <div class="stats-total-item">
              <div class="num">${this.formatNum(total.checkins)}</div>
              <div class="label">总签到次数</div>
            </div>
            <div class="stats-total-item">
              <div class="num">${this.formatNum(total.moods)}</div>
              <div class="label">总心情记录</div>
            </div>
          </div>

          <div class="stats-footer">
            数据由 Supabase 驱动 · 每次访问自动统计
          </div>
        </div>
      `;
    }

    renderError() {
      this.container.innerHTML = `
        <style>
          .stats-widget {
            background: var(--surface, #141414); border: 1px solid var(--border, #2a2a2a);
            border-radius: 16px; padding: 20px; ; width:100%; margin: 0 auto;
            font-family: 'LXGW WenKai', -apple-system, sans-serif; text-align: center;
          }
          .stats-error { color: var(--text-dim, #888); font-size: 0.85rem; }
        
        @media(max-width:768px){
          .stats-widget{padding:16px !important;border-radius:12px !important}
          .stats-widget *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
        <div class="stats-widget">
          <div class="stats-error">📊 统计数据加载中...</div>
        </div>
      `;
    }

    formatNum(n) {
      if (!n) return '0';
      if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
      if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
      return n.toString();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishStats());
  } else {
    new FishStats();
  }
})();
