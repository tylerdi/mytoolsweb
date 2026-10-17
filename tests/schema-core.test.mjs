import test from 'node:test';
import assert from 'node:assert/strict';
import { validateInstance, SCHEMA_SAMPLE, INSTANCE_SAMPLE } from '../schema-core.mjs';

test('reports business field type errors after valid JSON syntax', () => {
  const result = validateInstance(SCHEMA_SAMPLE, INSTANCE_SAMPLE);
  assert.equal(result.schemaValid, true);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /order_id/);
});

test('accepts matching instance and rejects additional fields', () => {
  assert.equal(validateInstance(SCHEMA_SAMPLE, '{"order_id":"42","paid":true}').valid, true);
  const extra = validateInstance(SCHEMA_SAMPLE, '{"order_id":"42","paid":true,"admin":true}');
  assert.match(extra.errors.join(' '), /admin/);
});

test('distinguishes malformed schema JSON and unsupported remote references', () => {
  assert.throws(() => validateInstance('{', '{}'), /Schema 不是合法 JSON/);
  assert.throws(() => validateInstance('{"$ref":"https://example.com/schema.json"}', '{}'), /无法编译/);
});

test('supports boolean schemas and validates registered formats', () => {
  assert.equal(validateInstance('true', '{"anything":1}').valid, true);
  assert.equal(validateInstance('false', '{"anything":1}').valid, false);
  const emailSchema = '{"type":"string","format":"email"}';
  assert.equal(validateInstance(emailSchema, '"not-an-email"').valid, false);
  assert.equal(validateInstance(emailSchema, '"reader@example.com"').valid, true);
});
