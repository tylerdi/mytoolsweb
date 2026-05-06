/* fish-base64.js — 编解码工具箱（Base64/URL/Unicode/HTML实体） */
class FishBase64{
constructor(){
  this.el=document.getElementById('fish-base64');
  if(!this.el)return;
  this.mode='base64';
  this.render();
}
render(){
  this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
  this.el.innerHTML=`
    <style>.b64-wrap{display:flex;flex-direction:column;gap:16px}
    .b64-tabs{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:4px;flex-wrap:wrap}
    .b64-tab{flex:1;text-align:center;min-width:60px;padding:8px 6px;border-radius:8px;font-size:12px;cursor:pointer;transition:all .2s;color:var(--c-muted)}
    .b64-tab.active{background:var(--c-accent);color:#fff}
    .b64-area{width:100%;min-height:100px;padding:12px;background:rgba(255,255,255,.05);border:1px solid var(--c-border);border-radius:12px;color:var(--c-text);font-size:14px;font-family:monospace;resize:vertical;outline:none;box-sizing:border-box}
    .b64-area:focus{border-color:var(--c-accent)}
    .b64-row{display:flex;gap:8px;flex-wrap:wrap}
    .b64-btn{padding:10px 18px;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s}
    .b64-enc{background:var(--c-accent);color:#fff}
    .b64-dec{background:rgba(255,255,255,.1);color:var(--c-text);border:1px solid var(--c-border)}
    .b64-swap{background:rgba(100,200,255,.15);color:#64c8ff}
    .b64-copy{background:rgba(100,255,150,.15);color:#64ff96}
    .b64-info{font-size:12px;color:var(--c-muted);text-align:center}
    .b64-label{font-size:13px;color:var(--c-muted);display:flex;align-items:center;justify-content:space-between}</style>
    <div class="b64-wrap">
      <h2 style="text-align:center;margin:0">🔧 编解码工具箱</h2>
      <div class="b64-tabs">
        <div class="b64-tab active" data-m="base64">Base64</div>
        <div class="b64-tab" data-m="url">URL编码</div>
        <div class="b64-tab" data-m="unicode">Unicode</div>
        <div class="b64-tab" data-m="html">HTML实体</div>
        <div class="b64-tab" data-m="hex">Hex</div>
      </div>
      <div class="b64-label">原文 <span id="b64-len-in"></span></div>
      <textarea class="b64-area" id="b64-in" placeholder="输入原文..."></textarea>
      <div class="b64-row">
        <button class="b64-btn b64-enc" id="b64-enc">编码 ↓</button>
        <button class="b64-btn b64-dec" id="b64-dec">解码 ↑</button>
        <button class="b64-btn b64-swap" id="b64-swap">⇅ 交换</button>
        <button class="b64-btn b64-copy" id="b64-copy-out">📋 复制结果</button>
      </div>
      <div class="b64-label">结果 <span id="b64-len-out"></span></div>
      <textarea class="b64-area" id="b64-out" placeholder="结果..." readonly></textarea>
      <div class="b64-info" id="b64-info"></div>
    </div>`;
  const $=s=>this.el.querySelector(s);
  this.el.querySelectorAll('.b64-tab').forEach(t=>{t.onclick=()=>{this.mode=t.dataset.m;this.el.querySelectorAll('.b64-tab').forEach(x=>x.classList.remove('active'));t.classList.add('active');$('#b64-in').value='';$('#b64-out').value='';$('#b64-info').textContent=''}});
  $('#b64-enc').onclick=()=>this.transform('encode');
  $('#b64-dec').onclick=()=>this.transform('decode');
  $('#b64-swap').onclick=()=>{const a=$('#b64-in'),b=$('#b64-out');const t=a.value;a.value=b.value;b.value=t};
  $('#b64-copy-out').onclick=()=>{navigator.clipboard.writeText($('#b64-out').value).then(()=>{$('#b64-info').textContent='✅ 已复制'})};
  ['b64-in','b64-out'].forEach(id=>{$('#'+id).oninput=()=>{$('#b64-len-in').textContent=$('#b64-in').value.length+'字';$('#b64-len-out').textContent=$('#b64-out').value.length+'字'}});
}
transform(dir){
  const $=s=>this.el.querySelector(s);
  const inp=$('#b64-in').value;const out=$('#b64-out');const info=$('#b64-info');
  try{
    if(this.mode==='base64'){
      out.value=dir==='encode'?btoa(unescape(encodeURIComponent(inp))):decodeURIComponent(escape(atob(inp)));
    }else if(this.mode==='url'){
      out.value=dir==='encode'?encodeURIComponent(inp):decodeURIComponent(inp);
    }else if(this.mode==='unicode'){
      if(dir==='encode'){out.value=[...inp].map(c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0')).join('')}
      else{out.value=inp.replace(/\\u([0-9a-fA-F]{4})/g,(_,h)=>String.fromCharCode(parseInt(h,16)))}
    }else if(this.mode==='html'){
      if(dir==='encode'){out.value=[...inp].map(c=>'&#'+c.charCodeAt(0)+';').join('')}
      else{out.value=inp.replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(+n))}
    }else if(this.mode==='hex'){
      if(dir==='encode'){out.value=[...inp].map(c=>c.charCodeAt(0).toString(16).padStart(2,'0')).join(' ')}
      else{out.value=inp.replace(/\s+/g,'').match(/.{1,2}/g).map(h=>String.fromCharCode(parseInt(h,16))).join('')}
    }
    info.textContent=`✅ ${dir==='encode'?'编码':'解码'}成功，${out.value.length} 字符`;
  }catch(e){info.textContent='❌ '+e.message}
}}
new FishBase64();
