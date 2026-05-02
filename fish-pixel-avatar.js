/**
 * 像素头像生成器 🎨 — 随机生成像素风格头像
 */
(function(){
  'use strict';
  const el=document.getElementById('fish-pixel-avatar');
  if(!el) return;

  const PALETTES=[
    {bg:'#1a1a2e',skin:'#ffd5b8',hair:'#4a3728',eye:'#2c2c2c',acc:'#646cff'},
    {bg:'#16213e',skin:'#ffe0c2',hair:'#8b4513',eye:'#1a1a2e',acc:'#ec4899'},
    {bg:'#1e1e2e',skin:'#f5c6a0',hair:'#d4a853',eye:'#333',acc:'#22c55e'},
    {bg:'#2d1b3d',skin:'#ffdab9',hair:'#c0392b',eye:'#2c3e50',acc:'#f39c12'},
    {bg:'#1a2e1a',skin:'#ffe4c4',hair:'#2c3e50',eye:'#1a1a2e',acc:'#e74c3c'},
    {bg:'#2e1a1a',skin:'#f5deb3',hair:'#e74c3c',eye:'#333',acc:'#3498db'},
  ];

  const HAIR_STYLES=['flat','spike','side','mohawk','long','bald'];
  const MOUTH=['smile','grin','neutral','cat','o'];

  function rand(n){return Math.floor(Math.random()*n)}
  function pick(arr){return arr[rand(arr.length)]}

  function generate(){
    const palette=pick(PALETTES);
    const hairStyle=pick(HAIR_STYLES);
    const mouthStyle=pick(MOUTH);
    const hasGlasses=Math.random()>.6;
    const size=8;
    const grid=Array(size).fill(null).map(()=>Array(size).fill(palette.bg));

    // Skin
    for(let y=2;y<7;y++) for(let x=2;x<6;x++) grid[y][x]=palette.skin;

    // Hair
    switch(hairStyle){
      case 'flat':
        for(let x=1;x<7;x++) grid[1][x]=palette.hair;
        grid[2][1]=palette.hair;grid[2][6]=palette.hair;
        break;
      case 'spike':
        grid[0][2]=palette.hair;grid[0][4]=palette.hair;grid[0][5]=palette.hair;
        for(let x=1;x<7;x++) grid[1][x]=palette.hair;
        break;
      case 'side':
        for(let x=1;x<7;x++) grid[1][x]=palette.hair;
        for(let y=2;y<5;y++) grid[y][6]=palette.hair;
        break;
      case 'mohawk':
        grid[0][3]=palette.hair;grid[0][4]=palette.hair;
        for(let x=2;x<6;x++) grid[1][x]=palette.hair;
        break;
      case 'long':
        for(let x=1;x<7;x++) grid[1][x]=palette.hair;
        for(let y=2;y<6;y++){grid[y][1]=palette.hair;grid[y][6]=palette.hair}
        break;
      case 'bald':
        break;
    }

    // Eyes
    grid[3][3]=palette.eye;grid[3][5]=palette.eye;
    if(hasGlasses){
      grid[2][2]=palette.acc;grid[2][3]=palette.acc;grid[2][4]=palette.acc;grid[2][5]=palette.acc;
      grid[4][2]=palette.acc;grid[4][5]=palette.acc;
    }

    // Mouth
    switch(mouthStyle){
      case 'smile':grid[5][3]=palette.acc;grid[5][4]=palette.acc;break;
      case 'grin':grid[5][2]=palette.acc;grid[5][3]=palette.acc;grid[5][4]=palette.acc;grid[5][5]=palette.acc;break;
      case 'neutral':grid[5][3]=palette.eye;grid[5][4]=palette.eye;break;
      case 'cat':grid[5][3]=palette.acc;grid[5][4]=palette.acc;grid[4][2]=palette.acc;grid[4][5]=palette.acc;break;
      case 'o':grid[5][3]=palette.acc;grid[5][4]=palette.acc;grid[6][3]=palette.acc;grid[6][4]=palette.acc;break;
    }

    return{grid,palette,size};
  }

  function drawCanvas(data){
    const canvas=document.getElementById('pixel-canvas');
    const ctx=canvas.getContext('2d');
    const{grid,palette,size}=data;
    const scale=Math.floor(Math.min(280,window.innerWidth-60)/size);
    canvas.width=size*scale;
    canvas.height=size*scale;
    ctx.imageSmoothingEnabled=false;
    for(let y=0;y<size;y++){
      for(let x=0;x<size;x++){
        ctx.fillStyle=grid[y][x];
        ctx.fillRect(x*scale,y*scale,scale,scale);
      }
    }
  }

  el.innerHTML=`
    <style>
      .pixel-wrap{max-width:400px;margin:0 auto;text-align:center;padding:20px}
      .pixel-title{font-size:1.6rem;font-weight:900;margin-bottom:8px;background:linear-gradient(135deg,#646cff,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .pixel-sub{color:var(--text-dim);font-size:.85rem;margin-bottom:20px}
      .pixel-canvas-wrap{display:flex;justify-content:center;margin-bottom:20px}
      #pixel-canvas{border-radius:12px;image-rendering:pixelated;box-shadow:0 4px 24px rgba(100,108,255,.2)}
      .pixel-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
      .pixel-btn{padding:10px 24px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.9rem;cursor:pointer;transition:all .3s}
      .pixel-btn:hover{border-color:var(--accent);transform:translateY(-2px)}
      .pixel-btn.primary{background:linear-gradient(135deg,var(--accent),#22c55e);border:none;color:#fff;font-weight:600}
    </style>
    <div class="pixel-wrap">
      <div class="pixel-title">🎨 像素头像生成器</div>
      <div class="pixel-sub">随机生成独一无二的像素风头像</div>
      <div class="pixel-canvas-wrap"><canvas id="pixel-canvas"></canvas></div>
      <div class="pixel-btns">
        <button class="pixel-btn primary" id="pixel-gen">🎲 随机生成</button>
        <button class="pixel-btn" id="pixel-save">💾 保存图片</button>
      </div>
    </div>
  `;

  function doGenerate(){drawCanvas(generate())}
  document.getElementById('pixel-gen').addEventListener('click',doGenerate);
  document.getElementById('pixel-save').addEventListener('click',()=>{
    const canvas=document.getElementById('pixel-canvas');
    const a=document.createElement('a');
    a.download='pixel-avatar.png';
    a.href=canvas.toDataURL('image/png');
    a.click();
  });
  doGenerate();
})();
