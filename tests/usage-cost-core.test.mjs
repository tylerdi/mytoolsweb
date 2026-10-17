import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeUsageCsv, USAGE_SAMPLE } from '../usage-cost-core.mjs';

test('sums mixed model rows with preset and explicit per-million-token rates', () => {
  const result = analyzeUsageCsv(USAGE_SAMPLE);
  assert.equal(result.rows, 3);
  assert.equal(result.totalInput, 2200);
  assert.equal(result.totalOutput, 2100);
  assert.ok(Math.abs(result.totalCost - 0.0222) < 1e-10);
  assert.equal(result.groups.length, 2);
});

test('accepts quoted CSV fields and rejects unknown models without rates', () => {
  const quoted = analyzeUsageCsv('model,input_tokens,output_tokens,input_rate,output_rate\n"my, model",100,200,1,2');
  assert.equal(quoted.rows, 1);
  assert.equal(quoted.groups[0].model, 'my, model');
  assert.throws(() => analyzeUsageCsv('model,input_tokens,output_tokens\nunknown,100,200'), /无预设费率/);
});

test('rejects missing token counts and incomplete custom pricing', () => {
  assert.throws(() => analyzeUsageCsv('model,input_tokens,output_tokens\ncustom,,200'), /input_tokens/);
  assert.throws(() => analyzeUsageCsv('model,input_tokens,output_tokens,input_rate\ncustom,100,200,1'), /同时填写两种费率/);
  assert.throws(() => analyzeUsageCsv('model,input_tokens,output_tokens,input_rate,output_rate\ncustom,9007199254740991,0,0,0\ncustom,1,0,0,0'), /可靠计算范围/);
});
