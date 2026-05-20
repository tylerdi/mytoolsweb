/**
 * 小鱼儿 今日运势 🐟🔮
 * 基于日期的星座运势生成器
 * 用法：<div id="fish-horoscope"></div><script src="/fish-horoscope.js"></script>
 */
(function(){
'use strict';

const ZODIAC = [
  { name:'白羊座', icon:'♈', en:'Aries',      start:[3,21],  end:[4,19],  element:'🔥', color:'#ff6b6b' },
  { name:'金牛座', icon:'♉', en:'Taurus',      start:[4,20],  end:[5,20],  element:'🌍', color:'#82c91e' },
  { name:'双子座', icon:'♊', en:'Gemini',      start:[5,21],  end:[6,21],  element:'💨', color:'#ffd43b' },
  { name:'巨蟹座', icon:'♋', en:'Cancer',      start:[6,22],  end:[7,22],  element:'💧', color:'#4dabf7' },
  { name:'狮子座', icon:'♌', en:'Leo',         start:[7,23],  end:[8,22],  element:'🔥', color:'#ff922b' },
  { name:'处女座', icon:'♍', en:'Virgo',       start:[8,23],  end:[9,22],  element:'🌍', color:'#69db7c' },
  { name:'天秤座', icon:'♎', en:'Libra',       start:[9,23],  end:[10,23], element:'💨', color:'#da77f2' },
  { name:'天蝎座', icon:'♏', en:'Scorpio',     start:[10,24], end:[11,22], element:'💧', color:'#e64980' },
  { name:'射手座', icon:'♐', en:'Sagittarius', start:[11,23], end:[12,21], element:'🔥', color:'#f76707' },
  { name:'摩羯座', icon:'♑', en:'Capricorn',   start:[12,22], end:[1,19],  element:'🌍', color:'#868e96' },
  { name:'水瓶座', icon:'♒', en:'Aquarius',    start:[1,20],  end:[2,18],  element:'💨', color:'#339af0' },
  { name:'双鱼座', icon:'♓', en:'Pisces',      start:[2,19],  end:[3,20],  element:'💧', color:'#b197fc' },
];

const CATEGORIES = [
  { key:'love',     icon:'❤️',  label:'爱情' },
  { key:'work',     icon:'💼',  label:'事业' },
  { key:'wealth',   icon:'💰',  label:'财运' },
  { key:'health',   icon:'🍀',  label:'健康' },
  { key:'study',    icon:'📚',  label:'学业' },
];

const LUCKY_COLORS = [
  '珊瑚红','天蓝色','薄荷绿','柠檬黄','薰衣草紫','珊瑚橘','雾霾蓝',
  '奶茶色','樱花粉','星空蓝','森林绿','琥珀金','珍珠白','墨玉黑',
  '玫瑰红','翡翠绿','宝石蓝','落日橙','丁香紫','月光银','石榴红',
  '湖水绿','钴蓝色','柚木色','奶油白','酒红色','松石绿','靛蓝色',
];

const LUCKY_ITEMS = [
  '咖啡','书本','钥匙','耳机','手链','围巾','帽子','戒指',
  '雨伞','镜子','贝壳','水晶','蜡烛','花朵','猫咪','星星',
  '月亮','蝴蝶','海豚','树叶','羽毛','珍珠','铃铛','风铃',
];

const ADVICE_POOL = {
  high: [
    '今天是你的主场，大胆出击吧！',
    '运气爆棚的一天，适合做重要决定。',
    '贵人运旺，多和朋友互动会有惊喜。',
    '今天适合开启新计划，宇宙都在帮你。',
    '心情舒畅，做什么都顺，享受这美好的一天。',
    '桃花运满满，单身的朋友注意身边的人。',
    '财运亨通，可能有意外收入哦。',
    '今天特别有灵感，适合创作和表达。',
  ],
  mid: [
    '稳中求进，今天适合按部就班。',
    '保持平常心，小确幸就在身边。',
    '适合整理思绪，为明天做准备。',
    '今天适合学习新技能，会有收获。',
    '多喝水，多微笑，平淡中也有幸福。',
    '适合和老朋友联系，会有温暖的对话。',
    '今天宜静不宜动，读书品茶最惬意。',
    '小小的改变会带来意想不到的好运。',
  ],
  low: [
    '今天低调一点，韬光养晦。',
    '遇事不要急，退一步海阔天空。',
    '适合充电休息，明天会更好。',
    '避免冲动消费，捂好钱包。',
    '今天适合独处，给自己充充电。',
    '少说多做，用行动证明自己。',
    '健康第一，注意休息和饮食。',
    '困难是暂时的，保持信心就好。',
  ],
};

// 基于日期+星座的伪随机数生成器
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  return function() {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    return (h >>> 0) / 0x7fffffff;
  };
}

function getZodiacByDate(month, day) {
  for (const z of ZODIAC) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (sm <= em) {
      if ((month === sm && day >= sd) || (month === em && day <= ed) || (month > sm && month < em)) return z;
    } else {
      if ((month === sm && day >= sd) || (month === em && day <= ed) || month > sm || month < em) return z;
    }
  }
  return ZODIAC[0];
}

function getFortune(dateStr, zodiacIndex) {
  const rng = seededRandom(dateStr + ':' + zodiacIndex);
  const scores = {};
  let total = 0;
  for (const c of CATEGORIES) {
    const s = Math.floor(rng() * 40 + 60); // 60-100
    scores[c.key] = s;
    total += s;
  }
  const avg = Math.round(total / CATEGORIES.length);
  const colorIdx = Math.floor(rng() * LUCKY_COLORS.length);
  const itemIdx = Math.floor(rng() * LUCKY_ITEMS.length);
  const num = Math.floor(rng() * 9) + 1;
  const level = avg >= 85 ? 'high' : avg >= 70 ? 'mid' : 'low';
  const adviceIdx = Math.floor(rng() * ADVICE_POOL[level].length);

  return {
    scores,
    avg,
    luckyColor: LUCKY_COLORS[colorIdx],
    luckyItem: LUCKY_ITEMS[itemIdx],
    luckyNum: num,
    advice: ADVICE_POOL[level][adviceIdx],
    level,
  };
}

function renderStars(score) {
  const stars = Math.round(score / 20);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

class FishHoroscope {
  constructor() {
    this.el = document.getElementById('fish-horoscope');
    if (!this.el) return;
    this.savedSign = localStorage.getItem('fish_zodiac') || '';
    this.today = new Date();
    this.dateStr = this.today.toISOString().slice(0, 10);
    this.render();
  }

  render() {
    if (this.savedSign) {
      this.renderFortune();
    } else {
      this.renderPicker();
    }
  }

  renderPicker() {
    this.el.innerHTML = `
      <div class="fh-wrap">
        <div class="fh-header">
          <span class="fh-icon">🔮</span>
          <h2 class="fh-title">今日运势</h2>
          <p class="fh-sub">选择你的星座，查看今日运势</p>
        </div>
        <div class="fh-grid">
          ${ZODIAC.map((z, i) => `
            <button class="fh-pick" data-idx="${i}" style="--c:${z.color}">
              <span class="fh-pick-icon">${z.icon}</span>
              <span class="fh-pick-name">${z.name}</span>
              <span class="fh-pick-elem">${z.element}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    this.el.querySelectorAll('.fh-pick').forEach(btn => {
      btn.addEventListener('click', () => {
        this.savedSign = btn.dataset.idx;
        localStorage.setItem('fish_zodiac', this.savedSign);
        this.renderFortune();
      });
    });
  }

  renderFortune() {
    const idx = parseInt(this.savedSign);
    const zodiac = ZODIAC[idx];
    const fortune = getFortune(this.dateStr, idx);
    const dateDisplay = `${this.today.getMonth()+1}月${this.today.getDate()}日`;

    this.el.innerHTML = `
      <div class="fh-wrap">
        <div class="fh-header">
          <span class="fh-icon">${zodiac.icon}</span>
          <h2 class="fh-title">${zodiac.name} · 今日运势</h2>
          <p class="fh-sub">${dateDisplay} · ${zodiac.element} ${zodiac.en}</p>
        </div>

        <div class="fh-overall" style="--c:${zodiac.color}">
          <div class="fh-score-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" stroke-width="8"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="${zodiac.color}" stroke-width="8"
                stroke-dasharray="${fortune.avg * 3.27} 327" stroke-linecap="round"
                transform="rotate(-90 60 60)" class="fh-ring"/>
            </svg>
            <div class="fh-score-num">${fortune.avg}</div>
          </div>
          <div class="fh-overall-label">综合运势</div>
        </div>

        <div class="fh-categories">
          ${CATEGORIES.map(c => `
            <div class="fh-cat">
              <span class="fh-cat-icon">${c.icon}</span>
              <span class="fh-cat-label">${c.label}</span>
              <div class="fh-bar-wrap">
                <div class="fh-bar" style="width:${fortune.scores[c.key]}%;background:${zodiac.color}"></div>
              </div>
              <span class="fh-cat-score">${fortune.scores[c.key]}</span>
            </div>
          `).join('')}
        </div>

        <div class="fh-lucky">
          <div class="fh-lucky-item">
            <span class="fh-lucky-label">🎨 幸运色</span>
            <span class="fh-lucky-val">${fortune.luckyColor}</span>
          </div>
          <div class="fh-lucky-item">
            <span class="fh-lucky-label">🔢 幸运数</span>
            <span class="fh-lucky-val">${fortune.luckyNum}</span>
          </div>
          <div class="fh-lucky-item">
            <span class="fh-lucky-label">🍀 幸运物</span>
            <span class="fh-lucky-val">${fortune.luckyItem}</span>
          </div>
        </div>

        <div class="fh-advice">
          <div class="fh-advice-icon">${fortune.level === 'high' ? '🌟' : fortune.level === 'mid' ? '🌤️' : '☁️'}</div>
          <p class="fh-advice-text">${fortune.advice}</p>
        </div>

        <button class="fh-change" id="fh-change">切换星座 ↻</button>
      </div>
    `;

    document.getElementById('fh-change').addEventListener('click', () => {
      localStorage.removeItem('fish_zodiac');
      this.savedSign = '';
      this.renderPicker();
    });
  }
}

// 注入样式
const style = document.createElement('style');
style.textContent = `
.fh-wrap{max-width:600px;margin:0 auto;padding:24px 16px;font-family:'LXGW WenKai',system-ui,sans-serif}
.fh-header{text-align:center;margin-bottom:28px}
.fh-icon{font-size:3rem;display:block;margin-bottom:8px;filter:drop-shadow(0 4px 12px rgba(255,255,255,.15))}
.fh-title{font-size:1.4rem;font-weight:700;color:var(--text,#e8e8e8);margin:0}
.fh-sub{font-size:.85rem;color:var(--text-secondary,#888);margin-top:4px}
.fh-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
@media(max-width:480px){.fh-grid{grid-template-columns:repeat(3,1fr)}}
.fh-pick{background:var(--surface,#1a1a2e);border:2px solid var(--border,#2a2a3e);border-radius:14px;padding:16px 8px;cursor:pointer;transition:all .3s;display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--text,#e8e8e8)}
.fh-pick:hover,.fh-pick:active{border-color:var(--c);transform:translateY(-4px);box-shadow:0 8px 24px rgba(0,0,0,.3)}
.fh-pick-icon{font-size:1.8rem}
.fh-pick-name{font-size:.8rem;font-weight:600}
.fh-pick-elem{font-size:.7rem;opacity:.5}
.fh-overall{display:flex;flex-direction:column;align-items:center;margin-bottom:24px}
.fh-score-ring{position:relative;width:120px;height:120px}
.fh-score-ring svg{width:100%;height:100%}
.fh-ring{transition:stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)}
.fh-score-num{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:var(--c)}
.fh-overall-label{font-size:.9rem;color:var(--text-secondary,#888);margin-top:8px}
.fh-categories{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
.fh-cat{display:flex;align-items:center;gap:10px}
.fh-cat-icon{font-size:1.1rem;width:24px;text-align:center}
.fh-cat-label{font-size:.85rem;width:40px;color:var(--text-secondary,#888)}
.fh-bar-wrap{flex:1;height:8px;background:var(--border,#2a2a3e);border-radius:4px;overflow:hidden}
.fh-bar{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.4,0,.2,1)}
.fh-cat-score{font-size:.85rem;font-weight:700;width:30px;text-align:right;color:var(--text,#e8e8e8)}
.fh-lucky{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.fh-lucky-item{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:12px;padding:14px 10px;text-align:center}
.fh-lucky-label{display:block;font-size:.75rem;color:var(--text-secondary,#888);margin-bottom:6px}
.fh-lucky-val{font-size:1rem;font-weight:700;color:var(--text,#e8e8e8)}
.fh-advice{background:var(--surface,#1a1a2e);border:1px solid var(--border,#2a2a3e);border-radius:14px;padding:20px;text-align:center;margin-bottom:20px}
.fh-advice-icon{font-size:1.6rem;margin-bottom:8px}
.fh-advice-text{font-size:.95rem;line-height:1.8;color:var(--text,#e8e8e8)}
.fh-change{display:block;margin:0 auto;background:none;border:1px solid var(--border,#2a2a3e);color:var(--text-secondary,#888);padding:8px 20px;border-radius:20px;cursor:pointer;font-size:.85rem;transition:all .3s;font-family:inherit}
.fh-change:hover{border-color:var(--accent,#646cff);color:var(--text,#e8e8e8)}
`;
document.head.appendChild(style);

new FishHoroscope();
})();
