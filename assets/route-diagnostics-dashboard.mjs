const names={enter:'打开海图',start:'开始移动',complete:'完成',hint:'下一步提示',inspect:'局面检查',reset:'重置',invalid:'移动受阻',leave:'未完成离开 / 切后台'};
const reasons={neighbor:'非相邻格',reef:'礁石',signal:'机关关闭',repeat:'重复格',current:'洋流出口',budget:'预算不足',beacon:'航标未齐',blocked:'分支无解',possible:'仍可完成',unknown:'搜索未完成',invalid:'无效状态',solved:'已完成',collision:'碰撞 / 两船均受阻'};
const panel=document.querySelector('[data-route-diagnostics]');
const days=document.querySelector('#days'),source=document.querySelector('#source'),product=document.querySelector('#product');
let rows=[],requestId=0;
const cell=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e;};
const tr=values=>{const e=document.createElement('tr');e.append(...values.map(v=>cell('td',v)));return e;};
function render(){
 panel.hidden=!['all','route'].includes(product.value);const filtered=rows.filter(r=>source.value==='all'?r.source!=='qa':r.source===source.value);
 const levels=new Map(),detail=new Map();
 for(const r of filtered){const key=[r.game,r.mode,r.level].join('|');if(!levels.has(key))levels.set(key,{game:r.game,mode:r.mode,level:r.level});const item=levels.get(key);item[r.event]=(item[r.event]||0)+r.n;if(r.reason){const k=key+'|'+r.event+'|'+r.reason;detail.set(k,(detail.get(k)||0)+r.n);}}
 const title=(game,mode,level)=>`${game==='route'?'航线':'双船'} · ${mode==='daily'?`每日题${['',' · 简单',' · 标准',' · 困难'][Number(level)]||''}`:mode==='tutorial'?'教学':`第 ${level} 关`}`;
 const body=panel.querySelector('[data-level-rows]');body.replaceChildren(...[...levels.values()].sort((a,b)=>a.game.localeCompare(b.game)||a.mode.localeCompare(b.mode)||a.level-b.level).map(r=>tr([title(r.game,r.mode,r.level),r.enter||0,r.start||0,r.complete||0,r.start?((r.complete||0)/r.start*100).toFixed(1)+'%':'—',r.hint||0,r.inspect||0,r.reset||0,r.leave||0])));
 if(!levels.size)body.append(tr(['当前范围暂无关卡统计','—','—','—','—','—','—','—','—']));
 const errors=panel.querySelector('[data-reason-rows]');errors.replaceChildren(...[...detail].sort((a,b)=>b[1]-a[1]).map(([key,n])=>{const [g,m,l,e,r]=key.split('|');return tr([title(g,m,l),names[e],reasons[r]||r,n]);}));if(!detail.size)errors.append(tr(['暂无受阻或检查事件','—','—','—']));
}
async function refresh(){
 const id=++requestId,status=panel.querySelector('[data-route-status]');status.textContent='正在读取关卡诊断……';
 try{const response=await fetch((location.hostname==='localhost'?'':'https://www.tylerzhang.xyz')+'/api/route-metrics?days='+days.value,{credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(!Array.isArray(data.rows))throw Error('数据格式异常');if(id!==requestId)return;rows=data.rows;render();status.textContent='已更新。新口径从 2026-11-18 开始，不补造历史数据。';}catch(e){if(id===requestId)status.textContent=`关卡诊断读取失败（${e.message}），没有将失败显示为零。已有结果若存在则暂时保留。`;}
}
for(const control of [source,product])control.addEventListener('change',render);days.addEventListener('change',refresh);document.querySelector('#refresh').addEventListener('click',refresh);refresh();
