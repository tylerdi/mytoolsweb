export const scenarios = {
  'route-2': {
    label:'复现：右、下为什么走不通？',
    directions:['right','down'],
    explanation:'船进入第 5 行第 2 列。左、右、下都是礁石，上方是已走过的格子，只能撤回。合法的一步也可能走进死胡同。',
  },
  'route-8': {
    label:'复现：第 14 步提前向下',
    directions:['up','up','up','right','right','right','right','down','right','right','down','left','down','down'],
    explanation:'已走 14 步，还剩 6 步。拿左侧最后一个航标再回灯塔，直线距离恰好要 6 步，但会重走第 5 行第 5、6 列；绕开至少多走两步。请撤回这次向下，再向左。',
  },
  'twins-9': {
    label:'试验：到港后再向上',
    directions:['up','left','left','left','left','down','up'],
    explanation:'珊瑚船又离开了自己的港口：港口不会锁船。这一走回到了第 5 步的位置，多耗两步；仍可在 11 步预算内完成，但不再是九步最短解。',
  },
  'twins-15': {
    label:'观察：第 5 步的“错误颜色”港口',
    directions:['left','up','left','left','down'],
    explanation:'珊瑚船站在金色港，金色船还在第 2 行第 2 列，所以并未通关。接下来向下两次，可以利用底边只移动金色船。',
  },
};
