const en=document.documentElement.lang==='en';
try{localStorage.setItem('jimao:language',JSON.stringify(en?'en':'zh'))}catch{}
const toggle=document.getElementById('metrics-toggle'),status=document.getElementById('metrics-status');
if(toggle){let off=false;try{off=JSON.parse(localStorage.getItem('jimao:metrics-off'))===true}catch{}
const render=()=>{toggle.textContent=en?(off?'Enable aggregate metrics':'Disable aggregate metrics'):(off?'开启汇总统计':'关闭汇总统计');status.textContent=en?(off?'Event collection is disabled in this browser.':'Only aggregate event counts are collected. DNT and GPC also disable collection.'):(off?'当前浏览器已关闭事件统计。':'当前仅收集汇总事件次数；DNT 和 GPC 信号也会关闭统计。')};toggle.onclick=()=>{off=!off;try{localStorage.setItem('jimao:metrics-off',JSON.stringify(off))}catch{}render()};render()}
