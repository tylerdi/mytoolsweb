/* fish-habit.js — 习惯打卡追踪 */
class FishHabit{
  constructor(){
    this.el=document.getElementById('fish-habit');
    if(!this.el)return;
    this.KEY='fish_habits';
    this.COLORS=['#ff6b6b','#ffd93d','#6bcb77','#4ecdc4','#a855f7','#ff8a5c','#64c8ff','#ff6b9d'];
    this.data=this.load();
    this.render();
  }
  load(){try{return JSON.parse(localStorage.getItem(this.KEY))||[]}catch(e){return[]}}
  save(){localStorage.setItem(this.KEY,JSON.stringify(this.data))}
  today(){return new Date().toISOString().slice(0,10)}
  render(){
    this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
    this.el.innerHTML=`
      <style>.hb-wrap{display:flex;flex-direction:column;gap:16px}
      .hb-add{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .hb-input{flex:1;min-width:120px;padding:10px 14px;background:rgba(255,255,255,.05);border:1px solid var(--c-border);border-radius:10px;color:var(--c-text);font-size:14px;outline:none}
      .hb-input:focus{border-color:var(--c-accent)}
      .hb-btn{padding:10px 16px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;background:var(--c-accent);color:#fff;transition:all .2s}
      .hb-colors{display:flex;gap:4px}
      .hb-color{width:24px;height:24px;border-radius:50%;cursor:pointer;border:2px solid transparent;transition:all .2s}
      .hb-color.active{border-color:#fff;transform:scale(1.2)}
      .hb-list{display:flex;flex-direction:column;gap:8px}
      .hb-card{padding:14px 16px;background:rgba(255,255,255,.03);border:1px solid var(--c-border);border-radius:14px;display:flex;align-items:center;gap:12px;transition:all .2s}
      .hb-card:hover{border-color:rgba(255,255,255,.1)}
      .hb-dot{width:12px;height:12px;border-radius:50%;flex-shrink:0}
      .hb-info{flex:1;min-width:0}
      .hb-name{font-size:14px;font-weight:600}
      .hb-streak{font-size:11px;color:var(--c-muted);margin-top:2px}
      .hb-week{display:flex;gap:3px;align-items:center}
      .hb-day{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--c-muted);background:rgba(255,255,255,.03)}
      .hb-day.done{color:#fff;font-weight:bold}
      .hb-day.today{border:1px solid var(--c-accent)}
      .hb-check{width:36px;height:36px;border-radius:50%;border:2px solid var(--c-border);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:16px;transition:all .2s;flex-shrink:0}
      .hb-check.done{border-color:transparent}
      .hb-check:hover{transform:scale(1.1)}
      .hb-del{width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,80,80,.1);color:#ff6b6b;font-size:12px;cursor:pointer;opacity:0;transition:opacity .2s;flex-shrink:0}
      .hb-card:hover .hb-del{opacity:1}
      .hb-empty{text-align:center;padding:40px;color:var(--c-muted);font-size:14px}
      .hb-stats{display:flex;gap:16px;justify-content:center;font-size:12px;color:var(--c-muted);flex-wrap:wrap}</style>
      <div class="hb-wrap">
        <h2 style="text-align:center;margin:0">🔥 习惯打卡</h2>
        <div class="hb-add">
          <input class="hb-input" id="hb-name" placeholder="新习惯名称..." maxlength="20">
          <div class="hb-colors" id="hb-colors">${this.COLORS.map((c,i)=>`<div class="hb-color${i===0?' active':''}" data-c="${c}" style="background:${c}"></div>`).join('')}</div>
          <button class="hb-btn" id="hb-add">添加</button>
        </div>
        <div class="hb-list" id="hb-list"></div>
        <div class="hb-stats" id="hb-stats"></div>
      </div>`;
    this.renderList();
    this.el.querySelectorAll('.hb-color').forEach(c=>{c.onclick=()=>{this.el.querySelectorAll('.hb-color').forEach(x=>x.classList.remove('active'));c.classList.add('active')}});
    this.el.querySelector('#hb-add').onclick=()=>this.add();
    this.el.querySelector('#hb-name').onkeydown=e=>{if(e.key==='Enter')this.add()};
  }
  add(){
    const inp=this.el.querySelector('#hb-name');
    const name=inp.value.trim();if(!name)return;
    const color=this.el.querySelector('.hb-color.active')?.dataset.c||this.COLORS[0];
    this.data.push({id:Date.now(),name,color,created:this.today(),days:[]});
    inp.value='';this.save();this.renderList();
  }
  toggle(id){
    const h=this.data.find(d=>d.id===id);if(!h)return;
    const t=this.today();
    const idx=h.days.indexOf(t);
    if(idx>=0)h.days.splice(idx,1);else h.days.push(t);
    this.save();this.renderList();
  }
  remove(id){this.data=this.data.filter(d=>d.id!==id);this.save();this.renderList()}
  getStreak(habit){
    let streak=0;
    const d=new Date();
    for(;;){
      const ds=d.toISOString().slice(0,10);
      if(habit.days.includes(ds)){streak++;d.setDate(d.getDate()-1)}
      else break;
    }
    return streak;
  }
  renderList(){
    const list=this.el.querySelector('#hb-list');
    if(!this.data.length){list.innerHTML='<div class="hb-empty">还没有习惯，添加一个开始打卡吧 💪</div>';this.el.querySelector('#hb-stats').textContent='';return}
    const today=this.today();
    const weekdays=['日','一','二','三','四','五','六'];
    list.innerHTML=this.data.map(h=>{
      const doneToday=h.days.includes(today);
      const streak=this.getStreak(h);
      const weekHtml=Array.from({length:7},(_,i)=>{
        const d=new Date();d.setDate(d.getDate()-6+i);
        const ds=d.toISOString().slice(0,10);
        const isToday=ds===today;
        const isDone=h.days.includes(ds);
        return`<div class="hb-day${isDone?' done':''}${isToday?' today':''}" style="${isDone?'background:'+h.color:''}" title="${ds}">${weekdays[d.getDay()]}</div>`;
      }).join('');
      return`<div class="hb-card">
        <div class="hb-dot" style="background:${h.color}"></div>
        <div class="hb-info">
          <div class="hb-name">${h.name}</div>
          <div class="hb-streak">🔥 连续 ${streak} 天 · 累计 ${h.days.length} 天</div>
        </div>
        <div class="hb-week">${weekHtml}</div>
        <div class="hb-check${doneToday?' done':''}" style="${doneToday?'background:'+h.color+';color:#fff':''}" data-id="${h.id}">${doneToday?'✓':''}</div>
        <button class="hb-del" data-id="${h.id}">✕</button>
      </div>`;
    }).join('');
    list.querySelectorAll('.hb-check').forEach(c=>{c.onclick=()=>this.toggle(+c.dataset.id)});
    list.querySelectorAll('.hb-del').forEach(d=>{d.onclick=()=>this.remove(+d.dataset.id)});
    const total=this.data.reduce((s,h)=>s+h.days.length,0);
    const totalStreak=this.data.reduce((s,h)=>Math.max(s,this.getStreak(h)),0);
    this.el.querySelector('#hb-stats').innerHTML=`<span>📊 ${this.data.length} 个习惯</span><span>✅ 累计 ${total} 次打卡</span><span>🔥 最长连续 ${totalStreak} 天</span>`;
  }}
new FishHabit();
