import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeBase64, decodeBase64, formatTimestamp, parseIsoTime, describeTime } from '../tools-core.mjs';

test('UTF-8 text round-trips in both Base64 alphabets', () => {
  assert.equal(encodeBase64('你好'), '5L2g5aW9');
  assert.equal(decodeBase64('5L2g5aW9'), '你好');
  assert.equal(encodeBase64('f'), 'Zg==');
  assert.equal(encodeBase64('f', true), 'Zg');
  assert.equal(decodeBase64('Zg', true), 'f');
  const longText = '中'.repeat(20000);
  assert.equal(decodeBase64(encodeBase64(longText)), longText);
});

test('decoder distinguishes malformed Base64 from non-UTF-8 bytes', () => {
  assert.throws(() => decodeBase64('Zg='), /格式无效/);
  assert.throws(() => decodeBase64('a', true), /长度无效/);
  assert.throws(() => decodeBase64('/w=='), /不是 UTF-8 文本/);
});

test('timestamp conversion requires explicit units and timezone', () => {
  assert.equal(formatTimestamp('0').toISOString(), '1970-01-01T00:00:00.000Z');
  assert.equal(formatTimestamp('1000', 'milliseconds').toISOString(), '1970-01-01T00:00:01.000Z');
  assert.equal(parseIsoTime('2026-10-17T12:00:00+08:00').toISOString(), '2026-10-17T04:00:00.000Z');
  assert.match(describeTime(formatTimestamp('0')), /Unix 毫秒: 0/);
  assert.throws(() => parseIsoTime('2026-10-17 12:00:00'), /带时区/);
  assert.throws(() => parseIsoTime('2026-02-30T12:00:00Z'), /日期或时区无效/);
  assert.throws(() => formatTimestamp('1.5'), /整数时间戳/);
});
