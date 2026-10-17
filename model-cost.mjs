export const PRICE_REVIEWED = '2026-10-17';

export const MODEL_PRESETS = [
  {
    id: 'gemini-35-flash-lite',
    name: 'Gemini 3.5 Flash-Lite',
    provider: 'Google',
    inputRate: 0.30,
    outputRate: 2.50,
    source: 'https://ai.google.dev/gemini-api/docs/pricing',
  },
  {
    id: 'gemini-35-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'Google',
    inputRate: 1.50,
    outputRate: 9.00,
    source: 'https://ai.google.dev/gemini-api/docs/pricing',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'Anthropic',
    inputRate: 2.00,
    outputRate: 10.00,
    source: 'https://platform.claude.com/docs/en/about-claude/pricing',
  },
];

export function calculateMonthlyCost({ requests, inputTokens, outputTokens, inputRate, outputRate }) {
  const numbers = [requests, inputTokens, outputTokens, inputRate, outputRate];
  if (numbers.some((value) => !Number.isFinite(value) || value < 0) || !Number.isInteger(requests)) {
    throw new RangeError('请求数须为非负整数，Token 和价格须为非负数。');
  }
  const monthlyInputTokens = requests * inputTokens;
  const monthlyOutputTokens = requests * outputTokens;
  const inputCost = monthlyInputTokens / 1_000_000 * inputRate;
  const outputCost = monthlyOutputTokens / 1_000_000 * outputRate;
  const total = inputCost + outputCost;
  if (![monthlyInputTokens, monthlyOutputTokens, total].every(Number.isFinite)) {
    throw new RangeError('输入值过大，无法可靠计算。');
  }
  return { monthlyInputTokens, monthlyOutputTokens, inputCost, outputCost, total, perRequest: requests ? total / requests : 0 };
}

function mountCalculator(form) {
  const model = form.querySelector('[name="model"]');
  const inputRate = form.querySelector('[name="inputRate"]');
  const outputRate = form.querySelector('[name="outputRate"]');
  const source = form.querySelector('[data-price-source]');
  const sourceLink = form.querySelector('[data-price-link]');
  const result = document.querySelector('[data-cost-result]');
  const compareBody = result.querySelector('[data-compare-body]');
  const error = form.querySelector('[data-cost-error]');
  let overridden = false;

  const syncPreset = () => {
    const preset = MODEL_PRESETS.find((item) => item.id === model.value);
    if (preset) {
      inputRate.value = preset.inputRate.toFixed(2);
      outputRate.value = preset.outputRate.toFixed(2);
      source.textContent = `${preset.provider} 官方标准文本费率 · 核对于 ${PRICE_REVIEWED}`;
      sourceLink.href = preset.source;
      sourceLink.hidden = false;
    } else {
      inputRate.value = '1.00';
      outputRate.value = '5.00';
      source.textContent = '自定义价格；请以实际供应商账单为准。';
      sourceLink.hidden = true;
    }
    overridden = false;
  };
  model.addEventListener('change', syncPreset);
  [inputRate, outputRate].forEach((field) => field.addEventListener('input', () => {
    if (model.value !== 'custom' && !overridden) {
      source.textContent = '价格已手动修改；当前计算使用输入框中的费率。';
      sourceLink.hidden = true;
      overridden = true;
    }
  }));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const data = calculateMonthlyCost({
        requests: Number(values.requests),
        inputTokens: Number(values.inputTokens),
        outputTokens: Number(values.outputTokens),
        inputRate: Number(values.inputRate),
        outputRate: Number(values.outputRate),
      });
      error.textContent = '';
      result.hidden = false;
      result.querySelector('[data-total]').textContent = `$${data.total.toFixed(2)}`;
      result.querySelector('[data-per-request]').textContent = `$${data.perRequest.toFixed(6)}`;
      result.querySelector('[data-input-cost]').textContent = `$${data.inputCost.toFixed(2)}`;
      result.querySelector('[data-output-cost]').textContent = `$${data.outputCost.toFixed(2)}`;
      result.querySelector('[data-input-volume]').textContent = data.monthlyInputTokens.toLocaleString('zh-CN');
      result.querySelector('[data-output-volume]').textContent = data.monthlyOutputTokens.toLocaleString('zh-CN');
      const inputShare = data.total ? data.inputCost / data.total * 100 : 0;
      result.querySelector('[data-input-bar]').style.width = `${inputShare}%`;
      result.querySelector('[data-output-bar]').style.width = `${100 - inputShare}%`;
      compareBody.replaceChildren(...MODEL_PRESETS.map((preset) => {
        const estimate = calculateMonthlyCost({
          requests: Number(values.requests),
          inputTokens: Number(values.inputTokens),
          outputTokens: Number(values.outputTokens),
          inputRate: preset.inputRate,
          outputRate: preset.outputRate,
        });
        const row = document.createElement('tr');
        const name = document.createElement('td');
        const link = document.createElement('a');
        link.href = preset.source;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = preset.name;
        name.appendChild(link);
        const rate = document.createElement('td');
        rate.textContent = `$${preset.inputRate.toFixed(2)} / $${preset.outputRate.toFixed(2)}`;
        const total = document.createElement('td');
        total.textContent = `$${estimate.total.toFixed(2)}`;
        row.append(name, rate, total);
        return row;
      }));
      window.trackToolEvent?.('cost_calculate_success');
    } catch (cause) {
      result.hidden = true;
      error.textContent = cause.message;
      window.trackToolEvent?.('cost_calculate_error');
    }
  });

  syncPreset();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-cost-form]').forEach(mountCalculator);
  });
}
