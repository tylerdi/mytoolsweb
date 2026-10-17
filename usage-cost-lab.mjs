import { analyzeUsageCsv, USAGE_SAMPLE } from './usage-cost-core.mjs';

const form = document.querySelector('[data-usage-form]');
const input = form.elements.csv;
const status = document.querySelector('[data-usage-status]');
const summary = document.querySelector('[data-usage-summary]');
const rows = document.querySelector('[data-usage-rows]');

document.querySelector('[data-usage-sample]').addEventListener('click', () => {
  input.value = USAGE_SAMPLE;
  form.elements.file.value = '';
  status.textContent = '示例已载入。';
  status.dataset.state = 'idle';
  summary.textContent = '';
  rows.replaceChildren();
});

form.elements.file.addEventListener('change', async () => {
  const file = form.elements.file.files?.[0];
  if (!file) return;
  if (file.size > 1_000_000) {
    status.textContent = '文件不能超过 1 MB。';
    status.dataset.state = 'error';
    return;
  }
  input.value = await file.text();
  status.textContent = `已读取 ${file.name}，仅在浏览器内分析。`;
  status.dataset.state = 'idle';
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const result = analyzeUsageCsv(input.value);
    status.textContent = `${result.rows.toLocaleString('zh-CN')} 条请求 · $${result.totalCost.toFixed(8)} USD`;
    status.dataset.state = 'success';
    summary.textContent = `输入 ${result.totalInput.toLocaleString('zh-CN')} Token · 输出 ${result.totalOutput.toLocaleString('zh-CN')} Token。预设费率核对日期：${result.priceReviewed}。`;
    rows.replaceChildren(...result.groups.map((group) => {
      const row = document.createElement('tr');
      for (const value of [group.model, String(group.rows), group.inputTokens.toLocaleString('zh-CN'), group.outputTokens.toLocaleString('zh-CN'), `$${group.inputRate} / $${group.outputRate}`, `$${group.cost.toFixed(8)}`]) {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      }
      return row;
    }));
  } catch (error) {
    status.textContent = error.message;
    status.dataset.state = 'error';
    summary.textContent = '';
    rows.replaceChildren();
  }
});

form.addEventListener('reset', () => {
  status.textContent = '等待输入';
  status.dataset.state = 'idle';
  summary.textContent = '';
  rows.replaceChildren();
});
