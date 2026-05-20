/**
 * 番茄钟 🍅 — 专注工作，高效休息
 */
(function(){
  'use strict';
  const el=document.getElementById('fish-pomodoro');
  if(!el) return;

  let mode='work'; // work|break|longbreak
  let timeLeft=25*60;
  let totalTime=25*60;
  let running=false;
  let timer=null;
  let sessions=0;

  const MODES={
    work:{time:25*60,label:'专注中',color:'#ef4444',emoji:'🍅'},
    break:{time:5*60,label:'休息中',color:'#22c55e',emoji:'☕'},
    longbreak:{time:15*60,label:'长休息',color:'#3b82f6',emoji:'🛋️'}
  };

  function formatTime(s){return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}

  function render(){
    const m=MODES[mode];
    const pct=((totalTime-timeLeft)/totalTime*100).toFixed(1);
    document.getElementById('pomo-time').textContent=formatTime(timeLeft);
    document.getElementById('pomo-label').textContent=m.label;
    document.getElementById('pomo-sessions').textContent=`已完成 ${sessions} 个番茄`;
    document.getElementById('pomo-ring').style.setProperty('--pct',pct+'%');
    document.getElementById('pomo-ring').style.setProperty('--color',m.color);
    document.getElementById('pomo-emoji').textContent=m.emoji;
    document.getElementById('pomo-btn').textContent=running?'⏸ 暂停':'▶ 开始';
    document.getElementById('pomo-mode-work').classList.toggle('active',mode==='work');
    document.getElementById('pomo-mode-break').classList.toggle('active',mode==='break');
    document.getElementById('pomo-mode-long').classList.toggle('active',mode==='longbreak');
  }

  function tick(){
    if(timeLeft<=0){
      clearInterval(timer);timer=null;running=false;
      if(mode==='work'){
        sessions++;
        mode=sessions%4===0?'longbreak':'break';
      }else{
        mode='work';
      }
      timeLeft=MODES[mode].time;
      totalTime=timeLeft;
      // 尝试播放提示音
      try{new Audio('data:audio/wav;base64,UklGRl9vT19teleGFtcGxlAAAA').play()}catch{}
      render();
      return;
    }
    timeLeft--;
    render();
  }

  el.innerHTML=`
    <style>
      .pomo-wrap{max-width:380px;margin:0 auto;text-align:center;padding:20px}
      .pomo-title{font-size:1.6rem;font-weight:900;margin-bottom:8px;background:linear-gradient(135deg,#ef4444,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .pomo-modes{display:flex;gap:8px;justify-content:center;margin-bottom:24px}
      .pomo-mode{padding:8px 16px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text-dim);font-size:.8rem;cursor:pointer;transition:all .3s}
      .pomo-mode.active{border-color:var(--accent);color:var(--accent);background:rgba(100,108,255,.1)}
      .pomo-ring-wrap{position:relative;width:200px;height:200px;margin:0 auto 20px}
      .pomo-ring-svg{width:100%;height:100%;transform:rotate(-90deg)}
      .pomo-ring-bg{fill:none;stroke:var(--border);stroke-width:8}
      .pomo-ring-fg{fill:none;stroke:var(--color,#ef4444);stroke-width:8;stroke-linecap:round;stroke-dasharray:565;stroke-dashoffset:calc(565 - 565 * var(--pct,0) / 100);transition:stroke-dashoffset .5s,stroke .3s}
      .pomo-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
      .pomo-emoji{font-size:2.5rem}
      .pomo-time{font-size:2.8rem;font-weight:900;font-variant-numeric:tabular-nums}
      .pomo-label{font-size:.85rem;color:var(--text-dim);margin-top:2px}
      .pomo-sessions{font-size:.8rem;color:var(--text-muted);margin:16px 0}
      .pomo-btns{display:flex;gap:12px;justify-content:center}
      .pomo-btn{padding:12px 28px;border-radius:12px;border:none;font-size:1rem;font-weight:600;cursor:pointer;transition:all .3s}
      .pomo-btn.primary{background:linear-gradient(135deg,#ef4444,#f59e0b);color:#fff}
      .pomo-btn.primary:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(239,68,68,.3)}
      .pomo-btn.ghost{background:var(--surface);color:var(--text-dim);border:1px solid var(--border)}
      .pomo-btn.ghost:hover{border-color:var(--accent)}
      @media(max-width:400px){.pomo-ring-wrap{width:160px;height:160px}.pomo-time{font-size:2.2rem}}
    </style>
    <div class="pomo-wrap">
      <div class="pomo-title">🍅 番茄钟</div>
      <div class="pomo-modes">
        <button class="pomo-mode active" id="pomo-mode-work" onclick="pomoSetMode('work')">专注 25min</button>
        <button class="pomo-mode" id="pomo-mode-break" onclick="pomoSetMode('break')">休息 5min</button>
        <button class="pomo-mode" id="pomo-mode-long" onclick="pomoSetMode('longbreak')">长休 15min</button>
      </div>
      <div class="pomo-ring-wrap">
        <svg class="pomo-ring-svg" viewBox="0 0 200 200">
          <circle class="pomo-ring-bg" cx="100" cy="100" r="90"/>
          <circle class="pomo-ring-fg" id="pomo-ring" cx="100" cy="100" r="90"/>
        </svg>
        <div class="pomo-center">
          <div class="pomo-emoji" id="pomo-emoji">🍅</div>
          <div class="pomo-time" id="pomo-time">25:00</div>
          <div class="pomo-label" id="pomo-label">专注中</div>
        </div>
      </div>
      <div class="pomo-sessions" id="pomo-sessions">已完成 0 个番茄</div>
      <div class="pomo-btns">
        <button class="pomo-btn primary" id="pomo-btn" onclick="pomoToggle()">▶ 开始</button>
        <button class="pomo-btn ghost" onclick="pomoReset()">↻ 重置</button>
      </div>
    </div>
  `;

  window.pomoToggle=function(){
    if(running){clearInterval(timer);timer=null;running=false}
    else{timer=setInterval(tick,1000);running=true}
    render();
  };
  window.pomoReset=function(){
    clearInterval(timer);timer=null;running=false;
    timeLeft=MODES[mode].time;totalTime=timeLeft;render();
  };
  window.pomoSetMode=function(m){
    clearInterval(timer);timer=null;running=false;
    mode=m;timeLeft=MODES[m].time;totalTime=timeLeft;render();
  };
  render();
})();
