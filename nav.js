/* 小鱼儿的数字花园 — 共享导航栏 */
(function(){
  var pages = [
    {href:'/ai-image', label:'AI 画图', icon:'🎨'},
    {href:'/ai-tts', label:'AI 语音', icon:'🎙️'},
    {href:'/ai-chat', label:'AI 聊天', icon:'💬'},
    {href:'/ai-tools', label:'工具箱', icon:'🧰'},
    {href:'/daily-news.html', label:'新闻', icon:'📰'},
    {href:'/ai-cost', label:'成本', icon:'💰'},
    {href:'/ai-models', label:'排行', icon:'📊'},
    {href:'/gallery.html', label:'画廊', icon:'🎨'},
    {href:'/mystery-box.html', label:'盲盒', icon:'🎁'},
    {href:'/tree-hole.html', label:'树洞', icon:'🌳'},
    {href:'/grocery.html', label:'杂货店', icon:'🏪'},
    {href:'/daily-wallpaper.html', label:'壁纸', icon:'🖼️'},
    {href:'/ai-fun.html', label:'趣味', icon:'🎭'},
    {href:'/about.html', label:'关于', icon:'👤'}
  ];
  var path = location.pathname.replace(/\.html$/,'').replace(/\/$/,'') || '/';
  var linksHtml = pages.map(function(p){
    var href_clean = p.href.replace(/\.html$/,'').replace(/\/$/,'') || '/';
    var active = (path === href_clean) ? ' active' : '';
    return '<a href="'+p.href+'" class="'+active+'">'+p.icon+' '+p.label+'</a>';
  }).join('');

  var mobileLinksHtml = pages.map(function(p){
    return '<a href="'+p.href+'">'+p.icon+' '+p.label+'</a>';
  }).join('');

  var navHtml = '<nav class="nav">'+
    '<div class="nav-inner">'+
      '<a href="/" class="nav-logo"><span class="fish">🐟</span> 小鱼儿</a>'+
      '<div class="nav-links">'+linksHtml+'</div>'+
      '<button class="hamburger" onclick="toggleMenu()">☰</button>'+
    '</div>'+
  '</nav>'+
  '<div class="mobile-overlay" id="overlay" onclick="toggleMenu()"></div>'+
  '<div class="mobile-menu" id="mobileMenu">'+
    '<button class="close-btn" onclick="toggleMenu()">✕</button>'+
    '<div style="clear:both;padding-top:12px">'+mobileLinksHtml+'</div>'+
  '</div>';

  // Insert nav after <body> or before first element
  document.addEventListener('DOMContentLoaded', function(){
    var body = document.body;
    if(body) body.insertAdjacentHTML('afterbegin', navHtml);
  });

  window.toggleMenu = function(){
    document.getElementById('mobileMenu').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('show');
  };
})();
