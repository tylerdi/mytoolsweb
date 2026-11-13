const form=document.querySelector('[data-feedback-draft]');
const output=form.querySelector('[data-draft-output]'),status=form.querySelector('[data-draft-status]');
form.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(form);
  output.value=`游戏：${data.get('game')}\n关卡 / 日期：${data.get('level')||'未填写'}\n\n复现步骤：\n${String(data.get('steps')).trim()}\n\n预期与实际：\n${String(data.get('result')).trim()}\n\n设备与浏览器（请自行补充）：`;
  form.querySelector('[data-draft-output-label]').hidden=false;
  form.querySelector('[data-copy-draft]').hidden=false;
  status.textContent='草稿已生成，尚未发送。请补充设备与浏览器，再复制到下方反馈渠道。';
  output.focus();
});
form.querySelector('[data-copy-draft]').addEventListener('click',async()=>{
  output.focus();output.select();
  try{await navigator.clipboard.writeText(output.value);status.textContent='已复制，尚未发送。请到 GitHub 或产品社区粘贴并提交。';}
  catch{status.textContent='请按 Ctrl/Cmd+C 或长按复制选中的草稿，尚未发送。';}
});
