// functions/api/daily-news.js
// AI 每日新闻简报 API - 从多个中英文来源获取热点

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const today = new Date().toISOString().split('T')[0];
    const news = await fetchNewsFromSources();
    
    return new Response(JSON.stringify({
      date: today,
      news: news,
      count: news.length
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      date: new Date().toISOString().split('T')[0],
      news: []
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchNewsFromSources() {
  const allNews = [];
  
  // 并行获取所有来源
  const results = await Promise.allSettled([
    fetchWeiboHot(),
    fetchZhihuHot(),
    fetchBaiduHot(),
    fetchHackerNews(),
    fetchFinanceNews(),
  ]);
  
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      allNews.push(...r.value);
    }
  }
  
  // 按重要性排序，返回前30条
  return allNews
    .sort((a, b) => (b.importance || 3) - (a.importance || 3))
    .slice(0, 30);
}

// ========== 微博热搜 ==========
async function fetchWeiboHot() {
  try {
    const res = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Referer': 'https://weibo.com/',
      }
    });
    const data = await res.json();
    const list = data?.data?.realtime || [];
    
    return list.slice(0, 10).map((item, i) => ({
      title: item.note || item.word,
      summary: item.label_name ? `标签：${item.label_name}` : '',
      source: '微博',
      url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.note || item.word)}`,
      importance: Math.max(1, 5 - Math.floor(i / 2)),
      hot: item.num ? `${Math.floor(item.num / 10000)}万` : '',
      category: '微博'
    }));
  } catch (e) {
    // 微博反爬，尝试备用方案
    return fetchWeiboBackup();
  }
}

async function fetchWeiboBackup() {
  try {
    const res = await fetch('https://tenapi.cn/v2/weibohot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    const data = await res.json();
    if (data.code === 200 && data.data) {
      return data.data.slice(0, 10).map((item, i) => ({
        title: item.name || item.title,
        summary: item.desc || '',
        source: '微博',
        url: item.url || `https://s.weibo.com/weibo?q=${encodeURIComponent(item.name || item.title)}`,
        importance: Math.max(1, 5 - Math.floor(i / 2)),
        hot: item.hot || '',
        category: '微博'
      }));
    }
  } catch (e) {}
  return [];
}

// ========== 知乎热榜 ==========
async function fetchZhihuHot() {
  try {
    const res = await fetch('https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=10', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      }
    });
    const data = await res.json();
    const list = data?.data || [];
    
    return list.slice(0, 10).map((item, i) => {
      const target = item.target || {};
      return {
        title: target.title || item.title || '',
        summary: target.excerpt || '',
        source: '知乎',
        url: target.url ? `https://www.zhihu.com/question/${target.id}` : (target.link || ''),
        importance: Math.max(1, 5 - Math.floor(i / 2)),
        hot: item.detail_text || '',
        category: '知乎'
      };
    });
  } catch (e) {
    return fetchZhihuBackup();
  }
}

async function fetchZhihuBackup() {
  try {
    const res = await fetch('https://tenapi.cn/v2/zhihuhot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    const data = await res.json();
    if (data.code === 200 && data.data) {
      return data.data.slice(0, 10).map((item, i) => ({
        title: item.name || item.title,
        summary: item.desc || '',
        source: '知乎',
        url: item.url || '',
        importance: Math.max(1, 5 - Math.floor(i / 2)),
        hot: item.hot || '',
        category: '知乎'
      }));
    }
  } catch (e) {}
  return [];
}

// ========== 百度热搜 ==========
async function fetchBaiduHot() {
  try {
    const res = await fetch('https://top.baidu.com/board?tab=realtime', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    const html = await res.text();
    
    // 从 HTML 中提取热搜数据
    const news = [];
    const regex = /"word"\s*:\s*"([^"]+)"/g;
    let match;
    let i = 0;
    while ((match = regex.exec(html)) !== null && i < 10) {
      const word = match[1];
      if (word && word.length > 1) {
        news.push({
          title: word,
          summary: '',
          source: '百度',
          url: `https://www.baidu.com/s?wd=${encodeURIComponent(word)}`,
          importance: Math.max(1, 5 - Math.floor(i / 2)),
          hot: '',
          category: '百度'
        });
        i++;
      }
    }
    return news;
  } catch (e) {
    return fetchBaiduBackup();
  }
}

async function fetchBaiduBackup() {
  try {
    const res = await fetch('https://tenapi.cn/v2/baiduhot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
    const data = await res.json();
    if (data.code === 200 && data.data) {
      return data.data.slice(0, 10).map((item, i) => ({
        title: item.name || item.title,
        summary: item.desc || '',
        source: '百度',
        url: item.url || `https://www.baidu.com/s?wd=${encodeURIComponent(item.name || item.title)}`,
        importance: Math.max(1, 5 - Math.floor(i / 2)),
        hot: item.hot || '',
        category: '百度'
      }));
    }
  } catch (e) {}
  return [];
}

// ========== Hacker News ==========
async function fetchHackerNews() {
  const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = await response.json();
  const news = [];
  const limit = Math.min(ids.length, 10);
  
  for (let i = 0; i < limit; i++) {
    try {
      const itemResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${ids[i]}.json`);
      const item = await itemResponse.json();
      
      if (item && item.title) {
        news.push({
          title: item.title,
          summary: item.text ? item.text.substring(0, 200) : '',
          source: 'Hacker News',
          url: item.url || `https://news.ycombinator.com/item?id=${item.id}`,
          importance: Math.min(5, Math.floor((item.score || 0) / 100) + 1),
          hot: item.score ? `${item.score}分` : '',
          category: '科技'
        });
      }
    } catch (e) {}
  }
  return news;
}

// ========== 财经新闻 ==========
async function fetchFinanceNews() {
  try {
    // 东方财富快讯
    const res = await fetch('https://np-listapi.eastmoney.com/comm/web/getNewsByColumns?client=web&biz=web_home_channel&column=350&order=1&needInteractData=0&page_index=1&page_size=10', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Referer': 'https://www.eastmoney.com/',
      }
    });
    const data = await res.json();
    const list = data?.data?.list || [];
    
    return list.slice(0, 10).map((item, i) => ({
      title: item.title || '',
      summary: item.digest || '',
      source: '东方财富',
      url: item.url || item.art_url || '',
      importance: Math.max(1, 5 - Math.floor(i / 2)),
      hot: '',
      category: '财经'
    }));
  } catch (e) {
    // 备用：用 Hacker News 中的金融相关
    return [];
  }
}
