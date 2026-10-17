import { diagnose } from './api-diagnostics.mjs';

export const HTTP_SAMPLE = `HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-Request-ID: req_demo_42
Content-Type: application/json

{"error":{"code":"rate_limit_exceeded"}}`;

export function inspectHttpHeaders(raw, { hasSideEffect = false, now = Date.now() } = {}) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('请粘贴 HTTP 状态行和响应头。');
  if (raw.length > 30_000) throw new Error('响应文本最多 30,000 字符。');
  const lines = raw.split(/\r?\n/);
  const statusLine = lines.shift().trim();
  const match = statusLine.match(/^HTTP\/\d(?:\.\d)?\s+(\d{3})(?:\s+.*)?$/i);
  if (!match || Number(match[1]) < 100 || Number(match[1]) > 599) {
    throw new Error('第一行应为 HTTP 状态行，例如 HTTP/1.1 429 Too Many Requests。');
  }
  const headers = new Headers();
  let count = 0;
  for (const line of lines) {
    if (!line.trim()) break;
    if (++count > 100) throw new Error('响应头最多 100 行。');
    if (/^[ \t]/.test(line)) throw new Error('不接受已弃用的折叠响应头。');
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`第 ${count + 1} 行不是有效的响应头。`);
    try { headers.append(line.slice(0, separator).trim(), line.slice(separator + 1).trim()); }
    catch { throw new Error(`第 ${count + 1} 行的响应头名称或内容无效。`); }
  }
  const status = Number(match[1]);
  const advice = diagnose({ status, hasSideEffect, retryAfter: headers.get('retry-after') || '' }, now);
  const requestId = ['x-request-id', 'request-id', 'x-correlation-id', 'x-amzn-requestid', 'cf-ray']
    .map((name) => headers.get(name)).find(Boolean) || '';
  const fields = [
    ['状态', String(status)],
    ['Retry-After', headers.get('retry-after') || '未提供'],
    ['请求 ID', requestId || '未发现'],
    ['Content-Type', headers.get('content-type') || '未提供'],
    ['RateLimit-Remaining', headers.get('ratelimit-remaining') || headers.get('x-ratelimit-remaining-requests') || '未提供'],
    ['Cache-Control', headers.get('cache-control') || '未提供'],
    ['Age', headers.get('age') || '未提供'],
    ['CF-Cache-Status', headers.get('cf-cache-status') || '未提供'],
  ];
  const notes = [];
  if (status === 429 && !headers.has('retry-after')) notes.push('429 没有 Retry-After；具体退避时间仍需按服务方文档决定。');
  if (headers.get('content-type')?.toLowerCase().includes('text/event-stream')) notes.push('这是 SSE 响应；如需检查事件与完成标记，请打开流式事件工具。');
  if (headers.has('age')) notes.push('Age 是缓存驻留时间线索，不能单独确定是哪一层缓存。');
  return { status, fields, advice, notes };
}
