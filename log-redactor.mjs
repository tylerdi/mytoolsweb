const SECRET_KEYS = new Set(['authorization', 'proxyauthorization', 'cookie', 'setcookie', 'xapikey', 'apikey', 'token', 'accesstoken', 'refreshtoken', 'idtoken', 'clientsecret', 'secret', 'password', 'passwd', 'privatekey']);

export function redactEvidence(input) {
  const source = String(input ?? '');
  if (!source.trim()) throw new Error('请先粘贴需要检查的日志或 JSON。');
  if (source.length > 100000) throw new Error('输入最多 100,000 字符，请先截取与故障有关的片段。');
  const counts = { fields: 0, headers: 0, assignments: 0, tokens: 0, emails: 0 };
  let text = source;
  let structured = false;

  try {
    const value = JSON.parse(source);
    if (value !== null && typeof value === 'object') {
      const stack = [value];
      while (stack.length) {
        const current = stack.pop();
        for (const [key, child] of Object.entries(current)) {
          if (SECRET_KEYS.has(key.toLowerCase().replace(/[-_\s]/g, ''))) {
            current[key] = '[已遮盖]';
            counts.fields += 1;
          } else if (child !== null && typeof child === 'object') {
            stack.push(child);
          }
        }
      }
      text = JSON.stringify(value, null, 2);
      structured = true;
    }
  } catch {
    // Free-form logs and incomplete JSON still go through the text rules below.
    counts.fields = 0;
    text = source;
  }

  text = text.replace(/^([ \t]*(?:authorization|proxy-authorization|cookie|set-cookie|x-api-key)\s*:\s*)([^\r\n]+)/gim, (_, label) => {
    counts.headers += 1;
    return `${label}[已遮盖]`;
  });
  text = text.replace(/\b((?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|passwd|token)\s*[:=]\s*)(["'])(.*?)\2/gi, (_, label, quote) => {
    counts.assignments += 1;
    return `${label}${quote}[已遮盖]${quote}`;
  });
  text = text.replace(/\b((?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|passwd|token)\s*[:=]\s*)([^\s&#"'<>\[]+)/gi, (_, label) => {
    counts.assignments += 1;
    return `${label}[已遮盖]`;
  });
  text = text.replace(/\bBearer\s+[A-Za-z0-9._~+/-]{8,}/gi, () => {
    counts.tokens += 1;
    return 'Bearer [已遮盖]';
  });
  text = text.replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|AIza[0-9A-Za-z_-]{20,})\b/g, () => {
    counts.tokens += 1;
    return '[已遮盖]';
  });
  text = text.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, () => {
    counts.emails += 1;
    return '[邮箱已遮盖]';
  });
  return { text, counts, structured };
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('[data-redactor-form]');
  if (form) {
    const output = document.querySelector('[data-redactor-output]');
    const status = document.querySelector('[data-redactor-status]');
    const detail = document.querySelector('[data-redactor-detail]');
    const copy = document.querySelector('[data-redactor-copy]');
    let redacted = '';
    function render() {
      redacted = '';
      copy.disabled = true;
      output.textContent = '';
      try {
        const result = redactEvidence(form.elements.evidence.value);
        redacted = result.text;
        output.textContent = redacted;
        const total = Object.values(result.counts).reduce((sum, count) => sum + count, 0);
        status.textContent = total ? `已遮盖 ${total} 处，请人工复核` : '未发现匹配项，请人工复核';
        status.dataset.state = total ? 'success' : 'error';
        detail.textContent = `字段 ${result.counts.fields} · 请求头 ${result.counts.headers} · 参数 ${result.counts.assignments} · 令牌 ${result.counts.tokens} · 邮箱 ${result.counts.emails}${result.structured ? ' · JSON 已重新排版' : ''}`;
        copy.disabled = false;
        window.trackToolEvent?.('redactor_success');
      } catch (error) {
        status.textContent = error.message;
        status.dataset.state = 'error';
        detail.textContent = '';
        window.trackToolEvent?.('redactor_error');
      }
    }
    form.addEventListener('submit', (event) => { event.preventDefault(); render(); });
    form.addEventListener('input', () => {
      redacted = '';
      output.textContent = '';
      detail.textContent = '';
      copy.disabled = true;
      status.textContent = '输入已变更，请重新检查';
      status.dataset.state = 'idle';
    });
    document.querySelector('[data-redactor-sample]').addEventListener('click', () => {
      form.elements.evidence.value = '{"request_id":"req_42","headers":{"Authorization":"Bearer demo_secret_1234567890","X-API-Key":"sk-demo123456789012345"},"user_email":"dev@example.com","status":429}';
      render();
    });
    document.querySelector('[data-redactor-clear]').addEventListener('click', () => {
      form.reset();
      redacted = '';
      output.textContent = '';
      detail.textContent = '';
      copy.disabled = true;
      status.textContent = '等待输入';
      status.dataset.state = 'idle';
      form.elements.evidence.focus();
    });
    copy.addEventListener('click', async () => {
      if (!redacted) return;
      try {
        await navigator.clipboard.writeText(redacted);
        status.textContent = '已复制，请在分享前人工复核';
      } catch {
        status.textContent = '复制失败，请检查浏览器权限';
      }
    });
  }
}
