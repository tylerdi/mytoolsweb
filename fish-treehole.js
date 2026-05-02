/**
 * AI 树洞 💬
 * 匿名倾诉，AI心理陪伴
 */
(function() {
  'use strict';

  class TreeHole {
    build(container) {
      this.el = document.createElement('div');
      this.el.className = 'fish-treehole';
      this.messages = [];
      this.el.innerHTML = `
        <style>
          .fish-treehole{background:var(--surface,#141414);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:1.5rem;margin-bottom:1.5rem}
          .th-header{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.75rem}
          .th-header h3{font-size:1.1rem;margin:0}
          .th-hint{font-size:0.8rem;color:var(--text-secondary,#888);margin-bottom:1rem}
          .th-msgs{min-height:200px;max-height:400px;overflow-y:auto;padding:1rem;background:var(--bg,#0a0a0a);border-radius:12px;margin-bottom:1rem;display:flex;flex-direction:column;gap:0.75rem}
          .th-msgs::-webkit-scrollbar{width:4px}
          .th-msgs::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
          .th-msg{max-width:85%;padding:0.6rem 1rem;border-radius:14px;font-size:0.88rem;line-height:1.6}
          .th-msg.user{align-self:flex-end;background:var(--accent,#646cff);color:#fff;border-bottom-right-radius:4px}
          .th-msg.ai{align-self:flex-start;background:#1e1e1e;color:#e8e8e8;border:1px solid #2a2a2a;border-bottom-left-radius:4px}
          .th-msg.ai .th-label{font-size:0.7rem;color:var(--accent,#646cff);margin-bottom:0.2rem}
          .th-input-area{display:flex;gap:0.5rem}
          .th-input{flex:1;background:var(--bg,#0a0a0a);border:1px solid var(--border,#2a2a2a);border-radius:10px;padding:0.6rem 1rem;color:var(--text,#e8e8e8);font-size:0.85rem;outline:none;font-family:inherit}
          .th-input:focus{border-color:var(--accent,#646cff)}
          .th-send{background:var(--accent,#646cff);border:none;border-radius:10px;color:#fff;padding:0.6rem 1rem;cursor:pointer;font-size:0.85rem}
          .th-send:disabled{opacity:0.5;cursor:not-allowed}
          .th-clear{background:none;border:1px solid var(--border,#2a2a2a);color:var(--text-secondary,#888);padding:0.3rem 0.6rem;border-radius:6px;cursor:pointer;font-size:0.75rem;margin-top:0.5rem}
          @media(max-width:640px){.fish-treehole{padding:1rem}.th-send{padding:0.6rem 0.8rem}}
        </style>
        <div class="th-header"><span>💬</span><h3>AI 树洞</h3></div>
        <div class="th-hint">🌙 这里是你的秘密树洞，说什么都可以，AI会倾听和陪伴</div>
        <div class="th-msgs" id="th-msgs">
          <div class="th-msg ai"><div class="th-label">🌱 树洞</div>嗨，今晚想聊点什么？无论开心还是烦恼，我都在这里听你说 💕</div>
        </div>
        <div class="th-input-area">
          <input class="th-input" id="th-input" placeholder="说点什么吧..." maxlength="500">
          <button class="th-send" id="th-send">发送</button>
        </div>
        <button class="th-clear" id="th-clear">🗑️ 清空对话</button>
      `;
      container.appendChild(this.el);

      this.msgsEl = this.el.querySelector('#th-msgs');
      this.inputEl = this.el.querySelector('#th-input');
      this.sendBtn = this.el.querySelector('#th-send');

      this.sendBtn.addEventListener('click', () => this.send());
      this.inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }});
      this.el.querySelector('#th-clear').addEventListener('click', () => {
        this.messages = [];
        this.msgsEl.innerHTML = '<div class="th-msg ai"><div class="th-label">🌱 树洞</div>已清空，重新开始吧 💕</div>';
      });
    }

    async send() {
      const text = this.inputEl.value.trim();
      if (!text) return;
      this.inputEl.value = '';
      this.addMsg('user', text);
      this.messages.push({ role: 'user', content: text });
      this.sendBtn.disabled = true;

      const sysPrompt = `你是一个温暖的树洞倾听者。用户在匿名倾诉，你需要：1）先共情和理解；2）温和地回应；3）必要时给一些建议；4）用emoji让对话更温暖。不要评判用户，不要给医疗建议。回复简短温暖，不超过150字。`;

      try {
        const res = await fetch('/api/chat', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: [{ role: 'system', content: sysPrompt }, ...this.messages.slice(-10)], stream: false, max_tokens: 300 })
        });
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || '...';
        this.addMsg('ai', reply);
        this.messages.push({ role: 'assistant', content: reply });
      } catch (e) { this.addMsg('ai', '⚠️ 出了点问题，再试一次？'); }
      this.sendBtn.disabled = false;
    }

    addMsg(role, text) {
      const div = document.createElement('div');
      div.className = `th-msg ${role}`;
      div.innerHTML = role === 'ai' ? `<div class="th-label">🌱 树洞</div>${this.esc(text)}` : this.esc(text);
      this.msgsEl.appendChild(div);
      this.msgsEl.scrollTop = this.msgsEl.scrollHeight;
    }

    esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }
  }

  window.TreeHole = TreeHole;
  function init() { const el = document.getElementById('fish-treehole'); if (!el) return; new TreeHole().build(el); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
