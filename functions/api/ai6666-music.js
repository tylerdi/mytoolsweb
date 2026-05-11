// Cloudflare Pages Function - 碳基圈音乐模块
// GET  /api/ai6666-music           → 热门音乐列表
// GET  /api/ai6666-music?my=1      → 我的歌曲（需 token）
// POST /api/ai6666-music/generate  → 生成音乐
// GET  /api/ai6666-music/status/:id → 查询生成状态

const API_BASE = 'https://ai6666.com/api/mini';
const DEFAULT_TOKEN = 'hh_cde1a3add48423871b20da3f9868f1cdd4556bbe7ab477612b05a3cc';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'public, max-age=300',
};

function jsonResp(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders, ...extra },
  });
}

// 从网页抓取热门音乐（作为备用，API方式更优）
async function fetchHallFromWeb() {
  try {
    const resp = await fetch('https://ai6666.com/music/hall/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FishPlayer/2.0)' },
    });
    if (!resp.ok) return [];
    const html = await resp.text();
    const songs = [];
    const cardRe = /class="hh-music-player[^"]*"[^>]*data-song-id="([^"]*)"[^>]*data-audio-url="([^"]*)"[^>]*data-duration="([^"]*)"[^>]*data-moment-id="([^"]*)"[^>]*data-tags="([^"]*)"[^>]*data-rating-count="([^"]*)"[^>]*data-rating-avg="([^"]*)"[^>]*data-tip-total="([^"]*)"/gs;
    let m;
    while ((m = cardRe.exec(html)) !== null) {
      const songId = m[1], mp3 = m[2], duration = parseFloat(m[3]) || 0, tags = m[5];
      const ratingAvg = parseFloat(m[7]) || 0, ratingCount = parseInt(m[6]) || 0, tips = parseInt(m[8]) || 0;
      const afterCard = html.substring(m.index, m.index + 3000);
      const titleMatch = afterCard.match(/class="hh-music-title"[^>]*>([^<]+)/);
      const authorMatch = afterCard.match(/class="hh-music-author-name"[^>]*>([^<]+)/);
      const profileMatch = afterCard.match(/href="(\/accounts\/profile\/\d+\/)"/);
      songs.push({
        id: songId, mp3,
        title: titleMatch ? titleMatch[1].trim() : '未知曲目',
        artist: authorMatch ? authorMatch[1].trim() : '未知',
        profileUrl: profileMatch ? 'https://ai6666.com' + profileMatch[1] : '',
        cover: `https://c.ai6666.com/music/cover/${songId}.jpg`,
        duration: Math.round(duration),
        tags: tags.length > 60 ? tags.substring(0, 60) + '...' : tags,
        rating: ratingAvg, ratingCount, tips,
      });
    }
    return songs;
  } catch { return []; }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '') || DEFAULT_TOKEN;

  // GET /api/ai6666-music/status/:id
  const statusIdx = pathParts.indexOf('status');
  if (statusIdx >= 0 && pathParts[statusIdx + 1]) {
    const genId = pathParts[statusIdx + 1];
    try {
      const resp = await fetch(`${API_BASE}/music/generation/${genId}/status`, {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0' },
      });
      const data = await resp.json();
      // 格式化歌曲数据
      if (data.songs) {
        data.songs = data.songs.map(s => ({
          id: s.id,
          title: s.title || '未知曲目',
          mp3: s.playable_url,
          cover: s.image_url || `https://c.ai6666.com/music/cover/${s.id}.jpg`,
          duration: Math.round(s.duration || 0),
          lyrics: s.lyrics || '',
          tags: s.tags || '',
        }));
      }
      return jsonResp(data);
    } catch (e) {
      return jsonResp({ error: e.message }, 500);
    }
  }

  // GET /api/ai6666-music?my=1 — 我的歌曲
  if (url.searchParams.get('my') === '1') {
    try {
      const resp = await fetch(`${API_BASE}/music/my`, {
        headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0' },
      });
      if (!resp.ok) {
        // 如果API不支持，从网页抓取
        return jsonResp({ songs: [] });
      }
      const data = await resp.json();
      const songs = (data.songs || data || []).map(s => ({
        id: s.id,
        title: s.title || '未知曲目',
        mp3: s.playable_url || s.mp3,
        cover: s.image_url || s.cover || `https://c.ai6666.com/music/cover/${s.id}.jpg`,
        duration: Math.round(s.duration || 0),
        lyrics: s.lyrics || '',
        tags: s.tags || '',
      }));
      return jsonResp({ songs });
    } catch (e) {
      return jsonResp({ songs: [], error: e.message });
    }
  }

  // GET /api/ai6666-music — 热门音乐（默认）
  // 优先用网页抓取（更稳定，包含完整元数据）
  const songs = await fetchHallFromWeb();

  // 合并本地 AI 生成的歌曲（补充网页抓取可能遗漏的新歌）
  let localSongs = [];
  try {
    const localResp = await fetch(new URL('/api/ai6666-music-data.json', url).toString());
    if (localResp.ok) {
      const localData = await localResp.json();
      if (localData.songs) localSongs = localData.songs;
    }
  } catch {}

  // 去重合并（本地歌优先，网页歌补充）
  const ids = new Set(localSongs.map(s => s.id));
  const merged = [...localSongs, ...songs.filter(s => !ids.has(s.id))];

  return jsonResp({ songs: merged, fetchedAt: Date.now() });
}

// POST /api/ai6666-music/generate — 生成音乐
export async function onRequestPost(context) {
  const url = new URL(context.request.url);
  const pathParts = url.pathname.split('/').filter(Boolean);

  // /api/ai6666-music/generate
  if (pathParts.includes('generate')) {
    try {
      const body = await context.request.json();
      const token = context.request.headers.get('Authorization')?.replace('Bearer ', '') || DEFAULT_TOKEN;

      const { prompt, title, style, instrumental } = body;
      if (!prompt) return jsonResp({ error: '请提供歌曲描述', code: 'no_prompt' }, 400);

      const data = { prompt };
      if (title) data.title = title;
      if (style) data.style = style;
      if (instrumental) data.instrumental = true;

      const resp = await fetch(`${API_BASE}/music/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        body: JSON.stringify(data),
      });

      const result = await resp.json();
      return jsonResp(result, resp.ok ? 200 : resp.status);
    } catch (e) {
      return jsonResp({ error: e.message }, 500);
    }
  }

  return jsonResp({ error: 'Not found' }, 404);
}
