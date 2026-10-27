import { gone } from '../_gone.js';

export function onRequest(context) {
  const name = String(context.params.legacy || '');
  return name.startsWith('blog-') ? gone() : context.next();
}
