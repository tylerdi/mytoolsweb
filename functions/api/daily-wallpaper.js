// functions/api/daily-wallpaper.js
// 每日壁纸 API
import { createDb } from './_supabase.js';

// 壁纸风格池
const STYLES = [
  { name: '风景', prompts: ['majestic mountain landscape at golden hour', 'serene ocean sunset with clouds', 'misty forest with sunbeams', 'lavender field under starry sky', 'autumn forest with golden leaves', 'snowy mountain peak with aurora borealis', 'tropical beach with crystal clear water', 'cherry blossom garden in spring'] },
  { name: '动漫', prompts: ['anime girl standing in rain with umbrella', 'cyberpunk city at night with neon lights', 'studio ghibli style peaceful village', 'anime character watching sunset on rooftop', 'magical forest with floating islands', 'anime style cozy coffee shop interior', 'mecha robot standing in destroyed city', 'anime school rooftop cherry blossoms'] },
  { name: '城市', prompts: ['futuristic city skyline at dusk', 'Tokyo street at night with rain reflections', 'European old town with cobblestone streets', 'Hong Kong neon signs at night', 'Paris cafe terrace in morning light', 'New York Central Park in autumn', 'Shanghai bund skyline at night', 'Venice canal with gondola at sunset'] },
  { name: '星空', prompts: ['milky way galaxy over desert landscape', 'northern lights over frozen lake', 'starry sky reflection in mountain lake', 'moonlit ocean with bioluminescent waves', 'shooting stars over ancient temple', 'nebula in deep space with vibrant colors', 'full moon over snowy landscape', 'constellation map with golden lines'] },
  { name: '极简', prompts: ['minimalist geometric shapes on pastel background', 'single flower in vase with soft light', 'zen garden with raked sand patterns', 'abstract watercolor gradient', 'minimalist mountain silhouette at dawn', 'clean desk setup with morning light', 'single tree on hill with dramatic sky', 'abstract fluid art with marble texture'] },
  { name: '动物', prompts: ['majestic wolf in snowy forest', 'cute cat sleeping in sunbeam', 'butterfly on flower with bokeh background', 'fox in autumn forest with golden light', 'whale breaching ocean surface at sunset', 'eagle soaring over mountain valley', 'deer in misty morning meadow', 'owl perched on branch under moonlight'] },
  { name: '赛博', prompts: ['cyberpunk alley with holographic signs', 'neon city reflected in rain puddle', 'digital art of floating data streams', 'retro synthwave sunset landscape', 'cybernetic hand reaching for stars', 'holographic butterfly on circuit board', 'virtual reality landscape with glitch effects', 'neon samurai in rainy cyberpunk city'] },
];

// 随机选一个风格和 prompt
function getRandomPrompt() {
  const style = STYLES[Math.floor(Math.random() * STYLES.length)];
  const prompt = style.prompts[Math.floor(Math.random() * style.prompts.length)];
  return { style: style.name, prompt: `${prompt}, 4k wallpaper, high quality, detailed` };
}

// 通过 Pollinations.ai 生成图片
async function generateImage(prompt) {
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1080&height=1920&nologo=true&seed=${Date.now()}`;
  
  // Pollinations 返回重定向，我们需要获取最终 URL
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (res.ok) {
      return url; // 返回原始 URL（带重定向）
    }
  } catch {}
  
  return null;
}

// 上传到 catbox
async function uploadToCatbox(imageUrl) {
  try {
    const imgRes = await fetch(imageUrl);
    const blob = await imgRes.blob();
    
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', blob, 'wallpaper.jpg');
    
    const uploadRes = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form,
    });
    
    if (uploadRes.ok) {
      return await uploadRes.text();
    }
  } catch {}
  return null;
}

// 生成今日壁纸（供 cron 或手动调用）
export async function onRequestPost(context) {
  try {
    const db = createDb(context.env);
    
    // 检查今天是否已生成
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.get('daily_wallpapers', {
      filters: { date: `eq.${today}` },
      limit: 1,
    });
    
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({
        ok: true,
        wallpaper: existing[0],
        message: '今日壁纸已存在',
      }));
    }
    
    // 生成新壁纸
    const { style, prompt } = getRandomPrompt();
    const imageUrl = await generateImage(prompt);
    
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: '图片生成失败' }), { status: 500 });
    }
    
    // 上传到 catbox（永久链接）
    const catboxUrl = await uploadToCatbox(imageUrl);
    
    // 存入数据库
    const result = await db.insert('daily_wallpapers', {
      date: today,
      prompt,
      style,
      image_url: imageUrl,
      image_catbox: catboxUrl,
    });
    
    return new Response(JSON.stringify({
      ok: true,
      wallpaper: result[0],
    }));
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 获取今日壁纸
export async function onRequestGet(context) {
  try {
    const db = createDb(context.env);
    const url = new URL(context.request.url);
    const date = url.searchParams.get('date');
    
    let filters = {};
    if (date) {
      filters = { date: `eq.${date}` };
    } else {
      // 默认获取最新的
      const latest = await db.get('daily_wallpapers', {
        order: 'date.desc',
        limit: 1,
      });
      
      if (latest && latest.length > 0) {
        return new Response(JSON.stringify({ ok: true, wallpaper: latest[0] }));
      }
      
      return new Response(JSON.stringify({ ok: true, wallpaper: null }));
    }
    
    const result = await db.get('daily_wallpapers', {
      filters,
      limit: 1,
    });
    
    return new Response(JSON.stringify({
      ok: true,
      wallpaper: result && result.length > 0 ? result[0] : null,
    }));
    
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
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
