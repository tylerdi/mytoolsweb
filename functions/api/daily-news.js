// functions/api/daily-news.js
// AI 每日新闻简报 API - 从多个来源获取热点

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const today = new Date().toISOString().split('T')[0];
    
    // 从多个来源获取新闻
    const news = await fetchNewsFromSources();
    
    return new Response(JSON.stringify({
      date: today,
      news: news,
      count: news.length
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=1800' // 缓存30分钟
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

// 从多个来源获取新闻
async function fetchNewsFromSources() {
  const allNews = [];
  
  // 尝试从 Hacker News 获取科技新闻
  try {
    const hackerNews = await fetchHackerNews();
    allNews.push(...hackerNews);
  } catch (e) {
    console.log('Hacker News fetch failed:', e.message);
  }
  
  // 尝试从 Reddit 获取热门
  try {
    const redditNews = await fetchRedditHot();
    allNews.push(...redditNews);
  } catch (e) {
    console.log('Reddit fetch failed:', e.message);
  }
  
  // 按重要性排序，返回前20条
  return allNews
    .sort((a, b) => (b.importance || 3) - (a.importance || 3))
    .slice(0, 20);
}

// 从 Hacker News 获取热门
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
    } catch (e) {
      // 忽略单个item的错误
    }
  }
  
  return news;
}

// 从 Reddit 获取热门
async function fetchRedditHot() {
  const response = await fetch('https://www.reddit.com/r/technology/hot.json?limit=10', {
    headers: { 'User-Agent': 'MyToolsWeb/1.0' }
  });
  const data = await response.json();
  
  const news = [];
  const posts = data?.data?.children || [];
  
  for (const post of posts) {
    const p = post.data;
    if (p && p.title) {
      news.push({
        title: p.title,
        summary: p.selftext ? p.selftext.substring(0, 200) : '',
        source: 'Reddit',
        url: p.url || `https://reddit.com${p.permalink}`,
        importance: Math.min(5, Math.floor((p.score || 0) / 1000) + 1),
        hot: p.score ? `${Math.floor(p.score / 1000)}k` : '',
        category: '科技'
      });
    }
  }
  
  return news;
}
