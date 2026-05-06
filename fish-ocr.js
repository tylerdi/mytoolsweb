/* fish-ocr.js — 拍照识别文字 + AI解答 */
class FishOcr{
  constructor(){
    this.el=document.getElementById('fish-ocr');
    if(!this.el)return;
    this.API='https://fufu.iqach.top/v1/chat/completions';
    this.imgData=null;
    this.extractedText='';
    this.render();
  }
  render(){
    this.el.style.cssText='max-width:700px;margin:0 auto;padding:20px';
    this.el.innerHTML=`
      <style>.ocr-wrap{display:flex;flex-direction:column;gap:16px}
      .ocr-upload{border:2px dashed var(--c-border);border-radius:16px;padding:40px 20px;text-align:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden}
      .ocr-upload:hover{border-color:var(--c-accent);background:rgba(255,255,255,.02)}
      .ocr-upload.has-img{padding:10px;border-style:solid}
      .ocr-upload input{display:none}
      .ocr-icon{font-size:48px;margin-bottom:8px}
      .ocr-hint{font-size:13px;color:var(--c-muted)}
      .ocr-preview{max-width:100%;max-height:400px;border-radius:12px;display:none;object-fit:contain}
      .ocr-btns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
      .ocr-btn{padding:10px 20px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s}
      .ocr-btn-primary{background:var(--c-accent);color:#fff}.ocr-btn-primary:hover{filter:brightness(1.15)}
      .ocr-btn-primary:disabled{opacity:.5;cursor:not-allowed}
      .ocr-btn-secondary{background:rgba(255,255,255,.08);color:var(--c-text);border:1px solid var(--c-border)}
      .ocr-btn-camera{background:rgba(100,200,255,.12);color:#64c8ff;border:1px solid rgba(100,200,255,.2)}
      .ocr-result{background:rgba(255,255,255,.03);border:1px solid var(--c-border);border-radius:14px;overflow:hidden;display:none}
      .ocr-result-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--c-border);background:rgba(255,255,255,.02)}
      .ocr-result-title{font-size:14px;font-weight:600}
      .ocr-result-body{padding:16px;font-size:14px;line-height:1.8;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto}
      .ocr-ai{background:rgba(255,255,255,.03);border:1px solid var(--c-border);border-radius:14px;overflow:hidden;display:none}
      .ocr-ai-header{padding:12px 16px;border-bottom:1px solid var(--c-border);background:rgba(255,255,255,.02);font-size:14px;font-weight:600}
      .ocr-ai-body{padding:16px;font-size:14px;line-height:1.8;max-height:400px;overflow-y:auto}
      .ocr-status{text-align:center;font-size:13px;color:var(--c-muted);padding:8px}
      .ocr-status.loading{color:var(--c-accent)}
      .ocr-copy-btn{padding:4px 12px;border:none;border-radius:6px;font-size:12px;cursor:pointer;background:rgba(100,255,150,.15);color:#64ff96;transition:all .2s}
      .ocr-copy-btn:active{transform:scale(.95)}
      .ocr-cam-preview{width:100%;border-radius:12px;display:none;background:#000}
      .ocr-cam-close{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(0,0,0,.6);color:#fff;font-size:16px;cursor:pointer;z-index:2}
      .ocr-tabs{display:flex;gap:4px;background:rgba(255,255,255,.03);border-radius:10px;padding:4px}
      .ocr-tab{flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;cursor:pointer;transition:all .2s;color:var(--c-muted)}
      .ocr-tab.active{background:var(--c-accent);color:#fff}</style>
      <div class="ocr-wrap">
        <h2 style="text-align:center;margin:0">📸 文字识别</h2>
        <div class="ocr-tabs">
          <div class="ocr-tab active" data-tab="upload">📁 上传图片</div>
          <div class="ocr-tab" data-tab="camera">📷 拍照识别</div>
        </div>
        <div class="ocr-upload" id="ocr-upload">
          <input type="file" id="ocr-file" accept="image/*">
          <input type="file" id="ocr-camera" accept="image/*" capture="environment">
          <div id="ocr-upload-content">
            <div class="ocr-icon">📸</div>
            <div class="ocr-hint">点击上传图片，或拖拽图片到此处</div>
          </div>
          <img class="ocr-preview" id="ocr-preview">
        </div>
        <div class="ocr-btns">
          <button class="ocr-btn ocr-btn-primary" id="ocr-recognize" disabled>🔍 识别文字</button>
          <button class="ocr-btn ocr-btn-secondary" id="ocr-clear" style="display:none">🗑 清除</button>
        </div>
        <div class="ocr-status" id="ocr-status"></div>
        <div class="ocr-result" id="ocr-result">
          <div class="ocr-result-header">
            <span class="ocr-result-title">📝 识别结果</span>
            <button class="ocr-copy-btn" id="ocr-copy">📋 复制全部</button>
          </div>
          <div class="ocr-result-body" id="ocr-result-text"></div>
        </div>
        <div class="ocr-ai" id="ocr-ai">
          <div class="ocr-ai-header">🤖 AI 解答（MIMO Pro）</div>
          <div class="ocr-ai-body" id="ocr-ai-text"></div>
        </div>
      </div>`;
    this.bindEvents();
  }
  bindEvents(){
    const $=s=>this.el.querySelector(s);
    const upload=$('#ocr-upload');
    const fileInput=$('#ocr-file');
    const cameraInput=$('#ocr-camera');
    const preview=$('#ocr-preview');
    const recognizeBtn=$('#ocr-recognize');
    const clearBtn=$('#ocr-clear');
    const status=$('#ocr-status');

    // Tab切换
    this.el.querySelectorAll('.ocr-tab').forEach(tab=>{
      tab.onclick=()=>{
        this.el.querySelectorAll('.ocr-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        if(tab.dataset.tab==='camera'){cameraInput.click()}
      };
    });

    // 点击上传区
    upload.onclick=(e)=>{
      if(e.target.closest('.ocr-copy-btn')||e.target.closest('.ocr-cam-close'))return;
      const activeTab=this.el.querySelector('.ocr-tab.active');
      if(activeTab.dataset.tab==='camera'){cameraInput.click()}
      else{fileInput.click()}
    };

    // 拖拽上传
    upload.ondragover=e=>{e.preventDefault();upload.style.borderColor='var(--c-accent)'};
    upload.ondragleave=()=>{upload.style.borderColor=''};
    upload.ondrop=e=>{
      e.preventDefault();upload.style.borderColor='';
      const file=e.dataTransfer.files[0];
      if(file&&file.type.startsWith('image/'))this.handleFile(file);
    };

    // 文件选择
    fileInput.onchange=()=>{if(fileInput.files[0])this.handleFile(fileInput.files[0])};
    cameraInput.onchange=()=>{if(cameraInput.files[0])this.handleFile(cameraInput.files[0])};

    // 识别按钮
    recognizeBtn.onclick=()=>this.recognize();

    // 清除
    clearBtn.onclick=()=>this.clear();

    // 复制
    $('#ocr-copy').onclick=()=>{
      navigator.clipboard.writeText(this.extractedText).then(()=>{
        $('#ocr-copy').textContent='✅ 已复制';
        setTimeout(()=>{$('#ocr-copy').textContent='📋 复制全部'},1500);
      });
    };
  }
  handleFile(file){
    const $=s=>this.el.querySelector(s);
    const reader=new FileReader();
    reader.onload=(e)=>{
      this.imgData=e.target.result;
      const preview=$('#ocr-preview');
      preview.src=this.imgData;
      preview.style.display='block';
      $('#ocr-upload').classList.add('has-img');
      $('#ocr-upload-content').style.display='none';
      $('#ocr-recognize').disabled=false;
      $('#ocr-clear').style.display='';
      $('#ocr-result').style.display='none';
      $('#ocr-ai').style.display='none';
      $('#ocr-status').textContent='';
    };
    reader.readAsDataURL(file);
  }
  clear(){
    const $=s=>this.el.querySelector(s);
    this.imgData=null;
    this.extractedText='';
    $('#ocr-preview').style.display='none';
    $('#ocr-preview').src='';
    $('#ocr-upload').classList.remove('has-img');
    $('#ocr-upload-content').style.display='';
    $('#ocr-recognize').disabled=true;
    $('#ocr-clear').style.display='none';
    $('#ocr-result').style.display='none';
    $('#ocr-ai').style.display='none';
    $('#ocr-status').textContent='';
    $('#ocr-file').value='';
    $('#ocr-camera').value='';
  }
  async recognize(){
    const $=s=>this.el.querySelector(s);
    const status=$('#ocr-status');
    const result=$('#ocr-result');
    const resultText=$('#ocr-result-text');
    const aiSection=$('#ocr-ai');
    const aiText=$('#ocr-ai-text');

    if(!this.imgData)return;
    status.className='ocr-status loading';
    status.textContent='🔄 正在识别文字...';
    result.style.display='none';
    aiSection.style.display='none';

    try{
      // Step 1: OCR识别 - 调用 MIMO Omni
      const ocrResp=await fetch(this.API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'mimo-v2-omni',
          messages:[{
            role:'user',
            content:[
              {type:'text',text:'请识别图片中的所有文字，原样输出，不要添加任何解释或额外内容。如果图片中有表格，请用文本格式还原表格结构。'},
              {type:'image_url',image_url:{url:this.imgData}}
            ]
          }],
          max_tokens:4096
        })
      });

      if(!ocrResp.ok){
        const errText=await ocrResp.text();
        throw new Error('OCR请求失败: '+ocrResp.status+' '+errText);
      }

      const ocrData=await ocrResp.json();
      this.extractedText=ocrData.choices?.[0]?.message?.content||'未能识别到文字';
      resultText.textContent=this.extractedText;
      result.style.display='block';
      status.textContent='✅ 识别完成，正在生成AI解答...';

      // Step 2: AI解答 - 调用 MIMO Pro
      aiSection.style.display='block';
      aiText.textContent='思考中...';

      const aiResp=await fetch(this.API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'mimo-v2-pro',
          messages:[{
            role:'user',
            content:'以下是通过OCR从图片中识别出的文字内容：\n\n---\n'+this.extractedText+'\n---\n\n请根据内容进行分析和解答：\n1. 如果是题目（数学/语文/英语等），请给出详细解答过程和答案\n2. 如果是文章，请给出摘要和要点\n3. 如果是代码，请解释代码功能\n4. 如果是其他内容，请给出有用的分析和建议'
          }],
          max_tokens:4096
        })
      });

      if(!aiResp.ok){
        aiText.textContent='⚠️ AI解答请求失败';
        status.textContent='✅ 识别完成（AI解答失败）';
        return;
      }

      const aiData=await aiResp.json();
      const aiContent=aiData.choices?.[0]?.message?.content||'无法生成解答';
      aiText.textContent=aiContent;
      status.textContent='✅ 全部完成';

    }catch(e){
      status.className='ocr-status';
      status.textContent='❌ '+e.message;
    }
  }}
new FishOcr();
