// Offline generation only: bounded walks + exact solver screening. No network/AI text.
import {writeFileSync} from 'node:fs';
import {DAILY_CHARTS as previous} from '../prototypes/daily-route/daily-charts.mjs';
import {analyzeRouteBoard,neighbors} from '../prototypes/daily-route/game-core.mjs';
let seed=0x20261119;const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
const shuffle=a=>[...a].sort(()=>rand()-.5),distance=(a,b)=>Math.abs(a%7-b%7)+Math.abs((a/7|0)-(b/7|0));
const direction=(a,b)=>({1:'right','-1':'left',7:'down','-7':'up'})[b-a];
const boundary=Array.from({length:49},(_,i)=>i).filter(i=>i%7===0||i%7===6||i<7||i>=42);
const output=[],seen=new Set();
const schedule=['简单','简单','标准','标准','困难','困难','标准'];
for(let index=0;index<84;index++){
 const grade=schedule[index%7],family=grade==='简单'?(index%2?'洋流出口':'回程规划'):grade==='标准'?(index%2?'航标开闸':'回程规划'):(index%2?'潮桥时机':'双闸联锁');
 const prior=previous[index];
 if(prior&&Object.keys(prior.signals).every(cell=>{const result=analyzeRouteBoard({...prior,signals:Object.fromEntries(Object.entries(prior.signals).filter(([key])=>key!==cell))});return !result.truncated&&result.solutionCount>prior.analysis.solutionCount;})){
  output.push(prior);seen.add(JSON.stringify([prior.start,prior.end,[...prior.beacons].sort((a,b)=>a-b),[...prior.obstacles].sort((a,b)=>a-b)]));console.log(index+1,'retained');continue;
 }
 let accepted;
 for(let attempt=0;attempt<20000&&!accepted;attempt++){
  const start=boundary[Math.floor(rand()*boundary.length)],end=shuffle(boundary).find(i=>distance(start,i)>=6);
  let length=(grade==='简单'?10:grade==='标准'?16:22)+2*Math.floor(rand()*3);if((length-distance(start,end))%2)length++;
  let budget=5000;const path=[start];
  function walk(){if(--budget<0)return false;const at=path.at(-1),left=length-path.length+1;if(distance(at,end)>left)return false;if(!left)return at===end;
   for(const next of shuffle(neighbors(at))){if(path.includes(next)||(next===end&&left!==1))continue;path.push(next);if(walk())return true;path.pop();}return false;}
  if(!walk())continue;
  const beacons=[.25,.5,.75].map(f=>path[Math.round(f*length)]);
  const currents={};for(const at of shuffle(path.slice(1,-1)).slice(0,grade==='简单'?2:4))currents[at]=direction(at,path[path.indexOf(at)+1]);
  const obstacles=shuffle(Array.from({length:49},(_,i)=>i).filter(i=>!path.includes(i))).slice(0,grade==='困难'?6:10);
  const board={size:7,start,end,beacons,obstacles,currents,limit:length+(grade==='简单'?4:grade==='标准'?2:0),reference:path,signals:{}};
  if(family==='航标开闸'||family==='双闸联锁')for(const b of family==='双闸联锁'?[0,1]:[0]){const cell=path[Math.round((b===0?.43:.9)*length)];if(!beacons.includes(cell)&&cell!==end)board.signals[cell]={type:'gate',beacon:b};}
  if(family==='潮桥时机'){const cell=path[Math.round(.6*length)];if(!beacons.includes(cell))board.signals[cell]={type:'bridge',beacon:2};}
  const result=analyzeRouteBoard(board,{maxNodes:80000});
  if(result.truncated||!result.solutionCount||result.shortest!==length)continue;
  const n=result.solutionCount,m=result.misleadingBranches;
  if(grade==='简单'&&(n<15||n>200))continue;
  if(grade==='标准'&&(n<3||n>35||m<5))continue;
  if(grade==='困难'&&(n<2||n>12||m<10))continue;
  if(Object.keys(board.signals).length){const without=analyzeRouteBoard({...board,signals:{}},{maxNodes:80000});if(without.truncated||without.solutionCount<=n)continue;}
  if((family==='双闸联锁'&&Object.keys(board.signals).length!==2)||(family==='潮桥时机'&&!Object.keys(board.signals).length))continue;
  if(Object.keys(board.signals).some(cell=>{const removed=analyzeRouteBoard({...board,signals:Object.fromEntries(Object.entries(board.signals).filter(([key])=>key!==cell))},{maxNodes:80000});return removed.truncated||removed.solutionCount<=n;}))continue;
  const fingerprint=JSON.stringify([start,end,[...beacons].sort((a,b)=>a-b),[...obstacles].sort((a,b)=>a-b)]);if(seen.has(fingerprint))continue;seen.add(fingerprint);
  const focus={洋流出口:'先看箭头出口，再决定从哪边接近航标。',回程规划:'先给最后一个航标到灯塔留出未走过的通道。',航标开闸:'先准备开门条件，再连接远处目标和回程。',潮桥时机:'先通过潮桥，再收集会让它关闭的航标。',双闸联锁:'安排两个取标条件，再串起两座航闸。'}[family];
  accepted={...board,reference:result.reference,difficulty:grade,family,focus,analysis:{shortest:length,solutionCount:n,misleadingBranches:m}};
 }
 if(!accepted)throw Error(`Unable to screen chart ${index} ${grade} ${family}`);
 output.push(accepted);console.log(index+1,grade,family,accepted.analysis.solutionCount);
}
writeFileSync(new URL('../prototypes/daily-route/daily-charts.mjs',import.meta.url),'// 84 solver-screened charts. Regenerate with node scripts/build-daily-charts.mjs.\nexport const DAILY_CHARTS = '+JSON.stringify(output)+';\n');
