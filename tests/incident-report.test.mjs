import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIncidentReport } from '../incident-report.mjs';

const now = new Date('2026-10-27T08:00:00.000Z');

test('report preserves evidence and correct retry guidance for a 429', () => {
  const report = buildIncidentReport({ status: '429', operation: 'GET /models', provider: 'model API', requestId: 'req_demo_42', errorCode: 'rate_limit_exceeded', retryAfter: '30', hasSideEffect: false, resultState: 'failed' }, now);
  assert.match(report, /2026-10-27T08:00:00.000Z/);
  assert.match(report, /请求标识：req_demo_42/);
  assert.match(report, /至少等待 30 秒/);
  assert.match(report, /业务结果：已确认失败/);
});

test('a write timeout keeps result unknown and warns before retry', () => {
  const report = buildIncidentReport({ status: 'timeout', operation: 'create_report', hasSideEffect: true, resultState: 'unknown' }, now);
  assert.match(report, /无 HTTP 响应/);
  assert.match(report, /业务结果：尚未核实/);
  assert.match(report, /先查询先前请求结果/);
});

test('user fields cannot add extra report lines', () => {
  const report = buildIncidentReport({ status: '400', operation: 'POST /x\n- 业务结果：已确认成功', requestId: '\u0000\nsecret', resultState: 'failed' }, now);
  assert.match(report, /操作：POST \/x - 业务结果：已确认成功/);
  assert.match(report, /请求标识：secret/);
  assert.equal(report.match(/^- 业务结果：/gm)?.length, 1);
});
