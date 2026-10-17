import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectJsonOutput } from '../json-output.mjs';

test('accepts JSON inside one code fence without parsing surrounding prose', () => {
  const result = inspectJsonOutput('结果如下:\n```json\n{"ok":true,"items":[1,2]}\n```');
  assert.equal(result.ok, true);
  assert.equal(result.extracted, true);
  assert.equal(result.compact, '{"ok":true,"items":[1,2]}');
});

test('reports malformed JSON without silently repairing it', () => {
  const result = inspectJsonOutput('{"ok":true,}');
  assert.equal(result.ok, false);
  assert.match(result.hint, /末尾逗号/);
});

test('keeps valid scalar JSON and does not interpret extra text as data', () => {
  assert.equal(inspectJsonOutput('0').formatted, '0');
  assert.equal(inspectJsonOutput('not json {"ok":true}').ok, false);
});
