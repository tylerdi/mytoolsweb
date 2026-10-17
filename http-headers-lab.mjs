import { inspectHttpHeaders, HTTP_SAMPLE } from './http-headers-core.mjs';

const form = document.querySelector('[data-http-form]');
const status = document.querySelector('[data-http-status]');
const fields = document.querySelector('[data-http-fields]');
const steps = document.querySelector('[data-http-steps]');
const notes = document.querySelector('[data-http-notes]');
const copy = document.querySelector('[data-http-copy]');
let incidentNote = '';

document.querySelector('[data-http-sample]').addEventListener('click', () => {
  form.elements.response.value = HTTP_SAMPLE;
  form.elements.sideEffect.checked = false;
  status.textContent = '示例已载入。';
  fields.replaceChildren();
  steps.replaceChildren();
  notes.replaceChildren();
  copy.disabled = true;
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const result = inspectHttpHeaders(form.elements.response.value, { hasSideEffect: form.elements.sideEffect.checked });
    status.dataset.state = 'success';
    status.textContent = `${result.status} · ${result.advice.title}`;
    fields.replaceChildren(...result.fields.map(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const definition = document.createElement('dd');
      term.textContent = label;
      definition.textContent = value;
      row.append(term, definition);
      return row;
    }));
    steps.replaceChildren(...result.advice.steps.map((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      return item;
    }));
    notes.replaceChildren(...result.notes.map((note) => {
      const item = document.createElement('li');
      item.textContent = note;
      return item;
    }));
    incidentNote = `HTTP ${result.status}\n${result.fields.slice(1, 3).map(([label, value]) => `${label}: ${value}`).join('\n')}\n${result.advice.title}\n${result.advice.steps.join('\n')}`;
    copy.disabled = false;
  } catch (error) {
    status.dataset.state = 'error';
    status.textContent = error.message;
    fields.replaceChildren();
    steps.replaceChildren();
    notes.replaceChildren();
    copy.disabled = true;
  }
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(incidentNote);
    copy.textContent = '已复制';
  } catch {
    copy.textContent = '复制失败';
  }
  setTimeout(() => { copy.textContent = '复制诊断摘要'; }, 1500);
});

form.addEventListener('reset', () => {
  status.textContent = '等待输入';
  status.dataset.state = 'idle';
  fields.replaceChildren();
  steps.replaceChildren();
  notes.replaceChildren();
  incidentNote = '';
  copy.disabled = true;
});
