import { gone } from './_gone.js';

const RETIRED = new Set([
  'agent-map', 'ai-debate', 'ai-fun', 'ai-learn', 'ai-models', 'ai-prompt',
  'ai-tools', 'changelog', 'daily-news', 'daily-wallpaper', 'deep-sea-museum',
  'gallery', 'grocery', 'ideas', 'mystery-box', 'resources', 'story-radio',
  'tool', 'tree-hole',
]);

export function onRequest(context) {
  const name = String(context.params.legacy || '').replace(/\.html$/, '');
  return RETIRED.has(name) ? gone() : context.next();
}
