(function () {
  const links = [
    { href: '/tools.html', label: '开发工具', icon: '🛠️' },
    { href: '/ai-tts.html', label: 'AI 语音', icon: '🎙️' },
    { href: '/ai-image.html', label: 'AI 画图', icon: '🎨' },
    { href: '/blog/', label: '使用指南', icon: '📖' },
    { href: '/about.html', label: '关于', icon: '👤' },
  ];

  const currentPath = location.pathname.replace(/index\.html$/, '').replace(/\.html$/, '') || '/';
  function renderLink(link) {
    const path = link.href.replace(/\.html$/, '');
    const active = currentPath === path ? ' class="active" aria-current="page"' : '';
    return `<a href="${link.href}"${active}>${link.icon} ${link.label}</a>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('afterbegin', `
      <nav class="nav" aria-label="主导航">
        <div class="nav-inner">
          <a href="/" class="nav-logo"><span class="fish">🧰</span> Tyler 工具箱</a>
          <div class="nav-links">${links.map(renderLink).join('')}</div>
          <button class="hamburger" type="button" aria-label="打开导航" aria-expanded="false" aria-controls="mobileMenu">☰</button>
        </div>
      </nav>
      <div class="mobile-overlay" id="overlay"></div>
      <div class="mobile-menu" id="mobileMenu" aria-label="移动导航">
        <button class="close-btn" type="button" aria-label="关闭导航">✕</button>
        <div style="clear:both;padding-top:12px">
          <a href="/">🏠 首页</a>
          ${links.map(renderLink).join('')}
          <a href="/privacy.html">🔒 隐私政策</a>
          <a href="/contact.html">✉️ 联系</a>
        </div>
      </div>`);

    const menu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');
    const trigger = document.querySelector('.hamburger');
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      overlay.classList.toggle('show', open);
      trigger.setAttribute('aria-expanded', String(open));
      trigger.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    };
    trigger.addEventListener('click', () => setOpen(true));
    menu.querySelector('.close-btn').addEventListener('click', () => setOpen(false));
    overlay.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setOpen(false);
    });
  });
})();
