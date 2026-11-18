const key='daily-route:understanding:v1';
const ids=['route-currents','route-beacons','signals','twins-boundary','twins-one-solution'];
let completed={};try{completed=JSON.parse(localStorage.getItem(key))||{};if(typeof completed!=='object'||Array.isArray(completed))completed={};}catch{}
const progress=document.querySelector('[data-learning-progress]');
if(progress)progress.textContent=`已完成 ${ids.filter(id=>completed[id]===true).length} / 5 项理解检查 · 仅在此浏览器保存，不等于游戏通关。`;
for(const lesson of document.querySelectorAll('[data-lesson]')){
 const form=lesson.querySelector('form'),result=lesson.querySelector('[data-lesson-result]');
 form.addEventListener('submit',event=>{
  event.preventDefault();const correct=new FormData(form).get('choice')===lesson.dataset.correct;
  result.textContent=correct?'判断正确。回到试走面板，重置后用这个方法独立完成。':'再观察一次：把文中的对照局面与规则联系起来，然后重新选择。';
  result.dataset.correct=String(correct);lesson.querySelector('[data-explanation]').hidden=!correct;
  if(correct){completed[lesson.dataset.lesson]=true;try{localStorage.setItem(key,JSON.stringify(completed));}catch{}}
 });
}
