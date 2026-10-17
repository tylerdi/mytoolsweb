import { gone } from '../_gone.js';

const RETIRED = new Set(['ai-image-generator', 'ai-translation', 'ai-voice-generator']);

export function onRequest(context) {
  const name = String(context.params.legacy || '').replace(/\.html$/, '');
  return RETIRED.has(name) ? gone() : context.next();
}
