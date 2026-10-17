import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMonthlyCost, MODEL_PRESETS } from '../model-cost.mjs';

test('calculates monthly input and output costs separately', () => {
  const result = calculateMonthlyCost({ requests: 1000, inputTokens: 500, outputTokens: 1000, inputRate: 1.5, outputRate: 9 });
  assert.equal(result.monthlyInputTokens, 500_000);
  assert.equal(result.monthlyOutputTokens, 1_000_000);
  assert.equal(result.inputCost, 0.75);
  assert.equal(result.outputCost, 9);
  assert.equal(result.total, 9.75);
});

test('accepts zero usage and rejects invalid quantities', () => {
  assert.equal(calculateMonthlyCost({ requests: 0, inputTokens: 0, outputTokens: 0, inputRate: 1, outputRate: 1 }).total, 0);
  assert.throws(() => calculateMonthlyCost({ requests: -1, inputTokens: 10, outputTokens: 10, inputRate: 1, outputRate: 1 }), RangeError);
  assert.throws(() => calculateMonthlyCost({ requests: 1.5, inputTokens: 10, outputTokens: 10, inputRate: 1, outputRate: 1 }), RangeError);
});

test('every preset has a named provider and source', () => {
  assert.ok(MODEL_PRESETS.every((model) => model.provider && model.source.startsWith('https://')));
});
