export const SCENARIOS = {
  success: {
    label: '正常返回',
    steps: [
      { stage: '用户请求', detail: '用户想查询订单 42 的状态。', trace: '用户: 帮我查一下订单 42 的状态。' },
      { stage: '模型选择工具', detail: '模型提出一次查询请求；此时它还没有执行数据库操作。', trace: '{"tool":"get_order","arguments":{"order_id":"42"}}' },
      { stage: '应用校验参数', detail: '服务端确认 order_id 是允许的非空字符串，再决定是否调用工具。', trace: 'validate({order_id:"42"}) → passed' },
      { stage: '工具返回结果', detail: '应用执行只读查询，并把结果关联到这一次调用。', trace: '{"call_id":"call_42","result":{"status":"已发货"}}' },
      { stage: '模型组织回答', detail: '模型收到工具结果后，才能向用户报告状态。', trace: '回答: 订单 42 已发货。' },
    ],
  },
  invalid: {
    label: '参数不合法',
    steps: [
      { stage: '用户请求', detail: '用户没有提供可查询的订单号。', trace: '用户: 帮我查一下订单。' },
      { stage: '模型选择工具', detail: '模型可能生成缺少必要字段的参数。', trace: '{"tool":"get_order","arguments":{"order_id":null}}' },
      { stage: '应用拒绝执行', detail: '参数校验失败，数据库查询不会执行。', trace: 'validate({order_id:null}) → rejected: order_id must be a string' },
      { stage: '请求补充信息', detail: '把失败原因反馈给模型或直接让用户补充订单号。', trace: '回答: 请提供订单号，我再帮你查询。' },
    ],
  },
  timeout: {
    label: '工具超时',
    steps: [
      { stage: '用户请求', detail: '用户提供了合法的订单号。', trace: '用户: 查一下订单 42。' },
      { stage: '模型选择工具', detail: '模型提出一次只读查询。', trace: '{"tool":"get_order","arguments":{"order_id":"42"}}' },
      { stage: '应用执行查询', detail: '查询超过预设超时时间。不能把超时当作“订单不存在”。', trace: 'get_order("42") → timeout after 5 s' },
      { stage: '有限次重试', detail: '只读且可安全重试的操作可以按策略重试；写操作要先检查幂等性。', trace: 'retry 1/2 → get_order("42")' },
      { stage: '仍失败则说明', detail: '如果再次超时，返回明确的暂时性错误并保留追踪信息。', trace: '回答: 查询暂时超时，请稍后再试。' },
    ],
  },
};

export function getScenario(id) {
  return SCENARIOS[id] || SCENARIOS.success;
}

function mountLab(root) {
  const select = root.querySelector('[data-scenario]');
  const counter = root.querySelector('[data-step-counter]');
  const stage = root.querySelector('[data-step-stage]');
  const detail = root.querySelector('[data-step-detail]');
  const trace = root.querySelector('[data-step-trace]');
  const timeline = root.querySelector('[data-timeline]');
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  let index = 0;

  const render = () => {
    const steps = getScenario(select.value).steps;
    const item = steps[index];
    counter.textContent = `${index + 1} / ${steps.length}`;
    stage.textContent = item.stage;
    detail.textContent = item.detail;
    trace.textContent = item.trace;
    previous.disabled = index === 0;
    next.disabled = index === steps.length - 1;
    timeline.replaceChildren(...steps.map((step, position) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `${position + 1}. ${step.stage}`;
      button.className = position === index ? 'active' : '';
      button.setAttribute('aria-current', position === index ? 'step' : 'false');
      button.addEventListener('click', () => { index = position; render(); });
      return button;
    }));
  };
  select.addEventListener('change', () => { index = 0; render(); window.trackToolEvent?.('agent_scenario_select'); });
  previous.addEventListener('click', () => { if (index > 0) { index--; render(); } });
  next.addEventListener('click', () => { if (index < getScenario(select.value).steps.length - 1) { index++; render(); } });
  render();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-agent-lab]').forEach(mountLab);
  });
}
