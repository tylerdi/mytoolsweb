/**
 * 塔罗占卜 🔮 — 三牌阵，AI 解读
 */
(function(){
  'use strict';
  const el=document.getElementById('fish-tarot');
  if(!el) return;

  const CARDS=[
    {id:0,name:'愚者',emoji:'🃏',upright:'新的开始、冒险、天真无邪',reversed:'鲁莽、冒失、犹豫不决'},
    {id:1,name:'魔术师',emoji:'🎩',upright:'创造力、技能、自信',reversed:'欺骗、缺乏自信、能力不足'},
    {id:2,name:'女祭司',emoji:'🌙',upright:'直觉、智慧、神秘',reversed:'隐藏的动机、表面化、忽视直觉'},
    {id:3,name:'女皇',emoji:'👑',upright:'丰收、母性、美',reversed:'依赖、空虚、缺乏安全感'},
    {id:4,name:'皇帝',emoji:'🏛️',upright:'权威、结构、掌控',reversed:'专横、僵化、控制欲'},
    {id:5,name:'教皇',emoji:'📿',upright:'传统、信仰、指导',reversed:'教条主义、叛逆、非传统'},
    {id:6,name:'恋人',emoji:'💕',upright:'爱情、和谐、选择',reversed:'不和谐、分离、价值观冲突'},
    {id:7,name:'战车',emoji:'⚔️',upright:'意志力、胜利、决心',reversed:'失控、挫败、缺乏方向'},
    {id:8,name:'力量',emoji:'🦁',upright:'勇气、耐心、内在力量',reversed:'自我怀疑、软弱、不安全'},
    {id:9,name:'隐者',emoji:'🏔️',upright:'内省、孤独、智慧',reversed:'孤立、固执、逃避'},
    {id:10,name:'命运之轮',emoji:'🎡',upright:'转变、命运、机遇',reversed:'厄运、抗拒改变、失控'},
    {id:11,name:'正义',emoji:'⚖️',upright:'公正、真理、因果',reversed:'不公、推诿、不负责任'},
    {id:12,name:'倒吊人',emoji:'🔄',upright:'牺牲、新视角、等待',reversed:'拖延、自私、无谓的牺牲'},
    {id:13,name:'死神',emoji:'💀',upright:'结束、转变、重生',reversed:'抗拒改变、停滞、恐惧'},
    {id:14,name:'节制',emoji:'🏺',upright:'平衡、耐心、适度',reversed:'失衡、过度、缺乏耐心'},
    {id:15,name:'恶魔',emoji:'😈',upright:'束缚、欲望、物质',reversed:'解脱、觉醒、释放'},
    {id:16,name:'塔',emoji:'🗼',upright:'突变、觉醒、解放',reversed:'恐惧改变、逃避灾难'},
    {id:17,name:'星星',emoji:'⭐',upright:'希望、灵感、宁静',reversed:'失望、缺乏信心'},
    {id:18,name:'月亮',emoji:'🌕',upright:'幻象、直觉、潜意识',reversed:'恐惧、焦虑、清醒'},
    {id:19,name:'太阳',emoji:'☀️',upright:'快乐、成功、活力',reversed:'暂时的困难、过度乐观'},
    {id:20,name:'审判',emoji:'📯',upright:'觉醒、更新、召唤',reversed:'自我怀疑、拒绝反省'},
    {id:21,name:'世界',emoji:'🌍',upright:'完成、整合、成就',reversed:'未完成、缺乏收尾'}
  ];

  const SPREAD=['过去','现在','未来'];
  let drawn=[],phase=0;

  el.innerHTML=`
    <style>
      .tarot-wrap{max-width:600px;margin:0 auto;text-align:center;padding:20px}
      .tarot-title{font-size:1.6rem;font-weight:900;margin-bottom:8px;background:linear-gradient(135deg,#d4a853,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
      .tarot-sub{color:var(--text-dim);font-size:.85rem;margin-bottom:24px}
      .tarot-cards{display:flex;justify-content:center;gap:16px;margin-bottom:24px;flex-wrap:wrap}
      .tarot-card{width:140px;height:200px;border-radius:16px;cursor:pointer;position:relative;transform-style:preserve-3d;transition:transform .6s}
      .tarot-card.flipped{transform:rotateY(180deg)}
      .tarot-card-face,.tarot-card-back{position:absolute;inset:0;border-radius:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;backface-visibility:hidden}
      .tarot-card-back{background:linear-gradient(135deg,#1a1a2e,#16213e);border:2px solid #d4a853;font-size:2.5rem}
      .tarot-card-face{background:linear-gradient(135deg,#1e1e2e,#2a1a3e);border:2px solid #646cff;transform:rotateY(180deg);padding:12px}
      .tarot-card-face .card-emoji{font-size:2.2rem;margin-bottom:6px}
      .tarot-card-face .card-name{font-size:.9rem;font-weight:700;color:#d4a853}
      .tarot-card-face .card-pos{font-size:.7rem;color:var(--text-dim);margin-top:4px}
      .tarot-card-face .card-dir{font-size:.7rem;margin-top:4px;padding:2px 8px;border-radius:8px}
      .tarot-card-face .card-dir.up{background:rgba(34,197,94,.15);color:#22c55e}
      .tarot-card-face .card-dir.down{background:rgba(239,68,68,.15);color:#ef4444}
      .tarot-reading{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px;text-align:left;line-height:1.8;color:var(--text-dim);font-size:.9rem;min-height:80px}
      .tarot-reading h4{color:#d4a853;font-size:1rem;margin-bottom:8px}
      .tarot-btn{margin-top:20px;padding:12px 32px;border-radius:12px;border:none;background:linear-gradient(135deg,#d4a853,#ec4899);color:#fff;font-size:.95rem;font-weight:600;cursor:pointer;transition:all .3s}
      .tarot-btn:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(212,168,83,.3)}
      .tarot-btn:disabled{opacity:.5;cursor:not-allowed;transform:none}
      @media(max-width:500px){.tarot-card{width:100px;height:145px}.tarot-card-back{font-size:1.8rem}.tarot-card-face .card-emoji{font-size:1.6rem}}
    </style>
    <div class="tarot-wrap">
      <div class="tarot-title">🔮 塔罗占卜</div>
      <div class="tarot-sub">点击翻开三张牌，揭示你的过去、现在与未来</div>
      <div class="tarot-cards" id="tarot-cards"></div>
      <div class="tarot-reading" id="tarot-reading">准备好了吗？点击上方卡牌开始占卜 ✨</div>
      <button class="tarot-btn" id="tarot-reset" style="display:none">🔮 再来一次</button>
    </div>
  `;

  function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

  function renderCards(){
    const container=document.getElementById('tarot-cards');
    container.innerHTML='';
    for(let i=0;i<3;i++){
      const card=document.createElement('div');
      card.className='tarot-card';
      card.dataset.idx=i;
      card.innerHTML=`
        <div class="tarot-card-back">🌟</div>
        <div class="tarot-card-face">
          <div class="card-emoji"></div>
          <div class="card-name"></div>
          <div class="card-pos">${SPREAD[i]}</div>
          <div class="card-dir"></div>
        </div>
      `;
      card.addEventListener('click',()=>flipCard(i));
      container.appendChild(card);
    }
  }

  function flipCard(idx){
    if(idx!==phase||drawn.length>idx) return;
    const cards=shuffle(CARDS);
    const card=cards[0];
    const isReversed=Math.random()<0.35;
    drawn.push({card,isReversed});
    const el=document.querySelectorAll('.tarot-card')[idx];
    el.querySelector('.card-emoji').textContent=card.emoji;
    el.querySelector('.card-name').textContent=card.name;
    const dir=el.querySelector('.card-dir');
    dir.textContent=isReversed?'逆位':'正位';
    dir.className='card-dir '+(isReversed?'down':'up');
    el.classList.add('flipped');
    phase++;
    if(phase===3) showReading();
  }

  function showReading(){
    const readingEl=document.getElementById('tarot-reading');
    let html='<h4>🔮 牌面解读</h4>';
    drawn.forEach((d,i)=>{
      const meaning=d.isReversed?d.card.reversed:d.card.upright;
      html+=`<p><strong>${SPREAD[i]}：${d.card.emoji} ${d.card.name}（${d.isReversed?'逆位':'正位'}）</strong><br>${meaning}</p>`;
    });
    html+='<p style="margin-top:12px;color:var(--text-muted);font-size:.8rem">✨ 命运掌握在自己手中，塔罗只是镜子，照见你内心的声音。</p>';
    readingEl.innerHTML=html;
    document.getElementById('tarot-reset').style.display='inline-block';
  }

  document.getElementById('tarot-reset').addEventListener('click',()=>{
    drawn=[];phase=0;
    document.getElementById('tarot-reading').innerHTML='准备好了吗？点击上方卡牌开始占卜 ✨';
    document.getElementById('tarot-reset').style.display='none';
    renderCards();
  });

  renderCards();
})();
