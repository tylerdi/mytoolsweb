import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectHttpHeaders, HTTP_SAMPLE } from '../http-headers-core.mjs';

test('extracts retry timing and request ID without echoing the response body', () => {
  const result = inspectHttpHeaders(HTTP_SAMPLE);
  assert.equal(result.status, 429);
  assert.match(result.advice.steps.join(' '), /30 秒/);
  assert.ok(result.fields.some(([name, value]) => name === '请求 ID' && value === 'req_demo_42'));
  assert.doesNotMatch(JSON.stringify(result), /rate_limit_exceeded/);
});

test('warns about cached responses and protects side-effecting requests', () => {
  const result = inspectHttpHeaders('HTTP/2 503\nAge: 120\nCache-Control: public\n\n', { hasSideEffect: true });
  assert.match(result.notes.join(' '), /缓存驻留时间/);
  assert.match(result.advice.steps.join(' '), /幂等键/);
});

test('rejects malformed status lines and folded headers', () => {
  assert.throws(() => inspectHttpHeaders('429 Too Many Requests\n'), /HTTP 状态行/);
  assert.throws(() => inspectHttpHeaders('HTTP/1.1 200 OK\n bad: value\n'), /折叠响应头/);
});
