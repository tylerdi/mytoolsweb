import { SCHEMA_SAMPLE, INSTANCE_SAMPLE } from './schema-samples.mjs';

const form = document.querySelector('[data-schema-form]');
const status = document.querySelector('[data-schema-status]');
const details = document.querySelector('[data-schema-errors]');
let worker;

function render(message, errors = [], state = 'idle') {
  status.textContent = message;
  status.dataset.state = state;
  details.replaceChildren(...errors.map((error) => {
    const item = document.createElement('li');
    item.textContent = error;
    return item;
  }));
}

document.querySelector('[data-schema-sample]').addEventListener('click', () => {
  form.elements.schema.value = SCHEMA_SAMPLE;
  form.elements.instance.value = INSTANCE_SAMPLE;
  render('示例已载入；order_id 的数字类型会失败。');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  worker?.terminate();
  const schema = form.elements.schema.value;
  const instance = form.elements.instance.value;
  if (!schema.trim() || !instance.trim()) return render('请同时输入 Schema 和待验证数据。', [], 'error');
  if (schema.length > 100_000 || instance.length > 100_000) return render('每个输入最多 100,000 字符。', [], 'error');
  worker = new Worker('/assets/labs/schema-worker.js', { type: 'module' });
  const current = worker;
  const timer = setTimeout(() => {
    if (worker !== current) return;
    current.terminate();
    worker = undefined;
    render('验证超时。请检查复杂正则、递归引用或缩小输入。', [], 'error');
  }, 2500);
  const finish = (message, errors, state) => {
    if (worker !== current) return;
    clearTimeout(timer);
    current.terminate();
    worker = undefined;
    render(message, errors, state);
  };
  current.onmessage = ({ data }) => {
    if (data.error) return finish(data.error, [], 'error');
    if (!data.result.schemaValid) return finish('Schema 本身不符合 2020-12 规范。', data.result.errors, 'error');
    finish(data.result.valid ? '数据符合 Schema。' : '数据不符合 Schema。', data.result.errors, data.result.valid ? 'success' : 'error');
  };
  current.onerror = () => finish('验证器加载失败，请刷新页面。', [], 'error');
  render('正在验证...');
  current.postMessage({ schema, instance });
});

form.addEventListener('reset', () => {
  worker?.terminate();
  worker = undefined;
  render('等待输入');
});
