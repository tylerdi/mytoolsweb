/* 小鱼儿的数字花园 — 重构导航栏 v2 */
(function(){
  // 核心功能 — 顶部直接展示
  var corePages = [
    {href:'/ai-image', label:'AI 画图', icon:'🎨'},
    {href:'/ai-tts', label:'AI 语音', icon:'🎙️'},
    {href:'/ai-chat', label:'AI 聊天', icon:'💬'},
  ];

  // 探索分类 — 下拉菜单
  var explorePages = [
    {href:'/ai-debate.html', label:'AI 辩论场', icon:'⚔️', desc:'正反方实时对决'},
    {href:'/story-radio.html', label:'有声故事电台', icon:'📻', desc:'AI 续写+配音+插画'},
    {href:'/deep-sea-museum.html', label:'深海博物馆', icon:'🌊', desc:'每日深海生物'},
    {href:'/mystery-box.html', label:'盲盒', icon:'🎁', desc:'随机惊喜'},
    {href:'/tree-hole.html', label:'树洞', icon:'🌳', desc:'匿名心声'},
    {href:'/grocery.html', label:'杂货店', icon:'🏪', desc:'创意小物'},
    {href:'/ai-fun.html', label:'趣味工具', icon:'🎭', desc:'好玩的 AI'},
  ];

  // 工具分类 — 下拉菜单
  var toolPages = [
    {href:'/ai-tools', label:'AI 工具箱', icon:'🧰', desc:'70+ 在线工具'},
    {href:'/tools.html', label:'开发者工具', icon:'🛠️', desc:'JSON/加密/转换'},
    {href:'/ai-models', label:'模型排行', icon:'📊', desc:'AI 模型对比'},
    {href:'/ai-cost', label:'成本计算', icon:'💰', desc:'API 费用估算'},
    {href:'/ai-prompt', label:'Prompt 指南', icon:'📝', desc:'提示词教程'},
  ];

  // 内容分类 — 下拉菜单
  var contentPages = [
    {href:'/daily-news.html', label:'每日新闻', icon:'📰', desc:'AI 整理热点'},
    {href:'/gallery.html', label:'AI 画廊', icon:'🖼️', desc:'作品展示'},
    {href:'/daily-wallpaper.html', label:'每日壁纸', icon:'🎨', desc:'每日一图'},
    {href:'/resources.html', label:'资源库', icon:'📚', desc:'精选资源'},
    {href:'/about.html', label:'关于', icon:'👤', desc:'关于小鱼儿'},
  ];

  var path = location.pathname.replace(/\.html$/,'').replace(/\/$/,'') || '/';

  function isActive(href) {
    var clean = href.replace(/\.html$/,'').replace(/\/$/,'') || '/';
    return path === clean ? ' active' : '';
  }

  function renderLinks(pages) {
    return pages.map(function(p) {
      return '<a href="'+p.href+'" class="'+isActive(p.href)+'">'+p.icon+' '+p.label+'</a>';
    }).join('');
  }

  function renderDropdownItems(pages) {
    return pages.map(function(p) {
      return '<a href="'+p.href+'" class="dd-item'+isActive(p.href)+'">'
        +'<span class="dd-icon">'+p.icon+'</span>'
        +'<span class="dd-text"><span class="dd-label">'+p.label+'</span>'
        +'<span class="dd-desc">'+p.desc+'</span></span>'
        +'</a>';
    }).join('');
  }

  function renderMobileAll() {
    var all = [].concat(
      [{href:'/', label:'首页', icon:'🏠'}],
      corePages,
      [{type:'divider', label:'探索'}],
      explorePages,
      [{type:'divider', label:'工具'}],
      toolPages,
      [{type:'divider', label:'内容'}],
      contentPages
    );
    return all.map(function(item) {
      if (item.type === 'divider') {
        return '<div class="mobile-divider">'+item.label+'</div>';
      }
      return '<a href="'+item.href+'" class="'+isActive(item.href)+'">'+item.icon+' '+item.label+'</a>';
    }).join('');
  }

  var navHtml = ''
    +'<nav class="nav">'
    +'<div class="nav-inner">'
      +'<a href="/" class="nav-logo"><span class="fish">🐟</span> 小鱼儿</a>'
      +'<div class="nav-links">'
        +renderLinks(corePages)
        +'<div class="nav-dropdown" id="ddExplore">'
          +'<span class="nav-dropdown-trigger" onclick="toggleDropdown(\'ddExplore\')">🌐 探索 <span class="dd-arrow">▾</span></span>'
          +'<div class="nav-dropdown-menu">'+renderDropdownItems(explorePages)+'</div>'
        +'</div>'
        +'<div class="nav-dropdown" id="ddTools">'
          +'<span class="nav-dropdown-trigger" onclick="toggleDropdown(\'ddTools\')">🧰 工具 <span class="dd-arrow">▾</span></span>'
          +'<div class="nav-dropdown-menu">'+renderDropdownItems(toolPages)+'</div>'
        +'</div>'
        +'<div class="nav-dropdown" id="ddContent">'
          +'<span class="nav-dropdown-trigger" onclick="toggleDropdown(\'ddContent\')">📰 内容 <span class="dd-arrow">▾</span></span>'
          +'<div class="nav-dropdown-menu">'+renderDropdownItems(contentPages)+'</div>'
        +'</div>'
      +'</div>'
      +'<button class="hamburger" onclick="toggleMenu()">☰</button>'
    +'</div>'
    +'</nav>'
    +'<div class="mobile-overlay" id="overlay" onclick="toggleMenu()"></div>'
    +'<div class="mobile-menu" id="mobileMenu">'
      +'<button class="close-btn" onclick="toggleMenu()">✕</button>'
      +'<div style="clear:both;padding-top:12px">'+renderMobileAll()+'</div>'
    +'</div>';

  document.addEventListener('DOMContentLoaded', function(){
    document.body.insertAdjacentHTML('afterbegin', navHtml);
  });

  window.toggleMenu = function(){
    document.getElementById('mobileMenu').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
  };

  window.toggleDropdown = function(id){
    var dd = document.getElementById(id);
    // Close others
    document.querySelectorAll('.nav-dropdown').forEach(function(el){
      if (el.id !== id) el.classList.remove('open');
    });
    dd.classList.toggle('open');
  };

  // Close dropdowns on outside click
  document.addEventListener('click', function(e){
    if (!e.target.closest('.nav-dropdown')) {
      document.querySelectorAll('.nav-dropdown').forEach(function(el){
        el.classList.remove('open');
      });
    }
  });
})();
