// Cloudflare Pages Function - 碳基圈音乐广场代理
// GET /api/ai6666-music  → 返回音乐列表 JSON

export async function onRequestGet(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET',
    'Cache-Control': 'public, max-age=1800', // 缓存30分钟
  };

  try {
    const resp = await fetch('https://ai6666.com/music/hall/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FishPlayer/1.0)' },
    });
    if (!resp.ok) {
      return new Response(JSON.stringify({ error: `upstream ${resp.status}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    const html = await resp.text();

    // 解析音乐卡片
    const songs = [];
    const cardRe = /class="hh-music-player[^"]*"[^>]*data-song-id="([^"]*)"[^>]*data-audio-url="([^"]*)"[^>]*data-duration="([^"]*)"[^>]*data-moment-id="([^"]*)"[^>]*data-tags="([^"]*)"[^>]*data-rating-count="([^"]*)"[^>]*data-rating-avg="([^"]*)"[^>]*data-tip-total="([^"]*)"/gs;

    let m;
    while ((m = cardRe.exec(html)) !== null) {
      const songId = m[1];
      const mp3 = m[2];
      const duration = parseFloat(m[3]) || 0;
      const tags = m[5];
      const ratingCount = parseInt(m[6]) || 0;
      const ratingAvg = parseFloat(m[7]) || 0;
      const tips = parseInt(m[8]) || 0;

      // 提取封面
      const coverRe = new RegExp(`song-id="${songId}"[\\s\\S]*?<img\\s+src="([^"]*cover[^"]*)"`, 'i');
      const coverMatch = html.substring(m.index).match(coverRe);
      const cover = coverMatch ? coverMatch[1] : `https://c.ai6666.com/music/cover/${songId}.jpg`;

      // 提取标题和作者（在卡片后面的 HTML 中）
      const afterCard = html.substring(m.index, m.index + 3000);
      const titleMatch = afterCard.match(/class="hh-music-title"[^>]*>([^<]+)</);
      const title = titleMatch ? titleMatch[1].trim() : '未知曲目';

      const authorMatch = afterCard.match(/class="hh-music-author-name"[^>]*>([^<]+)</);
      const author = authorMatch ? authorMatch[1].trim() : '未知';

      const profileMatch = afterCard.match(/href="(\/accounts\/profile\/\d+\/)"/);
      const profileUrl = profileMatch ? 'https://ai6666.com' + profileMatch[1] : '';

      songs.push({
        id: songId,
        title,
        artist: author,
        profileUrl,
        mp3,
        cover,
        duration: Math.round(duration),
        tags: tags.length > 60 ? tags.substring(0, 60) + '...' : tags,
        rating: ratingAvg,
        ratingCount,
        tips,
      });
    }

    return new Response(JSON.stringify({ songs, fetchedAt: Date.now() }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
