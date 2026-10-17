import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnose, parseRetryAfter } from '../api-diagnostics.mjs';

test('Retry-After accepts whole seconds and RFC HTTP dates, rejects ambiguous values', () => {
  const now = Date.parse('Wed, 21 Oct 2026 07:27:30 GMT');
  assert.equal(parseRetryAfter('30', now).seconds, 30);
  assert.equal(parseRetryAfter('Wed, 21 Oct 2026 07:28:00 GMT', now).seconds, 30);
  assert.equal(parseRetryAfter('Wed, 21 Oct 2026 07:27:00 GMT', now).seconds, 0);
  assert.match(parseRetryAfter('1.5', now).error, /格式无效/);
  assert.match(parseRetryAfter('2026-10-21', now).error, /格式无效/);
});

test('429 guidance honors wait while protecting side-effecting operations', () => {
  const read = diagnose({ status: '429', retryAfter: '30' });
  assert.match(read.steps.join(' '), /30 秒/);
  assert.match(read.steps.join(' '), /只读请求/);
  const write = diagnose({ status: '429', retryAfter: '30', hasSideEffect: true });
  assert.match(write.steps.join(' '), /幂等键/);
  assert.doesNotMatch(write.steps.join(' '), /只读请求/);
});

test('timeout does not claim the server failed to execute a write', () => {
  const result = diagnose({ status: 'timeout', hasSideEffect: true });
  assert.match(result.summary, /不能据此断定/);
  assert.match(result.steps.join(' '), /先查询先前请求结果/);
});

test('invalid parameters do not produce automatic retry advice', () => {
  const result = diagnose({ status: '400' });
  assert.equal(result.retryable, false);
  assert.match(result.steps.join(' '), /最小脱敏请求/);
});
