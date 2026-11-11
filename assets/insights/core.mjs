export const ENDPOINT = 'https://jimao.tylerzhang.xyz/api/insights';
export const PRODUCTS = {route:'每日航线',temple:'听雨山寺',jimao:'几猫：港区突围'};
export const SOURCES = {ai6666:'火了没',share:'朋友分享',search:'搜索',direct:'直接 / 未知',other:'其他外部',qa:'测试'};
export const EVENTS = {visit:'访问',start:'开始体验',interact:'关键互动',complete:'完成',share:'分享'};
export const DETAILS = {
 route:{start:['route_daily','route_practice','route_tutorial','twins_daily','twins_practice','twins_tutorial','editor'],interact:['route_move','twins_move','editor_move','route_tutorial','twins_tutorial'],complete:['route_daily','route_practice','route_tutorial','twins_daily','twins_practice','twins_tutorial','editor'],share:['route_link','twins_link','editor_link']},
 temple:{start:['enter'],interact:['bell','wood','fish','beads','greet','sit'],complete:['sit_1min','sit_3min','sit_5min'],share:['copy','native','postcard']},
 jimao:{start:['mission','training'],interact:['fire','relay','training'],complete:['escape'],share:['copy','native']}
};
export function validEvent(data){
 return !!data && Object.keys(data).sort().join(',')==='detail,event,product,source' && Object.hasOwn(PRODUCTS,data.product) && Object.hasOwn(SOURCES,data.source) && Object.hasOwn(EVENTS,data.event) && (data.detail==='' || (DETAILS[data.product][data.event]||[]).includes(data.detail));
}
export function classifySource(href,referrer=''){
 const url=new URL(href),tag=url.searchParams.get('utm_source');
 if(tag)return Object.hasOwn(SOURCES,tag)?tag:'other';
 if(!referrer)return 'direct';
 try{const host=new URL(referrer).hostname;if(host==='ai6666.com'||host.endsWith('.ai6666.com'))return 'ai6666';if(/(^|\.)(google\.[a-z.]+|bing.com|baidu.com|duckduckgo.com)$/.test(host))return 'search';if(host===url.hostname)return null;return 'other'}catch{return 'direct'}
}
export function summarize(rows,product='all',source='all'){
 const filtered=rows.filter(r=>(product==='all'||r.product===product)&&(source==='all'?r.source!=='qa':r.source===source));
 const totals=Object.fromEntries(Object.keys(EVENTS).map(k=>[k,0]));
 for(const r of filtered)if(r.detail===''&&Object.hasOwn(totals,r.event))totals[r.event]+=r.n;
 return {rows:filtered,totals};
}
