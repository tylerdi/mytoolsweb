/* fish-devtool.js — 开发者工具箱 */
class FishDevtool{
init(el){
  this.el=el;
  this.render();
}
render(){
  this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
  this.el.innerHTML=`
    <style>.dev-wrap{display:flex;flex-direction:column;gap:16px}
    .dev-tabs{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:4px;flex-wrap:wrap}
    .dev-tab{flex:1;text-align:center;min-width:60px;padding:8px 6px;border-radius:8px;font-size:12px;cursor:pointer;transition:all .2s;color:var(--c-muted)}
    .dev-tab.active{background:var(--c-accent);color:#fff}
    .dev-panel{display:flex;flex-direction:column;gap:12px}
    .dev-input{width:100%;padding:12px;background:rgba(255,255,255,.05);border:1px solid var(--c-border);border-radius:10px;color:var(--c-text);font-size:14px;font-family:monospace;outline:none;box-sizing:border-box}
    .dev-input:focus{border-color:var(--c-accent)}
    .dev-textarea{min-height:80px;resize:vertical}
    .dev-btn{padding:10px 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;background:var(--c-accent);color:#fff;align-self:flex-start}
    .dev-result{padding:12px;background:rgba(255,255,255,.03);border:1px solid var(--c-border);border-radius:10px;font-family:monospace;font-size:13px;line-height:1.8;word-break:break-all;color:var(--c-text)}
    .dev-label{font-size:13px;color:var(--c-muted)}
    .dev-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}
    .dev-chip{padding:6px 10px;background:rgba(255,255,255,.05);border-radius:8px;font-size:12px;color:var(--c-muted);cursor:pointer;transition:all .2s;text-align:center}
    .dev-chip:hover{background:rgba(255,255,255,.1);color:var(--c-text)}
    .dev-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .dev-copy{background:rgba(100,255,150,.15);color:#64ff96;padding:6px 12px;border:none;border-radius:8px;font-size:12px;cursor:pointer}</style>
    <div class="dev-wrap">
      <h2 style="text-align:center;margin:0">🛠 开发者工具箱</h2>
      <div class="dev-tabs">
        <div class="dev-tab active" data-t="hash">Hash</div>
        <div class="dev-tab" data-t="regex">正则测试</div>
        <div class="dev-tab" data-t="json">JSON格式化</div>
        <div class="dev-tab" data-t="cron">Cron生成</div>
        <div class="dev-tab" data-t="uuid">UUID生成</div>
        <div class="dev-tab" data-t="timestamp">时间戳</div>
        <div class="dev-tab" data-t="ua">UA解析</div>
      </div>
      <div id="dev-panel"></div>
    </div>`;
  this.el.querySelectorAll('.dev-tab').forEach(t=>{t.onclick=()=>{this.el.querySelectorAll('.dev-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');this.showPanel(t.dataset.t)}});
  this.showPanel('hash');
}
showPanel(t){
  const p=this.el.querySelector('#dev-panel');
  if(t==='hash')this.panelHash(p);
  else if(t==='regex')this.panelRegex(p);
  else if(t==='json')this.panelJson(p);
  else if(t==='cron')this.panelCron(p);
  else if(t==='uuid')this.panelUuid(p);
  else if(t==='timestamp')this.panelTs(p);
  else if(t==='ua')this.panelUA(p);
}
async hash(str,algo){
  const buf=await crypto.subtle.digest(algo,new TextEncoder().encode(str));
  return[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
panelHash(p){
  p.innerHTML=`<div class="dev-panel">
    <div class="dev-label">输入文本</div>
    <textarea class="dev-input dev-textarea" id="dev-hash-in" placeholder="输入要计算哈希的文本..."></textarea>
    <button class="dev-btn" id="dev-hash-go">计算 Hash</button>
    <div class="dev-result" id="dev-hash-out">点击按钮计算</div>
  </div>`;
  this.el.querySelector('#dev-hash-go').onclick=async()=>{
    const s=this.el.querySelector('#dev-hash-in').value;
    if(!s){this.el.querySelector('#dev-hash-out').textContent='请输入文本';return}
    const[md5,sha1,sha256,sha512]=await Promise.all([
      this.hash(s,'SHA-1'),this.hash(s,'SHA-1'),this.hash(s,'SHA-256'),this.hash(s,'SHA-512')
    ]);
    this.el.querySelector('#dev-hash-out').innerHTML=
      `<b>SHA-1:</b> ${sha1}<br><b>SHA-256:</b> ${sha256}<br><b>SHA-512:</b> ${sha512.slice(0,64)}...`;
  };
}
panelRegex(p){
  p.innerHTML=`<div class="dev-panel">
    <div class="dev-label">正则表达式</div>
    <input class="dev-input" id="dev-regex" placeholder="/pattern/flags" value="">
    <div class="dev-label">测试文本</div>
    <textarea class="dev-input dev-textarea" id="dev-regex-text" placeholder="输入测试文本..."></textarea>
    <div class="dev-result" id="dev-regex-out">输入正则和文本进行测试</div>
  </div>`;
  const run=()=>{
    try{
      const raw=this.el.querySelector('#dev-regex').value;
      const m=raw.match(/^\/(.+)\/([gimsuy]*)$/);
      const re=m?new RegExp(m[1],m[2]):new RegExp(raw,'g');
      const text=this.el.querySelector('#dev-regex-text').value;
      const matches=[...text.matchAll(new RegExp(re.source,re.flags.includes('g')?re.flags:re.flags+'g'))];
      if(!matches.length){this.el.querySelector('#dev-regex-out').textContent='没有匹配';return}
      this.el.querySelector('#dev-regex-out').innerHTML=matches.map((m,i)=>
        `<span style="color:var(--c-accent)">匹配${i+1}:</span> "${m[0]}" <span style="color:var(--c-muted)">位置 ${m.index}</span>`).join('<br>');
    }catch(e){this.el.querySelector('#dev-regex-out').textContent='❌ '+e.message}
  };
  this.el.querySelector('#dev-regex').oninput=run;
  this.el.querySelector('#dev-regex-text').oninput=run;
}
panelJson(p){
  p.innerHTML=`<div class="dev-panel">
    <div class="dev-label">输入 JSON</div>
    <textarea class="dev-input dev-textarea" id="dev-json-in" placeholder='{"key":"value"}' style="min-height:120px"></textarea>
    <div class="dev-row">
      <button class="dev-btn" id="dev-json-fmt">格式化</button>
      <button class="dev-btn" id="dev-json-min" style="background:rgba(255,255,255,.1);color:var(--c-text)">压缩</button>
      <button class="dev-copy" id="dev-json-copy">📋 复制</button>
    </div>
    <div class="dev-result" id="dev-json-out" style="white-space:pre-wrap;max-height:300px;overflow-y:auto"></div>
  </div>`;
  this.el.querySelector('#dev-json-fmt').onclick=()=>{
    try{const o=JSON.parse(this.el.querySelector('#dev-json-in').value);this.el.querySelector('#dev-json-out').textContent=JSON.stringify(o,null,2)}
    catch(e){this.el.querySelector('#dev-json-out').textContent='❌ '+e.message}
  };
  this.el.querySelector('#dev-json-min').onclick=()=>{
    try{const o=JSON.parse(this.el.querySelector('#dev-json-in').value);this.el.querySelector('#dev-json-out').textContent=JSON.stringify(o)}
    catch(e){this.el.querySelector('#dev-json-out').textContent='❌ '+e.message}
  };
  this.el.querySelector('#dev-json-copy').onclick=()=>{navigator.clipboard.writeText(this.el.querySelector('#dev-json-out').textContent)};
}
panelCron(p){
  const presets=['每分钟','每小时','每天零点','每天8点','每周一','每月1号','每5分钟','工作日9点'];
  const exprs=['* * * * *','0 * * * *','0 0 * * *','0 8 * * *','0 0 * * 1','0 0 1 * *','*/5 * * * *','0 9 * * 1-5'];
  p.innerHTML=`<div class="dev-panel">
    <div class="dev-label">常用 Cron 表达式（点击使用）</div>
    <div class="dev-grid">${presets.map((pr,i)=>`<div class="dev-chip" data-v="${exprs[i]}">${pr}<br><small style="color:var(--c-accent)">${exprs[i]}</small></div>`).join('')}</div>
    <div class="dev-label">自定义表达式</div>
    <input class="dev-input" id="dev-cron-in" placeholder="* * * * *" value="0 8 * * *">
    <div class="dev-label">字段说明</div>
    <div class="dev-result" id="dev-cron-out">分 时 日 月 周</div>
  </div>`;
  this.el.querySelectorAll('.dev-chip').forEach(c=>{c.onclick=()=>{this.el.querySelector('#dev-cron-in').value=c.dataset.v;parseCron()}});
  const parseCron=()=>{
    const v=this.el.querySelector('#dev-cron-in').value.trim();
    const parts=v.split(/\s+/);
    if(parts.length!==5){this.el.querySelector('#dev-cron-out').textContent='❌ Cron 需要5个字段';return}
    const labels=['分钟','小时','日期','月份','星期'];
    const meanings=parts.map((p,i)=>{
      if(p==='*')return'每'+labels[i];
      if(p.startsWith('*/'))return'每'+p.slice(2)+labels[i];
      return labels[i]+'='+p;
    });
    this.el.querySelector('#dev-cron-out').innerHTML=`<b>${v}</b><br>${meanings.join('，')}`;
  };
  this.el.querySelector('#dev-cron-in').oninput=parseCron;
  this.el.querySelectorAll('.dev-chip').forEach(c=>{c.onclick=()=>{this.el.querySelector('#dev-cron-in').value=c.dataset.v;parseCron()}});
}
panelUuid(p){
  const gen=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:r&0x3|0x8).toString(16)});
  p.innerHTML=`<div class="dev-panel">
    <button class="dev-btn" id="dev-uuid-go">🔄 生成 UUID</button>
    <div class="dev-result" id="dev-uuid-out" style="font-size:16px;text-align:center;padding:20px;cursor:pointer" title="点击复制">${gen()}</div>
    <div class="dev-label" style="text-align:center">点击结果复制</div>
  </div>`;
  this.el.querySelector('#dev-uuid-go').onclick=()=>{this.el.querySelector('#dev-uuid-out').textContent=gen()};
  this.el.querySelector('#dev-uuid-out').onclick=()=>{navigator.clipboard.writeText(this.el.querySelector('#dev-uuid-out').textContent)};
}
panelTs(p){
  const now=Math.floor(Date.now()/1000);
  p.innerHTML=`<div class="dev-panel">
    <div class="dev-label">当前时间戳</div>
    <div class="dev-result" id="dev-ts-now" style="font-size:18px;text-align:center;padding:16px">${now} (${new Date().toLocaleString('zh-CN')})</div>
    <div class="dev-label">时间戳 → 日期</div>
    <div class="dev-row">
      <input class="dev-input" id="dev-ts-in" placeholder="输入时间戳（秒或毫秒）" value="${now}" style="flex:1">
      <button class="dev-btn" id="dev-ts-go">转换</button>
    </div>
    <div class="dev-result" id="dev-ts-out"></div>
    <div class="dev-label">日期 → 时间戳</div>
    <input class="dev-input" id="dev-ts-date" type="datetime-local">
    <div class="dev-result" id="dev-ts-date-out"></div>
  </div>`;
  this.el.querySelector('#dev-ts-go').onclick=()=>{
    let v=this.el.querySelector('#dev-ts-in').value.trim();
    if(!v)return;
    if(v.length===10)v=parseInt(v)*1000;
    const d=new Date(+v);
    this.el.querySelector('#dev-ts-out').innerHTML=`<b>${d.toLocaleString('zh-CN')}</b><br>秒: ${Math.floor(d.getTime()/1000)}<br>毫秒: ${d.getTime()}`;
  };
  this.el.querySelector('#dev-ts-date').oninput=()=>{
    const v=this.el.querySelector('#dev-ts-date').value;
    if(!v)return;
    const d=new Date(v);
    this.el.querySelector('#dev-ts-date-out').innerHTML=`秒: <b>${Math.floor(d.getTime()/1000)}</b><br>毫秒: <b>${d.getTime()}</b>`;
  };
}
panelUA(p){
  const ua=navigator.userAgent;
  const isMobile=/Mobile|Android|iPhone|iPad/i.test(ua);
  const browser=ua.includes('Chrome')&&!ua.includes('Edg')?'Chrome':ua.includes('Safari')&&!ua.includes('Chrome')?'Safari':ua.includes('Firefox')?'Firefox':ua.includes('Edg')?'Edge':'未知';
  const os=ua.includes('Mac')?'macOS':ua.includes('Windows')?'Windows':ua.includes('Android')?'Android':ua.includes('iPhone')||ua.includes('iPad')?'iOS':'未知';
  p.innerHTML=`<div class="dev-panel">
    <div class="dev-label">当前 User-Agent</div>
    <div class="dev-result" style="word-break:break-all">${ua}</div>
    <div class="dev-label">解析结果</div>
    <div class="dev-result">
      <b>浏览器:</b> ${browser}<br>
      <b>系统:</b> ${os}<br>
      <b>设备:</b> ${isMobile?'📱 移动端':'🖥 桌面端'}<br>
      <b>语言:</b> ${navigator.language}<br>
      <b>屏幕:</b> ${screen.width}×${screen.height}<br>
      <b>像素比:</b> ${window.devicePixelRatio}x<br>
      <b>CPU核心:</b> ${navigator.hardwareConcurrency||'未知'}
    </div>
    <div class="dev-label">自定义 UA 解析</div>
    <textarea class="dev-input dev-textarea" id="dev-ua-in" placeholder="粘贴 User-Agent 字符串..."></textarea>
    <div class="dev-result" id="dev-ua-out"></div>
  </div>`;
  this.el.querySelector('#dev-ua-in').oninput=()=>{
    const s=this.el.querySelector('#dev-ua-in').value;
    if(!s){this.el.querySelector('#dev-ua-out').textContent='';return}
    const mob=/Mobile|Android|iPhone|iPad/i.test(s);
    const br=s.includes('Chrome')&&!s.includes('Edg')?'Chrome':s.includes('Safari')&&!s.includes('Chrome')?'Safari':s.includes('Firefox')?'Firefox':s.includes('Edg')?'Edge':'未知';
    const syst=s.includes('Mac')?'macOS':s.includes('Windows')?'Windows':s.includes('Android')?'Android':s.includes('iPhone')||s.includes('iPad')?'iOS':'未知';
    this.el.querySelector('#dev-ua-out').innerHTML=`<b>浏览器:</b> ${br}<br><b>系统:</b> ${syst}<br><b>设备:</b> ${mob?'📱 移动端':'🖥 桌面端'}`;
  };
}}
window.fishDevtool=new FishDevtool();
