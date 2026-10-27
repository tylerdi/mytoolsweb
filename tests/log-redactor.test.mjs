import test from 'node:test';
import assert from 'node:assert/strict';
import { redactEvidence } from '../log-redactor.mjs';

test('masks sensitive JSON keys at any depth and preserves useful evidence', () => {
  const input = JSON.stringify({ request_id: 'req_42', nested: [{ Authorization: 'Bearer abcdefghijklmnop', 'X-API-Key': 'sk-12345678901234567890', status: 429 }], email: 'dev@example.com' });
  const result = redactEvidence(input);
  assert.equal(result.structured, true);
  assert.equal(result.counts.fields, 2);
  assert.equal(result.counts.emails, 1);
  assert.match(result.text, /req_42|429/);
  assert.doesNotMatch(result.text, /abcdefghijklmnop|1234567890|dev@example.com/);
  assert.doesNotThrow(() => JSON.parse(result.text));
});

test('masks free-form headers, query assignments and recognizable tokens', () => {
  const result = redactEvidence('Authorization: Bearer abcdefghijklmnop\nCookie: session=secret\nGET /v1?api_key=abcd1234&mode=test\nkey sk-12345678901234567890\ncontact dev@example.com');
  assert.equal(result.structured, false);
  assert.equal(result.counts.headers, 2);
  assert.equal(result.counts.assignments, 1);
  assert.equal(result.counts.tokens, 1);
  assert.equal(result.counts.emails, 1);
  assert.match(result.text, /mode=test/);
  assert.doesNotMatch(result.text, /abcdefghijklmnop|session=secret|abcd1234|1234567890|dev@example.com/);
});

test('rejects empty and oversized input without claiming complete protection', () => {
  assert.throws(() => redactEvidence(' '), /请先粘贴/);
  assert.throws(() => redactEvidence('x'.repeat(100001)), /最多/);
  assert.equal(redactEvidence('status=429').counts.tokens, 0);
});

test('masks quoted and colon-separated assignments in incomplete logs', () => {
  const result = redactEvidence('api_key: secret123\npassword="hello world"\nrequest_id: req_42');
  assert.equal(result.counts.assignments, 2);
  assert.doesNotMatch(result.text, /secret123|hello world/);
  assert.match(result.text, /req_42/);
});
