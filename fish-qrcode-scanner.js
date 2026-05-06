/* fish-qrcode-scanner.js — 二维码扫一扫解析 */
class FishQrcodeScanner{
  constructor(){
    this.el=document.getElementById('fish-qrcode-scanner');
    if(!this.el)return;
    this.stream=null;
    this.scanning=false;
    this.jsQRLoaded=false;
    this.render();
  }
  render(){
    this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
    this.el.innerHTML=`
      <style>.qrs-wrap{display:flex;flex-direction:column;gap:16px}
      .qrs-tabs{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:4px}
      .qrs-tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s;color:var(--c-muted)}
      .qrs-tab.active{background:var(--c-accent);color:#fff}
      .qrs-cam-wrap{position:relative;border-radius:16px;overflow:hidden;background:#000;display:none}
      .qrs-video{width:100%;display:block;border-radius:16px}
      .qrs-cam-overlay{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:200px;border:2px solid rgba(255,255,255,.6);border-radius:16px;pointer-events:none}
      .qrs-cam-overlay::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:var(--c-accent);animation:qrsScan 2s linear infinite}
      @keyframes qrsScan{0%{top:0}50%{top:calc(100% - 2px)}100%{top:0}}
      .qrs-cam-status{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.7);color:#fff;padding:6px 16px;border-radius:20px;font-size:13px}
      .qrs-upload{border:2px dashed var(--c-border);border-radius:16px;padding:40px 20px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
      .qrs-upload:hover{border-color:var(--c-accent);background:rgba(255,255,255,.02)}
      .qrs-upload input{display:none}
      .qrs-icon{font-size:48px;margin-bottom:8px}
      .qrs-hint{font-size:13px;color:var(--c-muted)}
      .qrs-preview-wrap{position:relative;display:none;text-align:center}
      .qrs-preview{max-width:100%;max-height:300px;border-radius:12px}
      .qrs-result{background:rgba(255,255,255,.03);border:1px solid var(--c-border);border-radius:14px;overflow:hidden;display:none}
      .qrs-result-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--c-border);background:rgba(255,255,255,.02)}
      .qrs-result-title{font-size:14px;font-weight:600}
      .qrs-result-body{padding:16px;font-size:14px;line-height:1.8;word-break:break-all}
      .qrs-result-body a{color:var(--c-accent);text-decoration:underline}
      .qrs-type{display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;margin-bottom:8px}
      .qrs-type-url{background:rgba(100,200,255,.15);color:#64c8ff}
      .qrs-type-text{background:rgba(255,200,100,.15);color:#ffc864}
      .qrs-type-wifi{background:rgba(100,255,150,.15);color:#64ff96}
      .qrs-type-vcard{background:rgba(200,100,255,.15);color:#c864ff}
      .qrs-btns{display:flex;gap:8px;flex-wrap:wrap}
      .qrs-btn{padding:8px 16px;border:none;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s;font-weight:600}
      .qrs-btn-copy{background:rgba(100,255,150,.15);color:#64ff96}
      .qrs-btn-open{background:var(--c-accent);color:#fff}
      .qrs-btn-stop{background:rgba(255,80,80,.15);color:#ff6b6b}
      .qrs-history{max-height:200px;overflow-y:auto;display:flex;flex-direction:column;gap:4px}
      .qrs-history-item{padding:8px 12px;background:rgba(255,255,255,.03);border-radius:8px;font-size:12px;color:var(--c-muted);cursor:pointer;display:flex;align-items:center;gap:8px;transition:all .2s}
      .qrs-history-item:hover{background:rgba(255,255,255,.06);color:var(--c-text)}
      .qrs-status{text-align:center;font-size:13px;color:var(--c-muted)}</style>
      <div class="qrs-wrap">
        <h2 style="text-align:center;margin:0">📷 二维码扫一扫</h2>
        <div class="qrs-tabs">
          <div class="qrs-tab active" data-tab="camera">📷 摄像头扫描</div>
          <div class="qrs-tab" data-tab="upload">📁 上传图片</div>
        </div>
        <div id="qrs-camera-panel">
          <div class="qrs-cam-wrap" id="qrs-cam-wrap">
            <video class="qrs-video" id="qrs-video" playsinline autoplay muted></video>
            <div class="qrs-cam-overlay"></div>
            <div class="qrs-cam-status" id="qrs-cam-status">对准二维码自动识别</div>
          </div>
          <div style="text-align:center;margin-top:12px">
            <button class="qrs-btn qrs-btn-open" id="qrs-start">📷 开始扫描</button>
            <button class="qrs-btn qrs-btn-stop" id="qrs-stop" style="display:none">⏹ 停止扫描</button>
          </div>
        </div>
        <div id="qrs-upload-panel" style="display:none">
          <div class="qrs-upload" id="qrs-upload">
            <input type="file" id="qrs-file" accept="image/*" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:5">
            <div class="qrs-icon">📁</div>
            <div class="qrs-hint">点击上传包含二维码的图片</div>
          </div>
          <div class="qrs-preview-wrap" id="qrs-preview-wrap">
            <img class="qrs-preview" id="qrs-preview">
          </div>
        </div>
        <div class="qrs-status" id="qrs-status"></div>
        <div class="qrs-result" id="qrs-result">
          <div class="qrs-result-header">
            <span class="qrs-result-title">📋 解析结果</span>
            <div class="qrs-btns">
              <button class="qrs-btn qrs-btn-copy" id="qrs-copy">📋 复制</button>
              <button class="qrs-btn qrs-btn-open" id="qrs-open" style="display:none">🔗 打开链接</button>
            </div>
          </div>
          <div class="qrs-result-body" id="qrs-result-body"></div>
        </div>
        <div id="qrs-history-section" style="display:none">
          <div style="font-size:13px;color:var(--c-muted);margin-bottom:8px">📜 扫描历史</div>
          <div class="qrs-history" id="qrs-history"></div>
        </div>
      </div>`;
    this.loadJsQR();
    this.bindEvents();
    this.loadHistory();
  }
  loadJsQR(){
    if(window.jsQR){this.jsQRLoaded=true;return}
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    s.onload=()=>{this.jsQRLoaded=true};
    s.onerror=()=>{console.warn('jsQR加载失败')};
    document.head.appendChild(s);
  }
  bindEvents(){
    const $=s=>this.el.querySelector(s);

    // Tab切换
    this.el.querySelectorAll('.qrs-tab').forEach(tab=>{
      tab.onclick=()=>{
        this.el.querySelectorAll('.qrs-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        $('#qrs-camera-panel').style.display=tab.dataset.tab==='camera'?'':'none';
        $('#qrs-upload-panel').style.display=tab.dataset.tab==='upload'?'':'none';
        if(tab.dataset.tab!=='camera')this.stopCamera();
      };
    });

    // 摄像头
    $('#qrs-start').onclick=()=>this.startCamera();
    $('#qrs-stop').onclick=()=>this.stopCamera();

    // 上传 - input 直接覆盖在上传区，原生点击
    const upload=$('#qrs-upload');
    $('#qrs-file').onchange=()=>{
      const file=$('#qrs-file').files[0];
      if(file)this.handleUpload(file);
    };
    upload.ondragover=e=>{e.preventDefault();upload.style.borderColor='var(--c-accent)'};
    upload.ondragleave=()=>{upload.style.borderColor=''};
    upload.ondrop=e=>{
      e.preventDefault();upload.style.borderColor='';
      if(e.dataTransfer.files[0])this.handleUpload(e.dataTransfer.files[0]);
    };

    // 复制
    $('#qrs-copy').onclick=()=>{
      const text=$('#qrs-result-body').textContent;
      navigator.clipboard.writeText(text).then(()=>{
        $('#qrs-copy').textContent='✅ 已复制';
        setTimeout(()=>{$('#qrs-copy').textContent='📋 复制'},1500);
      });
    };

    // 打开链接
    $('#qrs-open').onclick=()=>{
      const url=$('#qrs-result-body').querySelector('a');
      if(url)window.open(url.href,'_blank');
    };
  }
  async startCamera(){
    const $=s=>this.el.querySelector(s);
    try{
      this.stream=await navigator.mediaDevices.getUserMedia({
        video:{facingMode:'environment',width:{ideal:640},height:{ideal:640}}
      });
      const video=$('#qrs-video');
      video.srcObject=this.stream;
      $('#qrs-cam-wrap').style.display='block';
      $('#qrs-start').style.display='none';
      $('#qrs-stop').style.display='';
      this.scanning=true;
      this.scanLoop(video);
    }catch(e){
      $('#qrs-cam-status').textContent='❌ 无法访问摄像头: '+e.message;
      $('#qrs-cam-wrap').style.display='block';
    }
  }
  stopCamera(){
    const $=s=>this.el.querySelector(s);
    this.scanning=false;
    if(this.stream){this.stream.getTracks().forEach(t=>t.stop());this.stream=null}
    $('#qrs-cam-wrap').style.display='none';
    $('#qrs-start').style.display='';
    $('#qrs-stop').style.display='none';
  }
  scanLoop(video){
    if(!this.scanning)return;
    if(!this.jsQRLoaded||!window.jsQR){
      $('#qrs-cam-status').textContent='⏳ 等待QR解析库加载...';
      requestAnimationFrame(()=>this.scanLoop(video));
      return;
    }
    if(video.readyState===video.HAVE_ENOUGH_DATA){
      const canvas=document.createElement('canvas');
      canvas.width=video.videoWidth;
      canvas.height=video.videoHeight;
      const ctx=canvas.getContext('2d');
      ctx.drawImage(video,0,0);
      const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
      const code=jsQR(imageData.data,imageData.width,imageData.height);
      if(code){
        this.stopCamera();
        this.showResult(code.data);
        this.addHistory(code.data);
        return;
      }
    }
    requestAnimationFrame(()=>this.scanLoop(video));
  }
  handleUpload(file){
    const $=s=>this.el.querySelector(s);
    const reader=new FileReader();
    reader.onload=(e)=>{
      const img=new Image();
      img.onload=()=>{
        $('#qrs-preview').src=e.target.result;
        $('#qrs-preview-wrap').style.display='block';
        if(!this.jsQRLoaded||!window.jsQR){
          $('#qrs-status').textContent='⏳ 等待QR解析库加载...';
          const check=()=>{if(this.jsQRLoaded&&window.jsQR){this.decodeImage(img)}else{setTimeout(check,200)}};
          check();
          return;
        }
        this.decodeImage(img);
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  }
  decodeImage(img){
    const $=s=>this.el.querySelector(s);
    const canvas=document.createElement('canvas');
    canvas.width=img.naturalWidth;
    canvas.height=img.naturalHeight;
    const ctx=canvas.getContext('2d');
    ctx.drawImage(img,0,0);
    const imageData=ctx.getImageData(0,0,canvas.width,canvas.height);
    const code=jsQR(imageData.data,imageData.width,imageData.height);
    if(code){
      this.showResult(code.data);
      this.addHistory(code.data);
    }else{
      $('#qrs-status').textContent='❌ 未检测到二维码，请确保图片清晰';
    }
  }
  showResult(data){
    const $=s=>this.el.querySelector(s);
    const result=$('#qrs-result');
    const body=$('#qrs-result-body');
    const openBtn=$('#qrs-open');
    const status=$('#qrs-status');

    // 判断类型
    let type='text',typeLabel='文本',typeClass='qrs-type-text';
    const isUrl=/^https?:\/\//i.test(data);
    const isWifi=/^WIFI:/i.test(data);
    const isVcard=/^BEGIN:VCARD/i.test(data);

    if(isUrl){type='url';typeLabel='🔗 链接';typeClass='qrs-type-url'}
    else if(isWifi){type='wifi';typeLabel='📶 WiFi';typeClass='qrs-type-wifi'}
    else if(isVcard){type='vcard';typeLabel='👤 名片';typeClass='qrs-type-vcard'}

    let contentHtml='';
    if(type==='url'){
      contentHtml=`<a href="${data}" target="_blank" rel="noopener">${data}</a>`;
      openBtn.style.display='';
    }else if(type==='wifi'){
      const match=data.match(/WIFI:S:(.*?);T:(.*?);P:(.*?);/);
      if(match){
        contentHtml=`<b>网络名:</b> ${match[1]}<br><b>加密方式:</b> ${match[2]}<br><b>密码:</b> ${match[3]}`;
      }else{contentHtml=data}
      openBtn.style.display='none';
    }else{
      contentHtml=data.replace(/</g,'&lt;').replace(/>/g,'&gt;');
      openBtn.style.display='none';
    }

    body.innerHTML=`<span class="qrs-type ${typeClass}">${typeLabel}</span><br>${contentHtml}`;
    result.style.display='block';
    status.textContent='✅ 识别成功';
  }
  addHistory(data){
    try{
      let history=JSON.parse(localStorage.getItem('fish_qr_history')||'[]');
      history.unshift({data,time:new Date().toLocaleString('zh-CN'),ts:Date.now()});
      if(history.length>50)history=history.slice(0,50);
      localStorage.setItem('fish_qr_history',JSON.stringify(history));
      this.loadHistory();
    }catch(e){}
  }
  loadHistory(){
    const $=s=>this.el.querySelector(s);
    try{
      const history=JSON.parse(localStorage.getItem('fish_qr_history')||'[]');
      if(!history.length){$('#qrs-history-section').style.display='none';return}
      $('#qrs-history-section').style.display='';
      const isUrl=d=>/^https?:\/\//i.test(d);
      $('#qrs-history').innerHTML=history.slice(0,20).map((h,i)=>
        `<div class="qrs-history-item" data-i="${i}">
          <span style="font-size:11px;color:var(--c-muted);white-space:nowrap">${h.time}</span>
          <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${isUrl(h.data)?'🔗 '+h.data:h.data}</span>
        </div>`
      ).join('');
      $('#qrs-history').querySelectorAll('.qrs-history-item').forEach(item=>{
        item.onclick=()=>{const h=history[+item.dataset.i];if(h)this.showResult(h.data)};
      });
    }catch(e){}
  }}
new FishQrcodeScanner();
