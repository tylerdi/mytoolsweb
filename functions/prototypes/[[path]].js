import {gone} from '../_gone.js';

// Keep rule modules and illustrations used by the maintained games reachable.
// Development pages and project notes are not a second public website.
export function onRequest(context) {
  const path=new URL(context.request.url).pathname;
  if(path.endsWith('/') || /\.(html?|md)$/i.test(path) || !/\.[^/]+$/.test(path)) return gone();
  return context.next();
}
