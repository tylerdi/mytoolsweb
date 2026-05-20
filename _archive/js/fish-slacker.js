/**
 * 摸鱼计算器 💰 — 上班摸鱼赚了多少钱？
 */
(function(){
  'use strict';
  const el=document.getElementById('fish-slacker');
  if(!el) return;

  let running=false;
  let startTime=null;
  let saved=JSON.parse(localStorage.getItem('slacker_data')||'null');

  el.innerHTML=`
    <style>
      .slack-wrap{max-width:420px;margin:0 auto;text-align:center;padding:20px}
      .slack-title{font-size:1.6rem;font-weight:900;margin-bottom:8px;background:linear-gradient(135deg,#22c55e,#d4a853);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .slack-sub{color:var(--text-dim);font-size:.85rem;margin-bottom:24px}
      .slack-inputs{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;text-align:left}
      .slack-field label{display:block;font-size:.75rem;color:var(--text-dim);margin-bottom:4px}
      .slack-field input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:.9rem;outline:none;box-sizing:border-box}
      .slack-field input:focus{border-color:var(--accent)}
      .slack-display{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:20px}
      .slack-amount{font-size:2.8rem;font-weight:900;background:linear-gradient(135deg,#22c55e,#d4a853);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-variant-numeric:tabular-nums}
      .slack-label{font-size:.8rem;color:var(--text-dim);margin-top:4px}
      .slack-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px}
      .slack-stat{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:10px 8px}
      .slack-stat .val{font-size:1.2rem;font-weight:700;color:var(--accent)}
      .slack-stat .lbl{font-size:.7rem;color:var(--text-muted)}
      .slack-time{font-size:1.4rem;font-weight:700;color:var(--text);margin-bottom:4px;font-variant-numeric:tabular-nums}
      .slack-rate{font-size:.8rem;color:var(--text-dim);margin-bottom:16px}
      .slack-btns{display:flex;gap:12px;justify-content:center}
      .slack-btn{padding:12px 28px;border-radius:12px;border:none;font-size:1rem;font-weight:600;cursor:pointer;transition:all .3s}
      .slack-btn.start{background:linear-gradient(135deg,#22c55e,#d4a853);color:#fff}
      .slack-btn.start:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(34,197,94,.3)}
      .slack-btn.stop{background:linear-gradient(135deg,#ef4444,#f59e0b);color:#fff}
      .slack-btn.ghost{background:var(--surface);color:var(--text-dim);border:1px solid var(--border)}
      .slack-total{margin-top:20px;padding:16px;background:rgba(34,197,94,.05);border:1px solid rgba(34,197,94,.15);border-radius:12px}
      .slack-total .big{font-size:1.4rem;font-weight:900;color:#22c55e}
      .slack-total .sub{font-size:.75rem;color:var(--text-dim);margin-top:4px}
    </style>
    <div class="slack-wrap">
      <div class="slack-title">💰 摸鱼计算器</div>
      <div class="slack-sub">看看你上班摸鱼赚了多少钱</div>
      <div class="slack-inputs">
        <div class="slack-field"><label>月薪（元）</label><input type="number" id="slack-salary" value="${saved?.salary||8000}" min="1000"></div>
        <div class="slack-field"><label>工作日/月</label><input type="number" id="slack-days" value="${saved?.days||22}" min="1" max="31"></div>
        <div class="slack-field"><label>工作时/天</label><input type="number" id="slack-hours" value="${saved?.hours||8}" min="1" max="24"></div>
        <div class="slack-field"><label>时薪</label><input type="text" id="slack-rate" readonly></div>
      </div>
      <div class="slack-display">
        <div class="slack-amount" id="slack-earned">¥0.00</div>
        <div class="slack-label">摸鱼收入</div>
      </div>
      <div class="slack-time" id="slack-time">00:00:00</div>
      <div class="slack-rate" id="slack-rate-text">时薪计算中...</div>
      <div class="slack-stats">
        <div class="slack-stat"><div class="val" id="slack-min">0</div><div class="lbl">分钟</div></div>
        <div class="slack-stat"><div class="val" id="slack-cups">0</div><div class="lbl">杯奶茶 🧋</div></div>
        <div class="slack-stat"><div class="val" id="slack-kfc">0</div><div class="lbl">顿肯德基 🍗</div></div>
      </div>
      <div class="slack-btns">
        <button class="slack-btn start" id="slack-btn" onclick="slackToggle()">▶ 开始摸鱼</button>
        <button class="slack-btn ghost" onclick="slackReset()">↻ 清零</button>
      </div>
      <div class="slack-total" id="slack-total" style="display:none">
        <div class="big" id="slack-total-val">¥0.00</div>
        <div class="sub">历史累计摸鱼收入</div>
      </div>
    </div>
  `;

  function getRate(){
    const salary=parseFloat(document.getElementById('slack-salary').value)||8000;
    const days=parseFloat(document.getElementById('slack-days').value)||22;
    const hours=parseFloat(document.getElementById('slack-hours').value)||8;
    const rate=salary/days/hours;
    document.getElementById('slack-rate').value='¥'+rate.toFixed(2);
    document.getElementById('slack-rate-text').textContent=`时薪 ¥${rate.toFixed(2)} · 每分钟 ¥${(rate/60).toFixed(2)}`;
    return rate;
  }

  function save(){
    localStorage.setItem('slacker_data',JSON.stringify({
      salary:parseFloat(document.getElementById('slack-salary').value),
      days:parseFloat(document.getElementById('slack-days').value),
      hours:parseFloat(document.getElementById('slack-hours').value),
      total:(saved?.total||0),
      running,startTime
    }));
  }

  function formatDuration(ms){
    const s=Math.floor(ms/1000);
    const h=Math.floor(s/3600);
    const m=Math.floor((s%3600)/60);
    const sec=s%60;
    return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
  }

  function update(){
    if(!running||!startTime)return;
    const elapsed=Date.now()-startTime;
    const rate=getRate();
    const earned=elapsed/3600000*rate;
    const totalMin=Math.floor(elapsed/60000);
    document.getElementById('slack-earned').textContent='¥'+earned.toFixed(2);
    document.getElementById('slack-time').textContent=formatDuration(elapsed);
    document.getElementById('slack-min').textContent=totalMin;
    document.getElementById('slack-cups').textContent=Math.floor(earned/15);
    document.getElementById('slack-kfc').textContent=Math.floor(earned/40);
    // Total
    const totalEarned=(saved?.total||0)+earned;
    const totalEl=document.getElementById('slack-total');
    totalEl.style.display='block';
    document.getElementById('slack-total-val').textContent='¥'+totalEarned.toFixed(2);
  }

  window.slackToggle=function(){
    if(running){
      // Stop
      const elapsed=Date.now()-startTime;
      const rate=getRate();
      const earned=elapsed/3600000*rate;
      saved={...saved,total:(saved?.total||0)+earned};
      localStorage.setItem('slacker_data',JSON.stringify({...saved,running:false,startTime:null}));
      running=false;startTime=null;
      document.getElementById('slack-btn').className='slack-btn start';
      document.getElementById('slack-btn').textContent='▶ 开始摸鱼';
    }else{
      // Start
      running=true;startTime=Date.now();
      document.getElementById('slack-btn').className='slack-btn stop';
      document.getElementById('slack-btn').textContent='⏹ 结束摸鱼';
      save();
      setInterval(update,1000);
    }
  };
  window.slackReset=function(){
    saved={...saved,total:0};localStorage.setItem('slacker_data',JSON.stringify({...saved,total:0}));
    document.getElementById('slack-total-val').textContent='¥0.00';
  };

  // Auto-restore
  if(saved?.running&&saved?.startTime){
    running=true;startTime=saved.startTime;
    document.getElementById('slack-btn').className='slack-btn stop';
    document.getElementById('slack-btn').textContent='⏹ 结束摸鱼';
    setInterval(update,1000);
  }
  if(saved?.total>0){
    document.getElementById('slack-total').style.display='block';
    document.getElementById('slack-total-val').textContent='¥'+saved.total.toFixed(2);
  }
  getRate();
  document.querySelectorAll('.slack-field input:not([readonly])').forEach(i=>i.addEventListener('input',getRate));
  setInterval(update,1000);
})();
