const FENCED_JSON = /```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```/gi;

export function inspectJsonOutput(input) {
  const raw = input.trim();
  if (!raw) return { ok: false, message: '请先输入 JSON 文本。', hint: '', position: null };

  const blocks = [...raw.matchAll(FENCED_JSON)];
  const extracted = blocks.length === 1;
  const candidate = extracted ? blocks[0][1].trim() : raw;

  try {
    const value = JSON.parse(candidate);
    const kind = Array.isArray(value) ? '数组' : value === null ? 'null' : typeof value === 'object' ? '对象' : '单值';
    const items = Array.isArray(value) ? value.length : value && typeof value === 'object' ? Object.keys(value).length : 1;
    return {
      ok: true,
      formatted: JSON.stringify(value, null, 2),
      compact: JSON.stringify(value),
      message: `语法正确 · ${kind} · ${items} 个顶层项目`,
      hint: extracted ? '已从代码围栏中提取 JSON；围栏之外的说明未参与解析。' : '',
      extracted,
    };
  } catch (error) {
    const positionMatch = error.message.match(/position (\d+)/i);
    const position = positionMatch ? Number(positionMatch[1]) : null;
    let hint = '检查最近的引号、逗号和括号是否成对。';
    if (/,[ \t\r\n]*[}\]]/.test(candidate)) hint = '末尾逗号不是合法 JSON；检查对象或数组的最后一项。';
    else if (/(?:^|[{,])[ \t\r\n]*'/.test(candidate)) hint = 'JSON 的属性名和字符串必须使用双引号。';
    else if (/\bundefined\b/.test(candidate)) hint = 'JSON 没有 undefined 值；请使用 null 或删除该字段。';
    return { ok: false, message: error.message, hint, position, extracted };
  }
}

function mountInspector(root) {
  const input = root.querySelector('[data-json-input]');
  const output = root.querySelector('[data-json-output]');
  const status = root.querySelector('[data-json-status]');
  const hint = root.querySelector('[data-json-hint]');
  const copy = root.querySelector('[data-json-copy]');
  let latest = null;
  let mode = 'formatted';

  const render = () => {
    const result = inspectJsonOutput(input.value);
    latest = result.ok ? result : null;
    status.textContent = result.message;
    status.dataset.state = result.ok ? 'success' : 'error';
    hint.textContent = result.hint;
    output.textContent = result.ok ? result[mode] : '';
    copy.disabled = !result.ok;
    if (!result.ok && result.position !== null && result.position < input.value.length && !result.extracted) {
      input.setSelectionRange(result.position, result.position + 1);
    }
    window.trackToolEvent?.(result.ok ? 'json_check_success' : 'json_check_error');
  };

  root.querySelector('[data-json-check]').addEventListener('click', render);
  root.querySelector('[data-json-sample]').addEventListener('click', () => {
    input.value = '示例响应：\n```json\n{"user":{"id":42,"active":true},"items":[{"sku":"A-1","qty":2}]}\n```';
    render();
  });
  root.querySelector('[data-json-clear]').addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    status.textContent = '等待输入';
    status.dataset.state = 'idle';
    hint.textContent = '';
    copy.disabled = true;
    latest = null;
    input.focus();
  });
  root.querySelector('[data-json-format]').addEventListener('change', (event) => {
    mode = event.target.value;
    if (latest) output.textContent = latest[mode];
  });
  copy.addEventListener('click', async () => {
    if (!latest) return;
    try {
      await navigator.clipboard.writeText(latest[mode]);
      status.textContent = '结果已复制';
    } catch {
      status.textContent = '复制失败，请手动选取结果。';
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-json-inspector]').forEach(mountInspector);
  });
}
