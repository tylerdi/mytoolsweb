/**
 * 小鱼儿网站埋点统计 🐟📊
 * 自动记录 PV、UV、页面停留时间
 * 用法：<script src="/fish-tracker.js"></script>
 */

(function () {
  'use strict';

  const API = '/api/stats';
  const VISITOR_KEY = 'fish_visitor_id';
  const SESSION_KEY = 'fish_session_id';
  const LAST_VISIT_KEY = 'fish_last_visit';

  // 生成或读取访客 ID（持久化）
  function getVisitorId() {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  }

  // 生成会话 ID（30分钟过期）
  function getSessionId() {
    const now = Date.now();
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      try {
        const { id, ts } = JSON.parse(raw);
        if (now - ts < 30 * 60 * 1000) {
          // 更新时间戳
          sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: now }));
          return id;
        }
      } catch {}
    }
    const id = 's_' + now.toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: now }));
    return id;
  }

  // 获取当前页面标识
  function getPageName() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    return path.replace(/^\//, '').replace(/\.html$/, '').replace(/\/$/, '') || 'home';
  }

  // 记录页面访问
  async function trackPageView() {
    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const page = getPageName();

    // 防重复：同一页面 5 分钟内不重复记录
    const trackKey = `tracked_${page}`;
    const lastTracked = sessionStorage.getItem(trackKey);
    if (lastTracked && Date.now() - parseInt(lastTracked) < 5 * 60 * 1000) {
      return;
    }
    sessionStorage.setItem(trackKey, Date.now().toString());

    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: visitorId,
          page,
          session_id: sessionId,
          referrer: document.referrer || '',
          ua: navigator.userAgent,
        }),
      });

      // 更新最后访问时间
      localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString());
    } catch (e) {
      console.warn('埋点失败:', e);
    }
  }

  // 记录页面停留时间（离开时上报）
  function trackPageDuration() {
    const startTime = Date.now();
    const page = getPageName();

    function sendDuration() {
      const duration = Math.round((Date.now() - startTime) / 1000);
      if (duration < 3) return; // 少于3秒不算

      const visitorId = getVisitorId();
      // 使用 sendBeacon 确保页面关闭时也能发送
      const data = JSON.stringify({
        visitor_id: visitorId,
        page,
        duration,
        type: 'duration',
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(API, new Blob([data], { type: 'application/json' }));
      } else {
        fetch(API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true,
        }).catch(() => {});
      }
    }

    // 页面离开时上报
    window.addEventListener('beforeunload', sendDuration);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') sendDuration();
    });
  }

  // 初始化
  function init() {
    trackPageView();
    trackPageDuration();
  }

  // 等 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
