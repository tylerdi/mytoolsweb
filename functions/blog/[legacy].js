import { gone } from '../_gone.js';

export function onRequest(context) {
  const name = String(context.params.legacy || '').replace(/\.html$/, '');
  const retired = new Set([
    'llm-json-errors', 'api-cost-guide', 'agent-tool-call', 'tool-arguments',
    'rate-limit-guide', 'streaming-guide', 'api-error-triage',
    'structured-output-contract', 'idempotent-retry', 'json-guide',
    'base64-guide', 'regex-guide',
  ]);
  return name.startsWith('blog-') || retired.has(name) ? gone() : context.next();
}
