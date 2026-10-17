import Papa from 'papaparse';
import { MODEL_PRESETS, PRICE_REVIEWED, calculateMonthlyCost } from './model-cost.mjs';

export const USAGE_SAMPLE = `model,input_tokens,output_tokens,input_rate,output_rate
gemini-35-flash,500,1000,,
gemini-35-flash,700,600,,
custom,1000,500,1.5,9`;

function tokenCount(value, row, field) {
  if (!/^(0|[1-9]\d*)$/.test(String(value ?? '').trim())) {
    throw new Error(`第 ${row} 行 ${field} 应为非负整数。`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error(`第 ${row} 行 ${field} 超出安全范围。`);
  return number;
}

function price(value, row, field) {
  if (String(value ?? '').trim() === '') throw new Error(`第 ${row} 行缺少 ${field}。`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`第 ${row} 行 ${field} 应为非负数。`);
  return number;
}

export function analyzeUsageCsv(csvText) {
  if (typeof csvText !== 'string' || !csvText.trim()) throw new Error('请粘贴 CSV 或选择本地文件。');
  if (csvText.length > 1_000_000) throw new Error('CSV 最多 1,000,000 字符。');
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (name) => name.trim().toLowerCase(),
  });
  if (parsed.errors.length) throw new Error(`CSV 格式错误：${parsed.errors[0].message}`);
  for (const name of ['model', 'input_tokens', 'output_tokens']) {
    if (!parsed.meta.fields?.includes(name)) throw new Error(`CSV 缺少列 ${name}。`);
  }
  if (parsed.data.length === 0) throw new Error('CSV 没有用量记录。');
  if (parsed.data.length > 10_000) throw new Error('最多分析 10,000 条记录。');

  const groups = new Map();
  let totalInput = 0;
  let totalOutput = 0;
  let totalCost = 0;
  parsed.data.forEach((record, index) => {
    const row = index + 2;
    const model = String(record.model || '').trim();
    if (!model) throw new Error(`第 ${row} 行缺少 model。`);
    const inputTokens = tokenCount(record.input_tokens, row, 'input_tokens');
    const outputTokens = tokenCount(record.output_tokens, row, 'output_tokens');
    const preset = MODEL_PRESETS.find((item) => item.id === model);
    const inputProvided = String(record.input_rate ?? '').trim() !== '';
    const outputProvided = String(record.output_rate ?? '').trim() !== '';
    if (inputProvided !== outputProvided) throw new Error(`第 ${row} 行须同时填写两种费率。`);
    if (!preset && !inputProvided) throw new Error(`第 ${row} 行模型 ${model} 无预设费率；请填写 input_rate 和 output_rate。`);
    const inputRate = inputProvided ? price(record.input_rate, row, 'input_rate') : preset.inputRate;
    const outputRate = outputProvided ? price(record.output_rate, row, 'output_rate') : preset.outputRate;
    const estimate = calculateMonthlyCost({ requests: 1, inputTokens, outputTokens, inputRate, outputRate });
    const key = `${model}\0${inputRate}\0${outputRate}`;
    if (!groups.has(key)) groups.set(key, {
      model: preset?.name || model, inputRate, outputRate, rows: 0, inputTokens: 0, outputTokens: 0, cost: 0,
    });
    const group = groups.get(key);
    group.rows += 1;
    group.inputTokens += inputTokens;
    group.outputTokens += outputTokens;
    group.cost += estimate.total;
    totalInput += inputTokens;
    totalOutput += outputTokens;
    totalCost += estimate.total;
    if (![group.inputTokens, group.outputTokens, totalInput, totalOutput].every(Number.isSafeInteger)
      || ![group.cost, totalCost].every(Number.isFinite)) {
      throw new Error('总用量超出可靠计算范围。');
    }
  });
  return { rows: parsed.data.length, totalInput, totalOutput, totalCost, groups: [...groups.values()], priceReviewed: PRICE_REVIEWED };
}
