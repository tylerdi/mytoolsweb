import { gone } from '../../_gone.js';

export function onRequest(context) {
  const name = String(context.params.legacy || '');
  return name.startsWith('ai-daily-') ? gone() : context.next();
}
