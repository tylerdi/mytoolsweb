/**
 * 命运转盘 🎡 — 选择困难症终结者
 */
(function(){
  'use strict';
  const el=document.getElementById('fish-wheel');
  if(!el) return;

  const DEFAULT_OPTIONS=['去！','算了','再想想','问问别人','明天再说','冲！','放弃吧','试试看'];
  let options=[...DEFAULT_OPTIONS];
  let spinning=false;
  let angle=0;

  const COLORS=['#646cff','#ec4899','#d4a853','#22c55e','#f97316','#8b5cf6','#06b6d4','#ef4444','#f59e0b','#10b981'];

  function drawWheel(opts,rotation){
    const canvas=document.getElementById('wheel-canvas');
    const ctx=canvas.getContext('2d');
    const size=Math.min(320,window.innerWidth-60);
    canvas.width=size;canvas.height=size;
    const cx=size/2,cy=size/2,r=size/2-8;
    const segAngle=2*Math.PI/opts.length;

    ctx.clearRect(0,0,size,size);

    // Draw segments
    opts.forEach((opt,i)=>{
      const startA=rotation+i*segAngle;
      const endA=startA+segAngle;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,startA,endA);ctx.closePath();
      ctx.fillStyle=COLORS[i%COLORS.length];ctx.fill();
      ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=2;ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx,cy);
      ctx.rotate(startA+segAngle/2);
      ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle='#fff';ctx.font='bold '+(opts.length>6?'11':'14')+'px system-ui';
      const textR=r*.65;
      ctx.fillText(opt.length>6?opt.slice(0,6)+'..':opt,textR,0);
      ctx.restore();
    });

    // Center circle
    ctx.beginPath();ctx.arc(cx,cy,28,0,2*Math.PI);
    ctx.fillStyle='#1a1a2e';ctx.fill();
    ctx.strokeStyle='#d4a853';ctx.lineWidth=3;ctx.stroke();
    ctx.fillStyle='#d4a853';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('GO',cx,cy);

    // Pointer
    ctx.beginPath();
    ctx.moveTo(cx,cy-r-2);
    ctx.lineTo(cx-10,cy-r-22);
    ctx.lineTo(cx+10,cy-r-22);
    ctx.closePath();
    ctx.fillStyle='#ef4444';ctx.fill();
  }

  function spin(){
    if(spinning)return;
    spinning=true;
    const opts=[...options];
    const segAngle=360/opts.length;
    const targetIdx=Math.floor(Math.random()*opts.length);
    const spins=5+Math.floor(Math.random()*3);
    const targetAngle=360*spins+(360-targetIdx*segAngle-segAngle/2);
    const duration=4000;
    const start=performance.now();
    const startAngle=angle;

    function easeOut(t){return 1-Math.pow(1-t,4)}

    function animate(now){
      const elapsed=now-start;
      const progress=Math.min(elapsed/duration,1);
      const eased=easeOut(progress);
      angle=startAngle+targetAngle*eased;
      drawWheel(opts,angle*Math.PI/180);

      if(progress<1){
        requestAnimationFrame(animate);
      }else{
        spinning=false;
        angle=angle%360;
        const result=opts[targetIdx];
        document.getElementById('wheel-result').innerHTML=`<span style="font-size:1.5rem">🎯</span> 命运说：<strong style="color:#d4a853;font-size:1.2rem">${result}</strong>`;
      }
    }
    requestAnimationFrame(animate);
  }

  el.innerHTML=`
    <style>
      .wheel-wrap{max-width:400px;margin:0 auto;text-align:center;padding:20px}
      .wheel-title{font-size:1.6rem;font-weight:900;margin-bottom:8px;background:linear-gradient(135deg,#f97316,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .wheel-sub{color:var(--text-dim);font-size:.85rem;margin-bottom:20px}
      #wheel-canvas{cursor:pointer;border-radius:50%;transition:filter .3s}
      #wheel-canvas:hover{filter:brightness(1.1)}
      .wheel-result{margin:20px 0;min-height:40px;font-size:1rem;color:var(--text-dim)}
      .wheel-input-wrap{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;justify-content:center}
      .wheel-input{flex:1;min-width:200px;padding:10px 16px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.85rem;outline:none}
      .wheel-input:focus{border-color:var(--accent)}
      .wheel-btn{padding:10px 20px;border-radius:10px;border:none;font-size:.85rem;font-weight:600;cursor:pointer;transition:all .3s}
      .wheel-btn.spin{background:linear-gradient(135deg,#f97316,#ef4444);color:#fff}
      .wheel-btn.spin:hover{transform:translateY(-2px)}
      .wheel-btn.reset{background:var(--surface);color:var(--text-dim);border:1px solid var(--border)}
      .wheel-tags{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:16px}
      .wheel-tag{padding:4px 12px;border-radius:20px;font-size:.75rem;background:rgba(100,108,255,.1);color:var(--accent);display:flex;align-items:center;gap:4px}
      .wheel-tag .rm{cursor:pointer;opacity:.5;font-size:.9rem}
      .wheel-tag .rm:hover{opacity:1}
      .wheel-presets{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:16px}
      .wheel-preset{padding:6px 14px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:.75rem;cursor:pointer;transition:all .2s}
      .wheel-preset:hover{border-color:var(--accent);color:var(--accent)}
    </style>
    <div class="wheel-wrap">
      <div class="wheel-title">🎡 命运转盘</div>
      <div class="wheel-sub">选择困难症？让命运来决定！</div>
      <div class="wheel-presets">
        <button class="wheel-preset" onclick="wheelPreset(['去！','算了','再想想','冲！','放弃'])">纠结去不去</button>
        <button class="wheel-preset" onclick="wheelPreset(['火锅','烧烤','奶茶','寿司','麻辣烫','饺子'])">今天吃啥</button>
        <button class="wheel-preset" onclick="wheelPreset(['学英语','看视频','打游戏','睡觉','写代码','看书'])">干点啥</button>
      </div>
      <div class="wheel-input-wrap">
        <input class="wheel-input" id="wheel-input" placeholder="输入选项，回车添加" maxlength="20">
        <button class="wheel-btn spin" onclick="wheelAdd()">添加</button>
      </div>
      <div class="wheel-tags" id="wheel-tags"></div>
      <canvas id="wheel-canvas"></canvas>
      <div class="wheel-result" id="wheel-result">点击转盘开始 🎯</div>
      <div style="display:flex;gap:8px;justify-content:center">
        <button class="wheel-btn spin" onclick="wheelSpin()">🎯 转！</button>
        <button class="wheel-btn reset" onclick="wheelReset()">↻ 重置</button>
      </div>
    </div>
  `;

  function renderTags(){
    const tagsEl=document.getElementById('wheel-tags');
    tagsEl.innerHTML=options.map((o,i)=>`<span class="wheel-tag">${o}<span class="rm" onclick="wheelRemove(${i})">✕</span></span>`).join('');
  }

  window.wheelAdd=function(){
    const input=document.getElementById('wheel-input');
    const val=input.value.trim();
    if(val&&options.length<12){options.push(val);input.value='';renderTags();drawWheel(options,0)}
  };
  window.wheelRemove=function(i){
    if(options.length<=2)return;
    options.splice(i,1);renderTags();drawWheel(options,0);
  };
  window.wheelSpin=function(){if(options.length>=2)spin()};
  window.wheelReset=function(){options=[...DEFAULT_OPTIONS];renderTags();drawWheel(options,0);document.getElementById('wheel-result').innerHTML='点击转盘开始 🎯'};
  window.wheelPreset=function(arr){options=[...arr];renderTags();drawWheel(options,0);document.getElementById('wheel-result').innerHTML='点击转盘开始 🎯'};

  document.getElementById('wheel-input').addEventListener('keydown',e=>{if(e.key==='Enter')wheelAdd()});
  renderTags();drawWheel(options,0);
})();
