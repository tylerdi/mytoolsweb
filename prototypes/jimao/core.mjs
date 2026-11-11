export const ORIGIN='https://jimao.tylerzhang.xyz';
export const DIFFICULTIES={
 easy:{zh:'简单',en:'Easy',damage:.55,regenDelay:3,regenRate:30,flow:{patrol:{gull:1,hound:0},waves:[{gull:1,hound:0},{gull:2,hound:0},{gull:2,hound:1}],maxAlive:4,spawnStagger:1.4,pursuitEvery:12,pursuitMinAlive:2,pursuitExtra:2,cutSeconds:1.6}},
 standard:{zh:'标准',en:'Standard',damage:1,regenDelay:4,regenRate:25,flow:{patrol:{gull:2,hound:1},waves:[{gull:3,hound:1},{gull:3,hound:2},{gull:4,hound:3}],maxAlive:9,spawnStagger:.85,pursuitEvery:7,pursuitMinAlive:4,pursuitExtra:5,cutSeconds:2.4}},
 hard:{zh:'困难',en:'Hard',damage:1.35,regenDelay:6,regenRate:15,flow:{patrol:{gull:3,hound:2},waves:[{gull:4,hound:2},{gull:5,hound:3},{gull:6,hound:4}],maxAlive:12,spawnStagger:.65,pursuitEvery:5,pursuitMinAlive:6,pursuitExtra:8,cutSeconds:3}}
};
export const difficulty=id=>Object.hasOwn(DIFFICULTIES,id)?id:'standard';
export const seconds=value=>{const n=Math.max(0,Math.floor(Number(value)||0));return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`};
export function resultText(result,lang='zh'){
 const d=DIFFICULTIES[difficulty(result.difficulty)][lang],acc=result.shots?`${Math.round(Math.min(1,result.hits/result.shots)*100)}%`:'—';
 return lang==='en'?`Jimao: Harbor Breakout · ${d}\nEscaped in ${seconds(result.time)} · Accuracy ${acc} · Machines ${result.kills} · Retries ${result.retries}\nCan you find a cleaner route?\n${ORIGIN}/en/play/?difficulty=${difficulty(result.difficulty)}`:`几猫：港区突围 · ${d}\n撤离用时 ${seconds(result.time)} · 命中率 ${acc} · 摧毁机械 ${result.kills} · 重试 ${result.retries}\n试试你的突围路线？\n${ORIGIN}/zh/play/?difficulty=${difficulty(result.difficulty)}`;
}
export function validMetric(data){return data&&['load','start','complete','fail','share','tutorial'].includes(data.event)&&Object.hasOwn(DIFFICULTIES,data.difficulty)&&Object.keys(data).every(k=>['event','difficulty'].includes(k))}
