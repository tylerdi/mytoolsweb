import {createPractice} from './practice-core.mjs';
import {createInsights} from '../assets/insights/client.mjs';
import {scenarios} from './scenarios.mjs';
import {signalState} from '../prototypes/daily-route/game-core.mjs';

const track=createInsights('route');track('visit');
const names={up:'上',right:'右',down:'下',left:'左'}, arrows={up:'↑',right:'→',down:'↓',left:'←'};
for(const host of document.querySelectorAll('[data-practice-lab]')){
  const practice=createPractice(host.dataset.game,Number(host.dataset.level));
  const {board,game}=practice,size=game==='route'?7:5;
  const grid=host.querySelector('[data-lab-board]'),note=host.querySelector('[data-lab-note]');
  const status=host.querySelector('[data-lab-status]');
  grid.style.setProperty('--size',size);
  grid.setAttribute('aria-label',`${game==='route'?'航线':'双船'}第 ${host.dataset.level} 关，使用下方方向按钮或在海图内按方向键`);
  function image(path){const img=document.createElement('img');img.src=path;img.alt='';img.draggable=false;return img;}
  function render(){
    const state=practice.state();grid.replaceChildren();
    for(let cell=0;cell<size*size;cell++){
      const tile=document.createElement('div');tile.className='lab-cell';tile.setAttribute('role','gridcell');
      const labels=[`第 ${Math.floor(cell/size)+1} 行第 ${cell%size+1} 列`];
      if(game==='route'){
        const path=state.indexOf(cell);
        if(board.obstacles.includes(cell)){tile.classList.add('rock');tile.append(image('/prototypes/daily-route/assets/reef.svg'));labels.push('礁石');}
        if(cell===board.end){tile.classList.add('goal');tile.append(image('/prototypes/daily-route/assets/lighthouse.svg'));labels.push('灯塔');}
        if(board.beacons.includes(cell)){tile.classList.add('beacon');tile.append(image('/prototypes/daily-route/assets/beacon.svg'));labels.push('航标');}
        if(board.currents[cell]){const flow=document.createElement('span');flow.textContent=arrows[board.currents[cell]];tile.append(flow);labels.push(`洋流向${names[board.currents[cell]]}`);}
        if(path>=0){tile.classList.add('path');labels.push(`航线第 ${path} 步`);}
        if(cell===state.at(-1)){tile.classList.add('head');tile.replaceChildren(image('/prototypes/daily-route/assets/boat.svg'));labels.push('船');}
        else if(cell===board.start)tile.append(image('/prototypes/daily-route/assets/dock.svg'));
        const signal=signalState(board,cell,state);
        if(signal){tile.classList.add('signal-tile',signal.type,signal.open?'signal-open':'signal-closed');const sign=document.createElement('span');sign.className='signal-symbol';sign.textContent=`${signal.type==='gate'?'闸':'桥'} ${signal.beacon+1}`;tile.append(sign);labels.push(`${signal.beacon+1} 号${signal.type==='gate'?'航闸':'潮桥'}，${signal.open?'开启':'关闭'}`);}
        if(Object.keys(board.signals||{}).length&&board.beacons.includes(cell)){const badge=document.createElement('span');badge.className='beacon-number';badge.textContent=String(board.beacons.indexOf(cell)+1);tile.append(badge);labels.push(`${board.beacons.indexOf(cell)+1} 号航标`);}
      }else{
        if(board.rocks.includes(cell)){tile.classList.add('rock');tile.append(image('/twins/assets/reef.svg'));labels.push('礁石');}
        for(const [id,color] of [['a','coral'],['b','gold']]){
          if(cell===board.goals[id]){tile.classList.add(`port-${color}`);labels.push(`${id==='a'?'珊瑚':'金色'}港`);}
          if(cell===state[id]){tile.append(image(`/twins/assets/boat-${color}.svg`));labels.push(`${id==='a'?'珊瑚':'金色'}船`);}
        }
      }
      tile.setAttribute('aria-label',labels.join('，'));grid.append(tile);
    }
    status.textContent=`${practice.steps()} / ${board.limit} 步 · ${game==='route'?`${board.beacons.filter(cell=>state.includes(cell)).length} / 3 航标`:`${Number(state.a===board.goals.a)+Number(state.b===board.goals.b)} / 2 靠岸`}${practice.assisted()?' · 已使用参考':''}`;
    host.querySelector('[data-lab-undo]').disabled=practice.steps()===0;
  }
  function act(direction){
    const result=practice.move(direction);note.textContent=result.message;
    if(result.changed){track('start',`${game}_practice`);track('interact',`${game}_move`);if(practice.won()&&!practice.assisted())track('complete',`${game}_practice`);}
    render();
  }
  for(const button of host.querySelectorAll('[data-lab-direction]'))button.addEventListener('click',()=>act(button.dataset.labDirection));
  grid.addEventListener('keydown',event=>{const direction={ArrowUp:'up',ArrowRight:'right',ArrowDown:'down',ArrowLeft:'left'}[event.key];if(direction){event.preventDefault();act(direction);}});
  host.querySelector('[data-lab-undo]').addEventListener('click',()=>{practice.undo();note.textContent='已撤回一步，可以比较另一个选择。';render();});
  host.querySelector('[data-lab-reset]').addEventListener('click',()=>{practice.reset();note.textContent='海图已重置。先观察目标，再决定第一步。';render();});
  host.querySelector('[data-lab-follow]').addEventListener('click',()=>{const result=practice.follow();note.textContent=result.message;render();});
  const scenario=scenarios[`${game}-${host.dataset.level}`];
  const example=host.querySelector('[data-lab-example]');
  if(scenario)example.addEventListener('click',()=>{practice.example(scenario.directions);note.textContent=scenario.explanation;render();});
  else example.hidden=true;
  host.querySelector('[data-lab-controls]').hidden=false;
  host.querySelector('[data-lab-fallback]').hidden=true;
  grid.hidden=false;render();
}
