import {ENDPOINT,PRODUCTS,SOURCES,EVENTS,summarize} from './core.mjs';
const $=s=>document.querySelector(s),make=(tag,text,className)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el};
const state={rows:[],asOf:''};
for(const [id,label] of Object.entries(PRODUCTS))$('#product').append(new Option(label,id));
for(const [id,label] of Object.entries(SOURCES))$('#source').append(new Option(label,id));
const names={enter:'进入庭院',bell:'敲钟',wood:'叩木鱼',fish:'喂鱼',beads:'拨念珠',greet:'合掌',sit:'开始静坐',sit_1min:'静坐满 1 分钟',sit_3min:'静坐满 3 分钟',sit_5min:'静坐满 5 分钟',copy:'复制分享',native:'系统分享完成',postcard:'保存明信片',mission:'正式任务',training:'教学',fire:'首次开火',relay:'切断中继',escape:'登船撤离',route_daily:'航线每日',route_practice:'航线闯关',route_tutorial:'航线教学',twins_daily:'双船每日',twins_practice:'双船练习',twins_tutorial:'双船教学',route_move:'航线移动',twins_move:'双船移动',editor:'自制关卡',editor_move:'自制关卡移动',route_link:'分享航线',twins_link:'分享双船',editor_link:'分享自制关卡'};
function row(cells){const tr=make('tr');for(const text of cells)tr.append(make('td',String(text)));return tr}
const percent=(a,b)=>b?`${(a/b*100).toFixed(1)}%`:'—';
function render(){
 const product=$('#product').value,source=$('#source').value,{rows,totals}=summarize(state.rows,product,source);
 $('#cards').replaceChildren(...Object.entries(EVENTS).map(([id,label])=>{const card=make('div',undefined,'card');card.append(make('span',label),make('strong',totals[id].toLocaleString()),make('small',id==='visit'?'标签页会话，非独立人数':id==='start'?`占访问 ${percent(totals.start,totals.visit)}`:id==='complete'?`占开始 ${percent(totals.complete,totals.start)}`:'每会话同类事件至多一次'));return card}));
 const products=$('#products');products.replaceChildren();for(const [id,name] of Object.entries(PRODUCTS)){if(product!=='all'&&product!==id)continue;const t=summarize(state.rows,id,source).totals;products.append(row([name,...Object.keys(EVENTS).map(k=>t[k]),percent(t.start,t.visit),percent(t.complete,t.start)]))}
 const sources=$('#sources');sources.replaceChildren();for(const [id,name] of Object.entries(SOURCES)){if(source==='all'&&id==='qa'||source!=='all'&&source!==id)continue;const t=summarize(state.rows,product,id).totals;sources.append(row([name,...Object.keys(EVENTS).map(k=>t[k])]))}
 const details=new Map();for(const r of rows)if(r.detail){const id=[r.product,r.event,r.detail].join('|');details.set(id,(details.get(id)||0)+r.n)}
 $('#details').replaceChildren(...[...details].sort((a,b)=>b[1]-a[1]).map(([key,n])=>{const [p,e,d]=key.split('|');return row([PRODUCTS[p],EVENTS[e],names[d]||d,n])}));if(!details.size)$('#details').append(row(['暂无细分事件','—','—','—']));
 const count=Number($('#days').value),daily=[];for(let i=count-1;i>=0;i--){const day=new Date(Date.now()-i*86400000).toISOString().slice(0,10),t=summarize(rows.filter(r=>r.day===day)).totals;daily.push({day,...t})}
 // summarize already applied the source filter; keep QA when explicitly selected.
 if(source==='qa')for(const d of daily){const rr=rows.filter(r=>r.day===d.day&&r.detail==='');d.visit=rr.filter(r=>r.event==='visit').reduce((s,r)=>s+r.n,0);d.start=rr.filter(r=>r.event==='start').reduce((s,r)=>s+r.n,0)}
 $('#daily').replaceChildren(...daily.map(d=>row([d.day,d.visit,d.start])));
 const max=Math.max(1,...daily.flatMap(d=>[d.visit,d.start]));$('#chart').replaceChildren(...daily.map(d=>{const item=make('div',undefined,'day'),bars=make('div',undefined,'bars');for(const key of ['visit','start']){const bar=make('div',undefined,`bar ${key}`);bar.style.height=`${d[key]/max*100}%`;bar.title=`${d.day} ${EVENTS[key]} ${d[key]}`;bars.append(bar)}item.append(bars,make('small',d.day.slice(5)));return item}));
 $('#empty').hidden=totals.visit>0;$('#updated').textContent=`更新于 ${new Date(state.asOf).toLocaleString('zh-CN')} · 按 UTC 自然日汇总`;
}
async function refresh(){
 $('#refresh').disabled=true;$('#status').className='note';$('#status').textContent='正在读取三个产品的汇总…';
 try{const response=await fetch(`${ENDPOINT}/stats?days=${$('#days').value}`,{credentials:'omit',referrerPolicy:'no-referrer'});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json();if(!Array.isArray(data.rows))throw new Error('数据格式异常');state.rows=data.rows;state.asOf=data.asOf;render();$('#status').textContent='统计已更新。默认排除测试来源；旧版数据未混入。'}catch(error){$('#status').className='error';$('#status').textContent=`统计读取失败（${error.message}）。未把失败显示为 0，请重试。`;$('#updated').textContent=state.asOf?'下方保留上次读取结果':'尚未取得数据'}finally{$('#refresh').disabled=false}
}
for(const id of ['product','source'])$('#'+id).addEventListener('change',()=>{if(state.asOf)render()});$('#days').addEventListener('change',refresh);$('#refresh').addEventListener('click',refresh);
const urls={route:'https://www.tylerzhang.xyz/',temple:'https://temple.tylerzhang.xyz/',jimao:'https://jimao.tylerzhang.xyz/'};
for(const [id,title] of Object.entries(PRODUCTS)){const box=make('div',undefined,'promo'),input=make('input'),button=make('button','复制推广链接');input.readOnly=true;input.value=urls[id]+'?utm_source=ai6666&utm_campaign=opc_store';input.setAttribute('aria-label',title+'推广链接');button.onclick=async()=>{try{await navigator.clipboard.writeText(input.value);button.textContent='已复制'}catch{input.select();button.textContent='请手动复制'}};box.append(make('strong',title),input,button);$('#promos').append(box)}
refresh();
