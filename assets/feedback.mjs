const form=document.querySelector('[data-feedback-draft]');
const status=form.querySelector('[data-draft-status]'),submit=form.querySelector('[data-send]');
const output=form.querySelector('[data-draft-output]');
let id=crypto.randomUUID(),lastPayload='',sending=false;
const query=new URL(location.href).searchParams;
if(['每日航线','潮汐双船','精选文章试走'].includes(query.get('game')))form.elements.game.value=query.get('game');
form.elements.level.value=(query.get('level')||'').slice(0,80);
function payload(){const data=Object.fromEntries(new FormData(form));return {game:data.game,level:data.level,category:data.category,steps:data.steps,result:data.result,device:data.device,website:data.website||''};}
form.addEventListener('submit',async event=>{
 event.preventDefault();if(sending)return;
 const data=payload(),signature=JSON.stringify(data);if(lastPayload&&lastPayload!==signature)id=crypto.randomUUID();lastPayload=signature;
 sending=true;submit.disabled=true;status.textContent='正在提交，请稍候……';
 // Lock fields so the receipt always refers to the text the player sees.
 const fields=[...form.querySelectorAll('input,textarea,select')];fields.forEach(field=>field.disabled=true);
 try{
  const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,id}),signal:AbortSignal.timeout(15000)});
  const result=await response.json().catch(()=>{throw new Error("服务暂时无法响应，请稍后重试。");});
  if(!response.ok||result.ok!==true||result.id!==id)throw new Error(result.error||'服务尚未确认收到，请重试。');
  status.textContent=`已收到反馈，编号 ${id}。内容不公开展示。请保留编号；本站不收集联系方式，无法单独回复。`;
  form.reset();id=crypto.randomUUID();lastPayload='';output.value='';form.querySelector('[data-draft-output-label]').hidden=true;
 }catch(error){status.textContent=`未确认提交成功：${error.name==='TimeoutError'?'请求超时，请重试。':error instanceof TypeError?'网络连接失败，请稍后重试。':error.message} 内容已保留，也可以复制草稿。`;}
 finally{sending=false;submit.disabled=false;fields.forEach(field=>field.disabled=false);}
});
form.querySelector('[data-copy-draft]').addEventListener('click',async()=>{
 const data=payload();output.value=`游戏：${data.game}\n关卡：${data.level}\n类型：${data.category}\n设备：${data.device}\n步骤：${data.steps}\n实际情况：${data.result}`;
 form.querySelector('[data-draft-output-label]').hidden=false;output.focus();output.select();
 try{await navigator.clipboard.writeText(output.value);status.textContent='已复制草稿。复制本身不会提交反馈。';}catch{status.textContent='请按 Ctrl/Cmd+C 或长按复制草稿。复制本身不会提交。';}
});
