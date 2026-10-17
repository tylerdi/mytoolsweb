import { inspectSse, SSE_SAMPLE } from './sse-core.mjs';

const form = document.querySelector('[data-sse-form]');
const status = document.querySelector('[data-sse-status]');
const summary = document.querySelector('[data-sse-summary]');
const rows = document.querySelector('[data-sse-rows]');
const errors = document.querySelector('[data-sse-errors]');

document.querySelector('[data-sse-sample]').addEventListener('click', () => {
  form.elements.transcript.value = SSE_SAMPLE;
  form.elements.completionMode.value = 'done-data';
  status.textContent = '示例已载入。';
  summary.textContent = '';
  rows.replaceChildren();
  errors.replaceChildren();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const result = inspectSse(form.elements.transcript.value, {
      chunkSize: Number(form.elements.chunkSize.value),
      completionMode: form.elements.completionMode.value,
    });
    status.dataset.state = result.errors.length ? 'error' : 'success';
    status.textContent = `${result.events.length} 个已派发事件 · ${result.errors.length} 个解析问题`;
    const completion = result.completionFound === null ? '未设置完成约定，无法判断整段输出是否完成。'
      : result.completionFound ? '检测到所选完成标记。' : '未检测到所选完成标记；不要将片段当作完整结果。';
    summary.textContent = `${completion}${result.eventsAfterCompletion ? ' 完成标记后仍有事件，请核对服务协议。' : ''}${result.trailingIncomplete ? ' 末尾缺少空行，最后一帧可能未派发。' : ''}${result.retryIntervals.length ? ` 服务方 retry 值：${result.retryIntervals.join(', ')} 毫秒。` : ''}`;
    rows.replaceChildren(...result.events.slice(0, 100).map((item, index) => {
      const row = document.createElement('tr');
      for (const value of [String(index + 1), item.event, item.id || '—', item.dataType, item.data.slice(0, 500)]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      }
      return row;
    }));
    errors.replaceChildren(...result.errors.map((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      return item;
    }));
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = error.message;
    summary.textContent = '';
    rows.replaceChildren();
    errors.replaceChildren();
  }
});

form.addEventListener('reset', () => {
  status.textContent = '等待输入';
  status.dataset.state = 'idle';
  summary.textContent = '';
  rows.replaceChildren();
  errors.replaceChildren();
});
