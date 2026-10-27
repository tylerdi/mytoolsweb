import test from 'node:test';
import assert from 'node:assert/strict';
import { compareJson, compareJsonText, buildDiffReport } from '../json-diff.mjs';

test('reports missing, added, type and value changes at JSON Pointer paths', () => {
  const result = compareJson(
    { id: 'req_42', usage: { input_tokens: 120, output_tokens: 64 }, finish_reason: 'stop' },
    { usage: { input_tokens: '120', output_tokens: 80 }, finish_reason: 'length', latency_ms: 1200 },
  );
  assert.deepEqual(result.changes.map(({ path, type }) => [path, type]), [
    ['/finish_reason', 'value'], ['/id', 'removed'], ['/latency_ms', 'added'],
    ['/usage/input_tokens', 'type'], ['/usage/output_tokens', 'value'],
  ]);
  assert.match(buildDiffReport(result), /数字 → 字符串/);
  assert.doesNotMatch(buildDiffReport(result), /req_42|1200|length/);
});

test('ignores object order, compares arrays by index and escapes pointer tokens', () => {
  const result = compareJson({ 'a/b': { '~x': [1, 2] }, z: true }, { z: true, 'a/b': { '~x': [2, 1] } });
  assert.deepEqual(result.changes.map(({ path }) => path), ['/a~1b/~0x/0', '/a~1b/~0x/1']);
  assert.equal(compareJson({ a: 1, b: 2 }, { b: 2, a: 1 }).changes.length, 0);
});

test('accepts one fenced JSON block and identifies invalid side', () => {
  assert.equal(compareJsonText('```json\n{"a":1}\n```', '{"a":1}').changes.length, 0);
  assert.throws(() => compareJsonText('{"a":1}', '{"a":}'), /当前 JSON/);
});

test('caps large comparisons instead of rendering unlimited rows', () => {
  const left = Array.from({ length: 300 }, () => 0);
  const right = Array.from({ length: 300 }, () => 1);
  const result = compareJson(left, right);
  assert.equal(result.changes.length, 200);
  assert.equal(result.truncated, true);
});

test('does not claim equality when an unchanged input exceeds the scan limit', () => {
  const values = Array.from({ length: 20005 }, () => 0);
  const result = compareJson(values, values);
  assert.equal(result.changes.length, 0);
  assert.equal(result.truncated, true);
  assert.match(buildDiffReport(result), /不能断定两份 JSON 相同/);
});
