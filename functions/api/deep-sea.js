// Cloudflare Pages Function - 深海博物馆
// GET /api/deep-sea — 获取今日生物
// POST /api/deep-sea { action: 'feed', creature_id, message } — 投喂生物

export async function onRequestGet(context) {
  const { env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    // Generate today's creature
    const today = new Date().toISOString().slice(0, 10);
    const seed = hashCode(today);
    
    const creatures = getCreatures();
    const creature = creatures[Math.abs(seed) % creatures.length];
    
    // Evolve based on date
    const evolvedName = evolveName(creature.name, today);
    const evolvedDesc = evolveDesc(creature.desc, today);

    return new Response(JSON.stringify({
      id: today,
      name: evolvedName,
      emoji: creature.emoji,
      desc: evolvedDesc,
      habitat: creature.habitat,
      behavior: creature.behavior,
      rarity: creature.rarity,
      date: today,
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = await request.json();
    const { action, creature_id, message } = body;

    if (action === 'feed' && message) {
      // Store the feed message (in-memory for demo, could use Supabase)
      return new Response(JSON.stringify({
        success: true,
        reply: generateFeedReply(message),
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: '未知操作' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

function generateFeedReply(message) {
  const replies = [
    `「${message.slice(0, 10)}...」被吸收了！生物的触手微微发光 ✨`,
    `生物吞下了「${message.slice(0, 8)}」，外壳颜色发生了微妙变化 🌊`,
    `「${message.slice(0, 10)}」化作能量，生物快乐地摆动了触角 🐟`,
    `生物品尝了「${message.slice(0, 8)}」，发出了微弱的声波回应 🔊`,
    `「${message.slice(0, 10)}」被消化了！生物似乎长大了一点点 📏`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function evolveName(name, date) {
  const suffixes = ['· 星辉', '· 深渊', '· 极光', '· 潮汐', '· 月影', '· 珊瑚', '· 荧光', '· 暗流'];
  const idx = hashCode(date) % suffixes.length;
  return name + suffixes[Math.abs(idx)];
}

function evolveDesc(desc, date) {
  const modifiers = [
    '在今天的深海中，它的鳞片闪烁着奇异的光芒。',
    '随着洋流的变化，它的行为模式似乎有了微妙的改变。',
    '今日的深海温度让它格外活跃，触手散发着柔和的光。',
    '海底的矿脉让它获得了新的能量，外壳变得更加坚硬。',
    '月光穿透海水的折射，给它披上了一层银色的纱衣。',
  ];
  const idx = Math.abs(hashCode(date)) % modifiers.length;
  return desc + ' ' + modifiers[idx];
}

function getCreatures() {
  return [
    { name: '幽灵水母', emoji: '🪼', desc: '通体透明，能在黑暗中发出幽蓝色的生物光。它的触手长达数米，轻轻摇曳时如同海底的极光。', habitat: '深海热泉附近，水深2000-4000米', behavior: '通过发光吸引猎物，群居生活', rarity: '稀有' },
    { name: '铁甲灯笼鱼', emoji: '🐡', desc: '头部有一个发光器官，像灯笼一样照亮前方的黑暗。全身覆盖着坚硬的铁灰色鳞甲。', habitat: '中层海域，水深500-1500米', behavior: '独居，用灯光诱捕小型生物', rarity: '普通' },
    { name: '彩虹章鱼', emoji: '🐙', desc: '能根据环境变换七种颜色，是深海中最美妙的伪装大师。每条触手都有独立的"思维"。', habitat: '珊瑚礁深处，水深300-800米', behavior: '极其聪明，会使用工具', rarity: '传说' },
    { name: '星辰贝', emoji: '⭐', desc: '壳内壁布满了像星空一样的发光点，打开时如同手持一片微型宇宙。', habitat: '深海平原，水深3000-5000米', behavior: '固定在海底，靠过滤海水中的微粒生存', rarity: '稀有' },
    { name: '暗流鳗', emoji: '🐍', desc: '身体像一条流动的暗河，能在没有任何光线的环境中精准导航。', habitat: '海沟深处，水深6000-8000米', behavior: '独行侠，领地意识极强', rarity: '稀有' },
    { name: '珊瑚猫', emoji: '🐱', desc: '外表像一只长了鱼尾的猫，毛发其实是细密的珊瑚丝。发出猫叫般的声波。', habitat: '珊瑚花园，水深200-600米', behavior: '群居，好奇心极强', rarity: '普通' },
    { name: '水晶虾', emoji: '🦐', desc: '整个身体完全透明，只有内脏隐约可见。被触碰时会发出清脆的"叮"声。', habitat: '浅海礁石缝隙，水深50-200米', behavior: '群居，用声音交流', rarity: '普通' },
    { name: '深渊龙', emoji: '🐉', desc: '深海中最大的生物之一，体长可达20米。背部有一排发光器官，游动时如同移动的星河。', habitat: '深渊带，水深4000-6000米', behavior: '独居，每年浮上水面一次', rarity: '传说' },
    { name: '泡沫蟹', emoji: '🦀', desc: '壳上附着无数微小气泡，看起来像一团行走的泡沫。气泡破裂时释放迷人的香气。', habitat: '热泉口附近，水深1500-3000米', behavior: '群居，用泡沫交流', rarity: '稀有' },
    { name: '回声鲸', emoji: '🐋', desc: '能发出覆盖整个频段的声波，它的歌声可以传播数百公里。据说能记住所有听过的声音。', habitat: '远洋深水区，水深1000-3000米', behavior: '群居，用歌声导航和社交', rarity: '传说' },
    { name: '荧光海马', emoji: '🌊', desc: '全身覆盖着荧光鳞片，在黑暗中像一盏移动的彩色灯笼。尾巴能缠住海草随波起舞。', habitat: '海草床，水深100-500米', behavior: '优雅独居，对伴侣极其忠诚', rarity: '稀有' },
    { name: '磁石鱼', emoji: '🧲', desc: '体内含有天然磁性物质，能感知地球磁场。永远知道北方在哪里，是深海中的天然指南针。', habitat: '洋流交汇处，水深800-2000米', behavior: '群居迁徙，队形整齐如箭头', rarity: '普通' },
  ];
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
