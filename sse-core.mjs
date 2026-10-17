import { createParser } from 'eventsource-parser';

export const SSE_SAMPLE = 'data: {"delta":"你"}\n\ndata: {"delta":"好"}\n\ndata: [DONE]\n\n';

export function inspectSse(input, { chunkSize = 7, completionMode = 'done-data' } = {}) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('请粘贴一段 SSE 文本。');
  if (input.length > 200_000) throw new Error('输入最多 200,000 字符。');
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 200_000) throw new Error('分块大小无效。');
  const events = [];
  const errors = [];
  const retryIntervals = [];
  const parser = createParser({
    maxBufferSize: 200_000,
    onEvent(event) {
      let dataType = '文本';
      const trimmed = event.data.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[') && trimmed !== '[DONE]') {
        try { JSON.parse(trimmed); dataType = 'JSON 有效'; }
        catch { dataType = '疑似 JSON，但解析失败'; }
      }
      events.push({ event: event.event || 'message', id: event.id || '', data: event.data, dataType });
    },
    onError(error) { errors.push(error.message || error.type || 'SSE 格式错误'); },
    onRetry(milliseconds) { retryIntervals.push(milliseconds); },
  });
  for (let index = 0; index < input.length; index += chunkSize) {
    parser.feed(input.slice(index, index + chunkSize));
  }
  const completionFound = completionMode === 'done-data'
    ? events.some((event) => event.data.trim() === '[DONE]')
    : completionMode === 'named-done'
      ? events.some((event) => event.event === 'done')
      : null;
  const completionIndex = completionMode === 'done-data'
    ? events.findIndex((event) => event.data.trim() === '[DONE]')
    : completionMode === 'named-done'
      ? events.findIndex((event) => event.event === 'done')
      : -1;
  const eventsAfterCompletion = completionIndex >= 0 && completionIndex < events.length - 1;
  const trailingIncomplete = !/(?:\r\n|\r|\n){2}$/.test(input);
  return { events, errors, retryIntervals, completionFound, eventsAfterCompletion, trailingIncomplete };
}
