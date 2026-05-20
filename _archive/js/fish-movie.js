/**
 * AI 影视推荐 🎬
 * 心情/类型→推荐片单
 */
(function() {
  'use strict';

  class MovieRecommender {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-movie';
      this.el.innerHTML = `
        <style>
          .fish-movie{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .mv-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem}
          .mv-header h3{font-size:1.1rem;margin:0}
          .mv-moods{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.75rem}
          .mv-mood{background:rgba(100,108,255,0.08);border:1px solid rgba(100,108,255,0.2);color:var(--text-secondary,#888);padding:0.35rem 0.7rem;border-radius:20px;cursor:pointer;font-size:0.8rem}
          .mv-mood:hover,.mv-mood.active{background:rgba(100,108,255,0.2);color:var(--accent,#646cff);border-color:var(--accent,#646cff)}
          .mv-input{width:100%;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit;margin-bottom:0.75rem}
          .mv-input:focus{border-color:var(--accent,#646cff)}
          .mv-go{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1.5rem;cursor:pointer;font-size:0.9rem}
          .mv-go:disabled{opacity:0.5;cursor:not-allowed}
          .mv-output{display:none;margin-top:1rem}
          .mv-output.show{display:block}
          .mv-card{padding:1rem;background:var(--bg,#0a0a0a);border-radius:10px;margin-bottom:0.75rem;border-left:3px solid var(--accent,#646cff)}
          .mv-card .title{font-weight:700;font-size:1rem;margin-bottom:0.25rem}
          .mv-card .meta{font-size:0.78rem;color:var(--text-secondary,#888);margin-bottom:0.4rem}
          .mv-card .desc{font-size:0.85rem;line-height:1.6}
          @media(max-width:640px){.fish-movie{padding:1rem}.mv-go{width:100%}}
        </style>
        <div class="mv-header"><span>🎬</span><h3>AI 影视推荐</h3></div>
        <div class="mv-moods">
          <span class="mv-mood" data-v="想笑一笑">😂 想笑</span>
          <span class="mv-mood" data-v="想哭一场">😢 想哭</span>
          <span class="mv-mood" data-v="想烧脑">🧠 烧脑</span>
          <span class="mv-mood" data-v="想放松">😌 放松</span>
          <span class="mv-mood" data-v="想被治愈">🧸 治愈</span>
          <span class="mv-mood" data-v="想看爽片">🔥 爽片</span>
          <span class="mv-mood" data-v="一个人安静看">🌙 独处</span>
          <span class="mv-mood" data-v="和朋友一起看">👯 和朋友</span>
        </div>
        <input class="mv-input" id="mv-input" placeholder="描述你的心情或想看的类型...">
        <button class="mv-go" id="mv-go">🎬 推荐片单</button>
        <div class="mv-output" id="mv-output"></div>
      `;
      container.appendChild(this.el);
      const input = this.el.querySelector('#mv-input');
      this.el.querySelectorAll('.mv-mood').forEach(m => m.addEventListener('click', () => {
        this.el.querySelectorAll('.mv-mood').forEach(x => x.classList.remove('active'));
        m.classList.add('active');
        input.value = m.dataset.v;
      }));
      this.el.querySelector('#mv-go').addEventListener('click', () => this.go());
    }

    async go() {
      const desc = this.el.querySelector('#mv-input').value.trim();
      if (!desc) return;
      const outputEl = this.el.querySelector('#mv-output');
      const goBtn = this.el.querySelector('#mv-go');
      goBtn.disabled = true; goBtn.textContent = '推荐中...';
      outputEl.className = 'mv-output show';
      outputEl.innerHTML = '<div style="text-align:center;color:var(--text-secondary,#888);padding:1rem">正在挑选...</div>';

      const prompt = `用户状态：${desc}。请推荐5部电影或剧集。输出JSON数组：[{"title":"片名","year":"年份","genre":"类型","rating":"评分(如8.5)","reason":"推荐理由（1-2句）"}]。只输出JSON。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], stream: false, max_tokens: 500 })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        const match = text.match(/\[[\s\S]*\]/);
        if (match) {
          const movies = JSON.parse(match[0]);
          outputEl.innerHTML = movies.map(m => `
            <div class="mv-card">
              <div class="title">🎬 ${m.title}</div>
              <div class="meta">${m.year} · ${m.genre} · ⭐ ${m.rating}</div>
              <div class="desc">${m.reason}</div>
            </div>
          `).join('');
        } else { outputEl.innerHTML = '推荐失败，请重试'; }
      } catch (e) { outputEl.innerHTML = '⚠️ 出错了'; }
      goBtn.disabled = false; goBtn.textContent = '🎬 推荐片单';
    }
  }

  window.MovieRecommender = MovieRecommender;
  function init() { const el = document.getElementById('fish-movie'); if (!el) return; new MovieRecommender().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
