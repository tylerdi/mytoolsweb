const RETRYABLE = new Set([429, 500, 502, 503, 504]);

export function parseRetryAfter(value, now = Date.now()) {
  const raw = String(value ?? '').trim();
  if (!raw) return { seconds: null, error: null };
  if (/^\d+$/.test(raw)) {
    const seconds = Number(raw);
    return Number.isSafeInteger(seconds)
      ? { seconds, error: null }
      : { seconds: null, error: '等待秒数超出可处理范围' };
  }
  // HTTP-date must use the IMF-fixdate form; Date.parse alone accepts unrelated formats.
  if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(raw)) {
    const date = Date.parse(raw);
    if (Number.isFinite(date)) return { seconds: Math.max(0, Math.ceil((date - now) / 1000)), error: null };
  }
  return { seconds: null, error: '格式无效：填写非负整数秒数或 GMT 格式的 HTTP 日期' };
}

export function diagnose({ status, hasSideEffect = false, retryAfter = '' }, now = Date.now()) {
  const code = status === 'timeout' ? 'timeout' : Number(status);
  const wait = parseRetryAfter(retryAfter, now);
  const result = { title: '', summary: '', steps: [], wait, retryable: false };

  if (code === 'timeout' || code === 408) {
    result.title = '完成状态未知';
    result.summary = '超时表示客户端没有及时拿到结果，不能据此断定服务端没有执行。';
    result.steps = ['记录请求时间、请求标识和超时发生的阶段。', '检查服务端日志或查询业务结果，确认操作是否已经完成。'];
    result.retryable = true;
  } else if (code === 429) {
    result.title = '请求被限流';
    result.summary = '先降低并发与请求速率；仅靠增加重试次数会放大拥堵。';
    result.steps = ['记录状态码、响应体中的错误类型、请求标识和当时并发量。', wait.seconds !== null ? `至少等待 ${wait.seconds} 秒后再考虑重试。` : '检查服务方是否提供重试时间；否则使用有限次数的退避与随机抖动。'];
    result.retryable = true;
  } else if (RETRYABLE.has(code)) {
    result.title = '服务端或网关暂时失败';
    result.summary = '检查供应商状态、请求标识和响应体；同一状态码不保证相同根因。';
    result.steps = ['先确认服务状态与错误响应体，记录请求标识。', code === 503 && wait.seconds !== null ? `服务方建议至少等待 ${wait.seconds} 秒。` : '对可安全重试的请求设置总时限、次数上限和退避。'];
    result.retryable = true;
  } else if (code === 400 || code === 422) {
    result.title = '请求内容需要修正';
    result.summary = '重复提交同一请求通常不会修复参数或字段问题。';
    result.steps = ['对照接口文档检查模型名、必填字段、类型、输入长度和请求体编码。', '用最小脱敏请求复现，并比较成功请求的结构。'];
  } else if (code === 401) {
    result.title = '身份验证失败';
    result.summary = '检查凭证是否存在、过期或发给了错误环境。';
    result.steps = ['在服务端核对凭证配置、请求头格式和目标环境。', '不要将密钥粘贴到此页、日志或工单；必要时轮换已暴露的密钥。'];
  } else if (code === 403) {
    result.title = '请求被拒绝访问';
    result.summary = '身份可能已识别，但没有该资源或操作的权限。';
    result.steps = ['核对项目、组织、模型访问权限和响应体中的具体错误代码。', '确认账户限制后再修改权限或联系服务方。'];
  } else if (code === 409) {
    result.title = '资源状态冲突';
    result.summary = '先查当前资源状态，再决定是否更新或重试。';
    result.steps = ['查看冲突对象、版本号或幂等键是否已被使用。', '刷新状态后按业务规则处理，避免重复创建。'];
  } else if (code === 413) {
    result.title = '请求体过大';
    result.summary = '检查服务方的请求体和模型上下文限制。';
    result.steps = ['量化原始字节数、输入 Token 和附件大小。', '缩减输入或按接口能力分批；不要对同一超大请求盲目重试。'];
  } else {
    result.title = '需要更多响应信息';
    result.summary = '仅凭状态码不足以确定根因。';
    result.steps = ['记录响应体中的错误代码、请求标识和供应商状态页。', '按该接口文档核对错误语义，再设计恢复策略。'];
  }

  if (result.retryable) {
    result.steps.push(hasSideEffect
      ? '此操作有副作用：先查询先前请求结果；只有确认幂等键或业务去重有效后才重新提交。'
      : '若确认是只读请求，可在次数和总时限内重试；每次失败都应停止继续放大并发。');
  }
  if (wait.error) result.steps.push(`Retry-After ${wait.error}；请核对原始响应头。`);
  return result;
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('[data-diagnostic-form]');
  if (form) {
    const title = document.querySelector('[data-diagnostic-title]');
    const summary = document.querySelector('[data-diagnostic-summary]');
    const steps = document.querySelector('[data-diagnostic-steps]');
    const render = () => {
      const result = diagnose({
        status: form.elements.status.value,
        hasSideEffect: form.elements.sideEffect.checked,
        retryAfter: form.elements.retryAfter.value,
      });
      title.textContent = result.title;
      summary.textContent = result.summary;
      steps.replaceChildren(...result.steps.map((step) => {
        const item = document.createElement('li');
        item.textContent = step;
        return item;
      }));
    };
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    render();
  }
}
