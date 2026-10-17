import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectSse, SSE_SAMPLE } from '../sse-core.mjs';

test('events remain the same across arbitrary network chunk boundaries', () => {
  const oneByte = inspectSse(SSE_SAMPLE, { chunkSize: 1 });
  const wide = inspectSse(SSE_SAMPLE, { chunkSize: 200 });
  assert.deepEqual(oneByte.events, wide.events);
  assert.equal(oneByte.events.length, 3);
  assert.equal(oneByte.completionFound, true);
  assert.equal(oneByte.trailingIncomplete, false);
});

test('a stream without the selected completion marker is not reported complete', () => {
  const result = inspectSse('data: {"delta":"hi"}\n\n', { completionMode: 'done-data' });
  assert.equal(result.completionFound, false);
  assert.equal(result.events[0].dataType, 'JSON 有效');
  assert.equal(inspectSse('event: done\ndata: ok\n\n', { completionMode: 'named-done' }).completionFound, true);
});

test('flags trailing fragments and invalid JSON-like event data', () => {
  const result = inspectSse('data: {oops}\n\ndata: {"delta":"incomplete"');
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].dataType, '疑似 JSON，但解析失败');
  assert.equal(result.trailingIncomplete, true);
});

test('flags events after the selected completion marker', () => {
  const result = inspectSse('data: [DONE]\n\ndata: unexpected\n\n');
  assert.equal(result.completionFound, true);
  assert.equal(result.eventsAfterCompletion, true);
});
