import { gone } from '../_gone.js';

// The archived site remains in Git, but its URLs no longer serve content.
export function onRequest() {
  return gone();
}
