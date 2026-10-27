import { inspectJsonOutput } from './json-output.mjs';

const LIMIT = 200;
const NODE_LIMIT = 20000;

function kind(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return '数组';
  if (typeof value === 'object') return '对象';
  return { string: '字符串', number: '数字', boolean: '布尔值' }[typeof value] ?? typeof value;
}

function pointer(path, key) {
  return `${path}/${String(key).replace(/~/g, '~0').replace(/\//g, '~1')}`;
}

export function compareJson(expected, actual) {
  const changes = [];
  const stack = [{ expected, actual, path: '', depth: 0 }];
  let visited = 0;
  while (stack.length) {
    if (changes.length >= LIMIT || visited >= NODE_LIMIT) break;
    const item = stack.pop();
    visited += 1;
    if (item.type) {
      changes.push(item);
      continue;
    }
    if (item.depth > 100) throw new Error('JSON 嵌套超过 100 层，请缩小输入范围。');
    const before = kind(item.expected);
    const after = kind(item.actual);
    if (before !== after) {
      changes.push({ path: item.path || '/', type: 'type', before, after });
      continue;
    }
    if (before === '数组' || before === '对象') {
      const keys = before === '数组'
        ? Array.from({ length: Math.max(item.expected.length, item.actual.length) }, (_, index) => index)
        : [...new Set([...Object.keys(item.expected), ...Object.keys(item.actual)])].sort();
      for (let index = keys.length - 1; index >= 0; index -= 1) {
        const key = keys[index];
        const childPath = pointer(item.path, key);
        if (!Object.hasOwn(item.expected, key)) {
          stack.push({ path: childPath, type: 'added' });
        } else if (!Object.hasOwn(item.actual, key)) {
          stack.push({ path: childPath, type: 'removed' });
        } else {
          stack.push({ expected: item.expected[key], actual: item.actual[key], path: childPath, depth: item.depth + 1 });
        }
      }
      continue;
    }
    if (item.expected !== item.actual) changes.push({ path: item.path || '/', type: 'value', before, after });
  }
  return { changes, truncated: stack.length > 0 };
}

export function compareJsonText(expectedText, actualText) {
  const expected = inspectJsonOutput(expectedText);
  if (!expected.ok) throw new Error(`基准 JSON：${expected.message}`);
  const actual = inspectJsonOutput(actualText);
  if (!actual.ok) throw new Error(`当前 JSON：${actual.message}`);
  return compareJson(JSON.parse(expected.compact), JSON.parse(actual.compact));
}

const LABELS = { added: '新增字段', removed: '缺失字段', type: '类型变化', value: '值变化' };

export function buildDiffReport(result) {
  const lines = ['# JSON 回归对比', '', `${result.truncated ? '已显示' : '发现'} ${result.changes.length} 处差异${result.truncated ? '；扫描达到上限，结果不完整' : ''}。`];
  if (!result.changes.length && !result.truncated) lines.push('', '两个 JSON 在当前比较规则下相同。');
  else if (!result.changes.length) lines.push('', '扫描未完成，不能断定两份 JSON 相同。');
  else lines.push('', ...result.changes.map((change) => `- ${LABELS[change.type]}：${change.path}${change.type === 'type' ? `（${change.before} → ${change.after}）` : ''}`));
  lines.push('', '对象属性顺序忽略；数组按索引比较。报告不包含字段值，分享前仍请检查字段路径。');
  return lines.join('\n');
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('[data-diff-form]');
  if (form) {
    const output = document.querySelector('[data-diff-output]');
    const status = document.querySelector('[data-diff-status]');
    const copy = document.querySelector('[data-diff-copy]');
    let report = '';
    function render() {
      report = '';
      copy.disabled = true;
      output.replaceChildren();
      try {
        const result = compareJsonText(form.elements.expected.value, form.elements.actual.value);
        report = buildDiffReport(result);
        status.textContent = result.truncated ? `已显示 ${result.changes.length} 处差异，扫描未完成` : result.changes.length ? `${result.changes.length} 处差异` : '无差异';
        status.dataset.state = result.changes.length || result.truncated ? 'error' : 'success';
        if (!result.changes.length) output.textContent = result.truncated ? '扫描达到上限，不能断定两份 JSON 相同。' : '对象属性顺序不影响结果；当前输入没有检测到差异。';
        for (const change of result.changes) {
          const row = document.createElement('li');
          const label = document.createElement('span');
          label.textContent = LABELS[change.type];
          const path = document.createElement('code');
          path.textContent = change.path;
          row.append(label, path);
          if (change.type === 'type') row.append(document.createTextNode(`${change.before} → ${change.after}`));
          output.append(row);
        }
        copy.disabled = false;
        window.trackToolEvent?.('json_diff_success');
      } catch (error) {
        status.textContent = error.message;
        status.dataset.state = 'error';
        window.trackToolEvent?.('json_diff_error');
      }
    }
    form.addEventListener('submit', (event) => { event.preventDefault(); render(); });
    form.addEventListener('input', () => {
      report = '';
      copy.disabled = true;
      status.textContent = '输入已变更，请重新比较';
      status.dataset.state = 'idle';
      output.replaceChildren();
    });
    document.querySelector('[data-diff-sample]').addEventListener('click', () => {
      form.elements.expected.value = '{"id":"req_42","usage":{"input_tokens":120,"output_tokens":64},"finish_reason":"stop"}';
      form.elements.actual.value = '{"usage":{"input_tokens":"120","output_tokens":80},"finish_reason":"length","latency_ms":1200}';
      render();
    });
    document.querySelector('[data-diff-clear]').addEventListener('click', () => {
      form.reset();
      report = '';
      output.replaceChildren();
      status.textContent = '等待输入';
      status.dataset.state = 'idle';
      copy.disabled = true;
      form.elements.expected.focus();
    });
    copy.addEventListener('click', async () => {
      if (!report) return;
      try {
        await navigator.clipboard.writeText(report);
        status.textContent = '已复制不含字段值的摘要';
      } catch {
        status.textContent = '复制失败，请检查浏览器权限';
      }
    });
  }
}
