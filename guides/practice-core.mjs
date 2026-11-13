import {advance, findHint, practiceBoard as routeBoard} from '../prototypes/daily-route/game-core.mjs';
import {hintFor, isWon, moveBoats, practiceBoard as twinBoard} from '../twins/twins-core.mjs';

export function createPractice(game, level) {
  if (!['route', 'twins'].includes(game)) throw new Error('未知海图类型');
  const board = game === 'route' ? routeBoard(level) : twinBoard(level);
  let history = [game === 'route' ? [board.start] : {...board.start}];
  let assisted = false;
  const state = () => history.at(-1);
  const won = () => game === 'route' ? state().at(-1) === board.end : isWon(board, state());
  function move(direction) {
    if (won()) return {changed:false, message:'已靠岸。可以重置，比较另一种走法。'};
    if (history.length - 1 >= board.limit) return {changed:false, message:'预算已用完，请撤回或重置。'};
    if (!['up','right','down','left'].includes(direction)) return {changed:false, message:'请选择上下左右方向。'};
    let next;
    if (game === 'route') {
      const cell=state().at(-1), row=Math.floor(cell/7), col=cell%7;
      if (direction==='up'&&!row || direction==='down'&&row===6 || direction==='left'&&!col || direction==='right'&&col===6)
        return {changed:false, message:'已经到海图边界。'};
      const result=advance(board,state(),cell+({up:-7,right:1,down:7,left:-1}[direction]));
      if(result.status==='invalid') return {changed:false,message:result.message};
      if(result.status==='backtrack') history.pop();
      else history.push(result.path);
    } else {
      next=moveBoats(board,state(),direction);
      if(!next) return {changed:false,message:'这条指令无效：两船都受阻，或会发生碰撞。未扣步数。'};
      history.push(next);
    }
    return {changed:true,message:won()?'两岸相接，挑战完成。接下来可以比较文中的决策。':`已走 ${history.length-1} / ${board.limit} 步。`};
  }
  return {
    game, board, state, won,
    steps:()=>history.length-1, assisted:()=>assisted,
    move,
    undo(){if(history.length>1) history.pop();},
    reset(){history=history.slice(0,1);assisted=false;},
    example(directions){
      history=history.slice(0,1);assisted=true;
      for(const direction of directions){
        const result=move(direction);
        if(!result.changed)throw new Error(`对照走法无效：${result.message}`);
      }
    },
    follow(){
      const next=game==='route'?findHint(board,state()):hintFor(board,state());
      if(next===null || next===undefined) return {changed:false,message:'当前分支找不到预算内的提示；请撤回后再试。'};
      assisted=true;
      if(game==='twins')return move(next);
      const difference=next-state().at(-1);
      return move(({[-7]:'up',[1]:'right',[7]:'down',[-1]:'left'})[difference]);
    },
  };
}
