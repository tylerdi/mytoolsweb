/**
 * 小鱼儿音乐台 🐟🎵
 * AI 每日推荐一首歌 + 生成推荐理由
 * 用法：<div id="fish-music"></div><script src="/fish-music.js"></script>
 */

(function () {
  'use strict';

  // 精选歌单（经典 + 小众好歌）
  const SONGS = [
    { title: 'Lose Yourself', artist: 'Eminem', genre: '说唱', mood: '热血', emoji: '🔥' },
    { title: 'Bohemian Rhapsody', artist: 'Queen', genre: '摇滚', mood: '史诗', emoji: '👑' },
    { title: 'Clair de Lune', artist: 'Debussy', genre: '古典', mood: '宁静', emoji: '🌙' },
    { title: 'Hotel California', artist: 'Eagles', genre: '摇滚', mood: '神秘', emoji: '🏨' },
    { title: 'Shape of You', artist: 'Ed Sheeran', genre: '流行', mood: '甜蜜', emoji: '💃' },
    { title: 'Stairway to Heaven', artist: 'Led Zeppelin', genre: '摇滚', mood: '升华', emoji: '🪜' },
    { title: 'Imagine', artist: 'John Lennon', genre: '民谣', mood: '理想', emoji: '✌️' },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: '摇滚', mood: '叛逆', emoji: '🎸' },
    { title: 'What a Wonderful World', artist: 'Louis Armstrong', genre: '爵士', mood: '温暖', emoji: '🌍' },
    { title: 'Billie Jean', artist: 'Michael Jackson', genre: '流行', mood: '律动', emoji: '🕺' },
    { title: 'Yesterday', artist: 'The Beatles', genre: '摇滚', mood: '怀旧', emoji: '📷' },
    { title: 'Like a Rolling Stone', artist: 'Bob Dylan', genre: '民谣', mood: '自由', emoji: '🪨' },
    { title: 'Superstition', artist: 'Stevie Wonder', genre: '放克', mood: '欢快', emoji: '🎹' },
    { title: 'No Woman No Cry', artist: 'Bob Marley', genre: '雷鬼', mood: '治愈', emoji: '🌴' },
    { title: 'Take Five', artist: 'Dave Brubeck', genre: '爵士', mood: '优雅', emoji: '🎷' },
    { title: 'Purple Rain', artist: 'Prince', genre: '摇滚', mood: '深情', emoji: '☔' },
    { title: 'Wonderwall', artist: 'Oasis', genre: '摇滚', mood: '青春', emoji: '🧱' },
    { title: 'Bittersweet Symphony', artist: 'The Verve', genre: '摇滚', mood: '哲思', emoji: '🎻' },
    { title: 'Moonlight Sonata', artist: 'Beethoven', genre: '古典', mood: '忧伤', emoji: '🌕' },
    { title: 'Fly Me to the Moon', artist: 'Frank Sinatra', genre: '爵士', mood: '浪漫', emoji: '🚀' },
    { title: 'The Sound of Silence', artist: 'Simon & Garfunkel', genre: '民谣', mood: '沉思', emoji: '🤫' },
    { title: 'Don\'t Stop Me Now', artist: 'Queen', genre: '摇滚', mood: '狂欢', emoji: '🚀' },
    { title: 'Spring Waltz', artist: 'Chopin', genre: '古典', mood: '清新', emoji: '🌸' },
    { title: 'Counting Stars', artist: 'OneRepublic', genre: '流行', mood: '励志', emoji: '⭐' },
    { title: 'Blinding Lights', artist: 'The Weeknd', genre: '流行', mood: '复古', emoji: '✨' },
    { title: 'Dancing Queen', artist: 'ABBA', genre: '流行', mood: '欢乐', emoji: '💃' },
    { title: 'Nothing Else Matters', artist: 'Metallica', genre: '金属', mood: '深情', emoji: '🎸' },
    { title: 'Sittin\' On The Dock Of The Bay', artist: 'Otis Redding', genre: '灵魂', mood: '悠闲', emoji: '⛵' },
    { title: 'Schindler\'s List Theme', artist: 'John Williams', genre: '电影配乐', mood: '感动', emoji: '🎬' },
    { title: 'River Flows in You', artist: 'Yiruma', genre: '钢琴', mood: '温柔', emoji: '🌊' },
  ];

  class FishMusic {
    constructor() {
      this.container = document.getElementById('fish-music');
      if (!this.container) return;
      this.todayKey = new Date().toISOString().slice(0, 10);
      this.init();
    }

    init() {
      const cached = this.loadCache();
      if (cached) {
        this.render(cached.song, cached.reason);
        return;
      }
      const song = this.pickToday();
      this.generateReason(song);
    }

    pickToday() {
      // 基于日期的确定性选择
      const d = new Date();
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
      return SONGS[seed % SONGS.length];
    }

    async generateReason(song) {
      this.renderLoading();

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `今天推荐的歌是《${song.title}》- ${song.artist}，风格：${song.genre}，情绪：${song.mood}。请用轻松有趣的语气写一段推荐理由（60字以内），告诉听众为什么今天该听这首歌。只输出推荐理由，不要歌名。`
            }],
            model: 'mimo-v2-flash',
          }),
        });

        let reason = '';
        if (res.ok) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split('\n')) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) reason += delta;
              } catch (e) {}
            }
          }
        }

        if (!reason) reason = `今天的氛围适合来点${song.mood}的音乐 🎵`;
        this.cache(song, reason);
        this.render(song, reason);
      } catch (err) {
        this.render(song, `今天的氛围适合来点${song.mood}的音乐 🎵`);
      }
    }

    render(song, reason) {
      this.container.innerHTML = `
        <style>
          .fm-widget {
            background: linear-gradient(135deg, #0f0f1e 0%, #1a0f2e 40%, #2a1a4e 100%);
            border-radius: 20px; padding: 24px; color: #f5f3ff;
            box-shadow: 0 10px 30px -10px rgba(99,102,241,0.35);
            border: 1px solid rgba(168,85,247,0.25);
            position: relative; overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            ; width:100%; margin: 0 auto;
          }
          .fm-widget::before {
            content: ''; position: absolute; inset: 0;
            background: radial-gradient(circle at 20% 0%, rgba(236,72,153,0.15) 0%, transparent 50%),
                        radial-gradient(circle at 80% 100%, rgba(99,102,241,0.15) 0%, transparent 55%);
            pointer-events: none;
          }
          .fm-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
            border-radius: 20px; padding: 4px 12px; font-size: 11px;
            font-weight: 600; color: #c4b5fd; margin-bottom: 16px;
          }
          .fm-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: #22c55e; animation: fmPulse 2s infinite; }
          @keyframes fmPulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
          .fm-song { position: relative; z-index: 1; }
          .fm-emoji { font-size: 48px; margin-bottom: 12px; }
          .fm-title { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
          .fm-artist { font-size: 14px; color: #a78bfa; margin-bottom: 4px; font-weight: 500; }
          .fm-tags { display: flex; gap: 6px; margin-bottom: 16px; }
          .fm-tag {
            font-size: 10px; font-weight: 600; padding: 3px 8px;
            border-radius: 12px; background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.1); color: #c4b5fd;
          }
          .fm-reason {
            font-size: 14px; line-height: 1.7; color: #e0d4ff;
            position: relative; z-index: 1;
            padding: 14px; background: rgba(255,255,255,0.05);
            border-radius: 12px; border: 1px solid rgba(255,255,255,0.08);
          }
          .fm-reason::before { content: '💬 '; }
          .fm-date {
            font-size: 11px; color: rgba(255,255,255,0.3);
            margin-top: 12px; text-align: right;
          }
          .fm-visualizer {
            display: flex; gap: 3px; align-items: flex-end; height: 30px;
            margin-top: 12px; justify-content: center;
          }
          .fm-bar {
            width: 4px; border-radius: 2px;
            background: linear-gradient(to top, #6366f1, #a855f7);
            animation: fmBounce var(--dur) ease-in-out infinite alternate;
          }
          @keyframes fmBounce { from { height: 4px; } to { height: var(--h); } }
        
        @media(){
          .fm-widget{padding:16px !important;border-radius:12px !important}
          .fm-widget *{max-width:100% !important;box-sizing:border-box}
        }
        </style>
        <div class="fm-widget">
          <div class="fm-badge"><span class="dot"></span> 每日推荐 · ${this.todayKey}</div>
          <div class="fm-song">
            <div class="fm-emoji">${song.emoji}</div>
            <div class="fm-title">${song.title}</div>
            <div class="fm-artist">${song.artist}</div>
            <div class="fm-tags">
              <span class="fm-tag">${song.genre}</span>
              <span class="fm-tag">${song.mood}</span>
            </div>
            <div class="fm-reason">${reason}</div>
            <div class="fm-visualizer">
              ${Array.from({length: 12}, (_, i) =>
                `<div class="fm-bar" style="--dur:${0.4 + Math.random() * 0.6}s;--h:${10 + Math.random() * 20}px"></div>`
              ).join('')}
            </div>
            <div class="fm-date">🐟 小鱼儿音乐台</div>
          </div>
        </div>
      `;
    }

    renderLoading() {
      this.container.innerHTML = `
        <div class="fm-widget" style=";width:100%;margin:0 auto;background:linear-gradient(135deg,#0f0f1e,#1a0f2e,#2a1a4e);border-radius:20px;padding:24px;color:#f5f3ff;text-align:center;font-family:-apple-system,sans-serif;">
          <div style="font-size:32px;margin-bottom:12px">🎵</div>
          <div style="color:#a78bfa;font-size:14px">小鱼儿正在选今天的歌...</div>
        </div>
      `;
    }

    cache(song, reason) {
      localStorage.setItem(`fm_${this.todayKey}`, JSON.stringify({ song, reason }));
    }

    loadCache() {
      try {
        return JSON.parse(localStorage.getItem(`fm_${this.todayKey}`));
      } catch { return null; }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FishMusic());
  } else {
    new FishMusic();
  }
})();
