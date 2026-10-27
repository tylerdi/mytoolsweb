import { diagnose } from './api-diagnostics.mjs';

const STATUS_LABELS = {
  '400': '400 请求格式错误',
  '401': '401 未验证',
  '403': '403 无权限',
  '408': '408 请求超时',
  '409': '409 状态冲突',
  '413': '413 请求体过大',
  '422': '422 参数语义错误',
  '429': '429 请求过多',
  '500': '500 服务端错误',
  '502': '502 网关错误',
  '503': '503 暂不可用',
  '504': '504 网关超时',
  timeout: '客户端超时 / 无 HTTP 响应',
  other: '其他状态',
};

function singleLine(value, fallback = '未记录') {
  return String(value ?? '').replace(/[\r\n\t\u0000-\u001f]+/g, ' ').trim().slice(0, 120) || fallback;
}

export function buildIncidentReport(input, now = new Date()) {
  const status = Object.hasOwn(STATUS_LABELS, input.status) ? input.status : 'other';
  const result = diagnose({
    status,
    hasSideEffect: Boolean(input.hasSideEffect),
    retryAfter: input.retryAfter,
  }, now.getTime());
  const retryAfter = singleLine(input.retryAfter, '未提供');
  const resultState = ['unknown', 'confirmed', 'failed'].includes(input.resultState)
    ? { unknown: '尚未核实', confirmed: '已确认成功', failed: '已确认失败' }[input.resultState]
    : '尚未核实';
  const lines = [
    '# API 故障记录',
    '',
    `- 记录时间（UTC）：${now.toISOString()}`,
    `- 操作：${singleLine(input.operation)}`,
    `- 服务 / 模型：${singleLine(input.provider)}`,
    `- 状态：${STATUS_LABELS[status]}`,
    `- 请求标识：${singleLine(input.requestId)}`,
    `- 错误代码：${singleLine(input.errorCode)}`,
    `- Retry-After：${retryAfter}`,
    `- 可能产生副作用：${input.hasSideEffect ? '是' : '否'}`,
    `- 业务结果：${resultState}`,
    '',
    `## 初步判断：${result.title}`,
    '',
    result.summary,
    '',
    '## 下一步',
    '',
    ...result.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    '## 核实记录',
    '',
    '- 实际结果：待人工填写',
    '- 证据位置：待人工填写（不要粘贴密钥、个人信息或完整提示词）',
    '- 负责人 / 后续动作：待人工填写',
    '',
    '此记录由 Tyler 工作台在浏览器本地生成。建议是排查起点；以供应商文档与业务日志为准。',
  ];
  return lines.join('\n');
}

if (typeof document !== 'undefined') {
  const form = document.querySelector('[data-incident-form]');
  if (form) {
    const output = document.querySelector('[data-incident-output]');
    const status = document.querySelector('[data-incident-status]');
    const copy = document.querySelector('[data-incident-copy]');
    const download = document.querySelector('[data-incident-download]');
    const samples = {
      rate: { status: '429', operation: 'GET /models', provider: '模型 API', requestId: 'req_demo_42', errorCode: 'rate_limit_exceeded', retryAfter: '30', hasSideEffect: false, resultState: 'failed' },
      timeout: { status: 'timeout', operation: 'create_report', provider: '业务工具', requestId: 'local_42', errorCode: '', retryAfter: '', hasSideEffect: true, resultState: 'unknown' },
      validation: { status: '400', operation: 'POST /responses', provider: '模型 API', requestId: 'req_demo_43', errorCode: 'invalid_request', retryAfter: '', hasSideEffect: false, resultState: 'failed' },
    };
    let report = '';

    function render() {
      const fields = form.elements;
      report = buildIncidentReport({
        status: fields.status.value,
        operation: fields.operation.value,
        provider: fields.provider.value,
        requestId: fields.requestId.value,
        errorCode: fields.errorCode.value,
        retryAfter: fields.retryAfter.value,
        hasSideEffect: fields.hasSideEffect.checked,
        resultState: fields.resultState.value,
      });
      output.textContent = report;
      status.textContent = '记录已生成';
      copy.disabled = false;
      download.disabled = false;
    }

    form.addEventListener('submit', (event) => { event.preventDefault(); render(); });
    const invalidate = () => {
      if (!report) return;
      report = '';
      output.textContent = '输入已变更，请重新生成故障记录。';
      status.textContent = '等待重新生成';
      copy.disabled = true;
      download.disabled = true;
    };
    form.addEventListener('input', invalidate);
    form.addEventListener('change', invalidate);
    document.querySelectorAll('[data-incident-sample]').forEach((button) => {
      button.addEventListener('click', () => {
        const sample = samples[button.dataset.incidentSample];
        if (!sample) return;
        for (const [name, value] of Object.entries(sample)) {
          if (name === 'hasSideEffect') form.elements[name].checked = value;
          else form.elements[name].value = value;
        }
        render();
      });
    });
    copy.addEventListener('click', async () => {
      if (!report) return;
      try {
        await navigator.clipboard.writeText(report);
        status.textContent = '已复制 Markdown';
      } catch {
        status.textContent = '复制失败，请直接选中下方文本';
      }
    });
    download.addEventListener('click', () => {
      if (!report) return;
      const url = URL.createObjectURL(new Blob([report], { type: 'text/markdown;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'api-incident.md';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
}
