/* fish-worldclock.js — 世界时钟 */
class FishWorldclock{
  constructor(){
    this.el=document.getElementById('fish-worldclock');
    if(!this.el)return;
    this.zones=[
      {name:'北京',tz:'Asia/Shanghai',flag:'🇨🇳'},{name:'东京',tz:'Asia/Tokyo',flag:'🇯🇵'},
      {name:'首尔',tz:'Asia/Seoul',flag:'🇰🇷'},{name:'新加坡',tz:'Asia/Singapore',flag:'🇸🇬'},
      {name:'迪拜',tz:'Asia/Dubai',flag:'🇦🇪'},{name:'伦敦',tz:'Europe/London',flag:'🇬🇧'},
      {name:'巴黎',tz:'Europe/Paris',flag:'🇫🇷'},{name:'柏林',tz:'Europe/Berlin',flag:'🇩🇪'},
      {name:'莫斯科',tz:'Europe/Moscow',flag:'🇷🇺'},{name:'纽约',tz:'America/New_York',flag:'🇺🇸'},
      {name:'芝加哥',tz:'America/Chicago',flag:'🇺🇸'},{name:'洛杉矶',tz:'America/Los_Angeles',flag:'🇺🇸'},
      {name:'悉尼',tz:'Australia/Sydney',flag:'🇦🇺'},{name:'奥克兰',tz:'Pacific/Auckland',flag:'🇳🇿'},
    ];
    this.KEY='fish_worldclock_zones';
    this.myZones=this.loadZones();
    if(!this.myZones)this.myZones=this.zones.slice(0,6);
    this.timer=null;
    this.render();
    this.timer=setInterval(()=>this.updateTimes(),1000);
  }
  loadZones(){try{return JSON.parse(localStorage.getItem(this.KEY))||null}catch(e){return null}}
  saveZones(){localStorage.setItem(this.KEY,JSON.stringify(this.myZones))}
  destroy(){if(this.timer){clearInterval(this.timer);this.timer=null}}
  render(){
    this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
    this.el.innerHTML=`
      <style>.wc-wrap{display:flex;flex-direction:column;gap:16px}
      .wc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}
      .wc-card{padding:16px;background:rgba(255,255,255,.03);border:1px solid var(--c-border);border-radius:14px;text-align:center;position:relative;transition:all .2s}
      .wc-card:hover{border-color:var(--c-accent);transform:translateY(-2px)}
      .wc-flag{font-size:28px;margin-bottom:4px}
      .wc-name{font-size:13px;color:var(--c-muted);margin-bottom:6px}
      .wc-time{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--c-text)}
      .wc-date{font-size:11px;color:var(--c-muted);margin-top:4px}
      .wc-diff{font-size:11px;color:var(--c-accent);margin-top:2px}
      .wc-del{position:absolute;top:6px;right:8px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(255,80,80,.15);color:#ff6b6b;font-size:11px;cursor:pointer;opacity:0;transition:opacity .2s;display:flex;align-items:center;justify-content:center}
      .wc-card:hover .wc-del{opacity:1}
      .wc-add-row{display:flex;gap:8px;align-items:center}
      .wc-select{flex:1;padding:10px 12px;background:rgba(255,255,255,.05);border:1px solid var(--c-border);border-radius:10px;color:var(--c-text);font-size:13px;outline:none}
      .wc-select option{background:#1a1a2e;color:var(--c-text)}
      .wc-btn{padding:10px 16px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;background:var(--c-accent);color:#fff;transition:all .2s}
      .wc-info{text-align:center;font-size:12px;color:var(--c-muted)}</style>
      <div class="wc-wrap">
        <h2 style="text-align:center;margin:0">🌍 世界时钟</h2>
        <div class="wc-grid" id="wc-grid"></div>
        <div class="wc-add-row">
          <select class="wc-select" id="wc-select">${this.allOptions()}</select>
          <button class="wc-btn" id="wc-add">+ 添加</button>
        </div>
        <div class="wc-info">点击时钟卡片 ✕ 移除 · 悬停查看详情</div>
      </div>`;
    this.updateTimes();
    this.el.querySelector('#wc-add').onclick=()=>{
      const sel=this.el.querySelector('#wc-select');
      const tz=sel.value;
      if(this.myZones.find(z=>z.tz===tz))return;
      const opt=sel.options[sel.selectedIndex];
      this.myZones.push({name:opt.textContent.split(' ')[0],tz,flag:opt.textContent.split(' ')[1]||'🌐'});
      this.saveZones();this.render();
    };
  }
  allOptions(){
    const all=[
      {name:'北京',tz:'Asia/Shanghai',flag:'🇨🇳'},{name:'上海',tz:'Asia/Shanghai',flag:'🇨🇳'},
      {name:'香港',tz:'Asia/Hong_Kong',flag:'🇭🇰'},{name:'台北',tz:'Asia/Taipei',flag:'🇹🇼'},
      {name:'东京',tz:'Asia/Tokyo',flag:'🇯🇵'},{name:'首尔',tz:'Asia/Seoul',flag:'🇰🇷'},
      {name:'曼谷',tz:'Asia/Bangkok',flag:'🇹🇭'},{name:'新加坡',tz:'Asia/Singapore',flag:'🇸🇬'},
      {name:'迪拜',tz:'Asia/Dubai',flag:'🇦🇪'},{name:'孟买',tz:'Asia/Kolkata',flag:'🇮🇳'},
      {name:'伦敦',tz:'Europe/London',flag:'🇬🇧'},{name:'巴黎',tz:'Europe/Paris',flag:'🇫🇷'},
      {name:'柏林',tz:'Europe/Berlin',flag:'🇩🇪'},{name:'罗马',tz:'Europe/Rome',flag:'🇮🇹'},
      {name:'莫斯科',tz:'Europe/Moscow',flag:'🇷🇺'},{name:'悉尼',tz:'Australia/Sydney',flag:'🇦🇺'},
      {name:'奥克兰',tz:'Pacific/Auckland',flag:'🇳🇿'},{name:'纽约',tz:'America/New_York',flag:'🇺🇸'},
      {name:'芝加哥',tz:'America/Chicago',flag:'🇺🇸'},{name:'丹佛',tz:'America/Denver',flag:'🇺🇸'},
      {name:'洛杉矶',tz:'America/Los_Angeles',flag:'🇺🇸'},{name:'圣保罗',tz:'America/Sao_Paulo',flag:'🇧🇷'},
      {name:'开罗',tz:'Africa/Cairo',flag:'🇪🇬'},{name:'约翰内斯堡',tz:'Africa/Johannesburg',flag:'🇿🇦'},
    ];
    return all.map(z=>`<option value="${z.tz}">${z.name} ${z.flag}</option>`).join('');
  }
  updateTimes(){
    const grid=this.el.querySelector('#wc-grid');
    if(!grid)return;
    const now=new Date();
    const localTz=Intl.DateTimeFormat().resolvedOptions().timeZone;
    grid.innerHTML=this.myZones.map(z=>{
      const time=now.toLocaleTimeString('zh-CN',{timeZone:z.tz,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
      const date=now.toLocaleDateString('zh-CN',{timeZone:z.tz,month:'numeric',day:'numeric',weekday:'short'});
      const diff=this.getDiff(localTz,z.tz);
      return`<div class="wc-card">
        <button class="wc-del" data-tz="${z.tz}">✕</button>
        <div class="wc-flag">${z.flag}</div>
        <div class="wc-name">${z.name}</div>
        <div class="wc-time">${time}</div>
        <div class="wc-date">${date}</div>
        <div class="wc-diff">${diff}</div>
      </div>`;
    }).join('');
    grid.querySelectorAll('.wc-del').forEach(b=>{b.onclick=()=>{
      this.myZones=this.myZones.filter(z=>z.tz!==b.dataset.tz);
      this.saveZones();this.render();
    }});
  }
  getDiff(localTz,remoteTz){
    const now=new Date();
    const local=new Date(now.toLocaleString('en-US',{timeZone:localTz}));
    const remote=new Date(now.toLocaleString('en-US',{timeZone:remoteTz}));
    const diff=Math.round((remote-local)/3600000);
    if(diff===0)return'与本地相同';
    return diff>0?`UTC+${diff}`:`UTC${diff}`;
  }}
new FishWorldclock();
