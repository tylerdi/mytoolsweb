export function encodeBase64(text, urlSafe = false) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  }
  const encoded = btoa(binary);
  return urlSafe ? encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : encoded;
}

export function decodeBase64(value, urlSafe = false) {
  const input = value.trim();
  if (urlSafe) {
    if (!/^[A-Za-z0-9_-]*={0,2}$/.test(input) || input.length % 4 === 1) {
      throw new Error('Base64URL 字符或长度无效');
    }
  } else if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(input)) {
    throw new Error('标准 Base64 格式无效');
  }
  const normalized = urlSafe ? input.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '') : input;
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('数据能解码为字节，但不是 UTF-8 文本');
  }
}

export function formatTimestamp(value, unit = 'seconds') {
  if (!/^-?\d+$/.test(value.trim())) throw new Error('请输入整数时间戳');
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error('时间戳超出安全整数范围');
  const milliseconds = unit === 'seconds' ? number * 1000 : number;
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) throw new Error('时间超出浏览器支持范围');
  return date;
}

export function parseIsoTime(value) {
  const input = value.trim();
  const parts = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(?:Z|([+-])(\d{2}):(\d{2}))$/);
  if (!parts) {
    throw new Error('请输入带时区的 ISO 8601 时间，例如 2026-10-17T12:00:00+08:00');
  }
  const [, year, month, day, hour, minute, second, , offsetHour, offsetMinute] = parts;
  const leap = Number(year) % 4 === 0 && (Number(year) % 100 !== 0 || Number(year) % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (+month < 1 || +month > 12 || +day < 1 || +day > days[+month - 1] || +hour > 23 || +minute > 59 || +second > 59 || +(offsetHour || 0) > 23 || +(offsetMinute || 0) > 59) {
    throw new Error('日期或时区无效');
  }
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) throw new Error('日期或时区无效');
  return date;
}

export function describeTime(date) {
  return `UTC: ${date.toISOString()}\n本地: ${date.toLocaleString('zh-CN', { hour12: false })}\nUnix 秒: ${Math.floor(date.getTime() / 1000)}\nUnix 毫秒: ${date.getTime()}`;
}

if (typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);
  const show = (id, value, error = false) => {
    $(id).textContent = value;
    $(id).dataset.state = error ? 'error' : 'ready';
  };
  const execute = async (outputId, action) => {
    try { show(outputId, await action()); }
    catch (error) { show(outputId, error.message || '处理失败', true); }
  };

  $('base64-encode').addEventListener('click', () => execute('base64-result', () => encodeBase64($('base64-input').value, $('base64-mode').value === 'url')));
  $('base64-decode').addEventListener('click', () => execute('base64-result', () => decodeBase64($('base64-input').value, $('base64-mode').value === 'url')));
  $('url-encode').addEventListener('click', () => execute('url-result', () => encodeURIComponent($('url-input').value)));
  $('url-decode').addEventListener('click', () => execute('url-result', () => decodeURIComponent($('url-input').value)));
  $('timestamp-convert').addEventListener('click', () => execute('timestamp-result', () => describeTime(formatTimestamp($('timestamp-input').value, $('timestamp-unit').value))));
  $('iso-convert').addEventListener('click', () => execute('timestamp-result', () => describeTime(parseIsoTime($('iso-input').value))));
  $('hash-calculate').addEventListener('click', () => execute('hash-result', async () => {
    const bytes = new TextEncoder().encode($('hash-input').value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  }));
  $('uuid-generate').addEventListener('click', () => execute('uuid-result', () => {
    const count = Number($('uuid-count').value);
    if (!Number.isInteger(count) || count < 1 || count > 20) throw new Error('生成数量应为 1 到 20');
    return Array.from({ length: count }, () => crypto.randomUUID()).join('\n');
  }));

  let pendingWorker = null;
  $('regex-test').addEventListener('click', () => {
    if (pendingWorker) pendingWorker.terminate();
    const pattern = $('regex-pattern').value;
    const flags = $('regex-flags').value;
    const sample = $('regex-input').value;
    if (pattern.length > 300 || sample.length > 5000) {
      show('regex-result', '表达式最多 300 字符，测试文本最多 5,000 字符', true);
      return;
    }
    const worker = new Worker('/regex-worker.js');
    pendingWorker = worker;
    show('regex-result', '正在检查...');
    const finish = (message, error = false) => {
      if (pendingWorker !== worker) return;
      clearTimeout(timer);
      worker.terminate();
      pendingWorker = null;
      show('regex-result', message, error);
    };
    const timer = setTimeout(() => finish('表达式运行超时，请缩小输入或检查重复嵌套量词', true), 600);
    worker.onmessage = ({ data }) => finish(data.error || data.result, Boolean(data.error));
    worker.onerror = () => finish('正则测试未能运行', true);
    worker.postMessage({ pattern, flags, sample });
  });

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const text = $(button.dataset.copy).textContent;
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = '已复制';
        setTimeout(() => { button.textContent = '复制结果'; }, 1500);
      } catch {
        button.textContent = '复制失败';
        setTimeout(() => { button.textContent = '复制结果'; }, 1500);
      }
    });
  });
}
