/* fish-todo.js — 待办清单 */
class FishTodo{constructor(){
  this.el=document.getElementById('fish-todo');
  if(!this.el)return;
  this.KEY='fish_todos';
  this.TABS=['全部','进行中','已完成'];
  this.tab=0;
  this.editing=null;
  this.data=this.load();
  this.render();
}
load(){try{return JSON.parse(localStorage.getItem(this.KEY))||[]}catch(e){return[]}}
save(){localStorage.setItem(this.KEY,JSON.stringify(this.data))}
render(){
  this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
  this.el.innerHTML=`
    <style>.todo-wrap{display:flex;flex-direction:column;gap:16px}
    .todo-input-row{display:flex;gap:8px;align-items:center}
    .todo-input{flex:1;padding:12px 16px;background:rgba(255,255,255,.05);border:1px solid var(--c-border);border-radius:12px;color:var(--c-text);font-size:15px;outline:none}
    .todo-input:focus{border-color:var(--c-accent)}
    .todo-btn{padding:10px 20px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
    .todo-btn-primary{background:var(--c-accent);color:#fff}.todo-btn-primary:hover{filter:brightness(1.15)}
    .todo-tabs{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:4px}
    .todo-tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s;color:var(--c-muted)}
    .todo-tab.active{background:var(--c-accent);color:#fff}
    .todo-list{display:flex;flex-direction:column;gap:6px;max-height:60vh;overflow-y:auto}
    .todo-item{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,255,255,.03);border-radius:12px;border:1px solid var(--c-border);transition:all .2s}
    .todo-item:hover{border-color:rgba(255,255,255,.1)}
    .todo-check{width:22px;height:22px;border-radius:50%;border:2px solid var(--c-border);cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .2s}
    .todo-check.done{background:var(--c-accent);border-color:var(--c-accent)}
    .todo-check.done::after{content:'✓';color:#fff;font-size:12px;font-weight:bold}
    .todo-text{flex:1;font-size:14px;line-height:1.5}.todo-text.done{text-decoration:line-through;color:var(--c-muted)}
    .todo-time{font-size:11px;color:var(--c-muted);white-space:nowrap}
    .todo-del{width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,80,80,.15);color:#ff6b6b;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}
    .todo-item:hover .todo-del{opacity:1}
    .todo-stats{display:flex;gap:16px;font-size:12px;color:var(--c-muted);justify-content:center;padding-top:8px}
    .todo-empty{text-align:center;padding:40px;color:var(--c-muted);font-size:14px}
    .todo-priority{width:4px;height:24px;border-radius:2px;flex-shrink:0}
    .priority-high{background:#ff6b6b}.priority-mid{background:#ffd93d}.priority-low{background:#6bcb77}</style>
    <div class="todo-wrap">
      <h2 style="text-align:center;margin:0">📋 待办清单</h2>
      <div class="todo-input-row">
        <div class="todo-priority priority-low" id="priority-indicator" title="点击切换优先级"></div>
        <input class="todo-input" id="todo-input" placeholder="添加新待办..." maxlength="200">
        <button class="todo-btn todo-btn-primary" id="todo-add">添加</button>
      </div>
      <div class="todo-tabs">${this.TABS.map((t,i)=>`<div class="todo-tab${i===this.tab?' active':''}" data-i="${i}">${t}</div>`).join('')}</div>
      <div class="todo-list" id="todo-list"></div>
      <div class="todo-stats" id="todo-stats"></div>
    </div>`;
  this.renderList();
  const inp=this.el.querySelector('#todo-input');
  this.el.querySelector('#todo-add').onclick=()=>this.add(inp);
  inp.onkeydown=e=>{if(e.key==='Enter')this.add(inp)};
  this.el.querySelectorAll('.todo-tab').forEach(t=>{t.onclick=()=>{this.tab=+t.dataset.i;this.render()}});
  this.el.querySelector('#priority-indicator').onclick=()=>{
    const ind=this.el.querySelector('#priority-indicator');
    const cls=['priority-low','priority-mid','priority-high'];
    const idx=cls.indexOf(ind.className.split(' ').find(c=>c.startsWith('priority-')));
    ind.className='todo-priority '+cls[(idx+1)%3];
  };
}
add(inp){
  const text=inp.value.trim();if(!text)return;
  const ind=this.el.querySelector('#priority-indicator');
  const priority=ind.classList.contains('priority-high')?'high':ind.classList.contains('priority-mid')?'mid':'low';
  this.data.unshift({id:Date.now(),text,done:false,priority,time:new Date().toLocaleString('zh-CN',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})});
  inp.value='';this.save();this.renderList();
}
toggle(id){const item=this.data.find(d=>d.id===id);if(item){item.done=!item.done;this.save();this.renderList()}}
remove(id){this.data=this.data.filter(d=>d.id!==id);this.save();this.renderList()}
renderList(){
  const list=this.el.querySelector('#todo-list');
  const filtered=this.data.filter(d=>{
    if(this.tab===1)return!d.done;
    if(this.tab===2)return d.done;
    return true;
  });
  if(!filtered.length){list.innerHTML=`<div class="todo-empty">${this.tab===0?'还没有待办，添加一个吧 🎯':'这里空空如也 ✨'}</div>`}
  else{list.innerHTML=filtered.map(d=>`
    <div class="todo-item">
      <div class="todo-priority priority-${d.priority||'low'}"></div>
      <div class="todo-check${d.done?' done':''}" data-id="${d.id}"></div>
      <div class="todo-text${d.done?' done':''}">${d.text}</div>
      <div class="todo-time">${d.time||''}</div>
      <button class="todo-del" data-id="${d.id}">✕</button>
    </div>`).join('');
    list.querySelectorAll('.todo-check').forEach(c=>{c.onclick=()=>this.toggle(+c.dataset.id)});
    list.querySelectorAll('.todo-del').forEach(d=>{d.onclick=()=>this.remove(+d.dataset.id)});
  }
  const total=this.data.length,done=this.data.filter(d=>d.done).length;
  this.el.querySelector('#todo-stats').innerHTML=`<span>共 ${total} 项</span><span>已完成 ${done}</span><span>完成率 ${total?Math.round(done/total*100):0}%</span>`;
}}
new FishTodo();
