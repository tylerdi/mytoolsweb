import { gone } from './_gone.js';

const RETIRED = new Set([
  'agent-map', 'ai-debate', 'ai-fun', 'ai-learn', 'ai-models', 'ai-prompt',
  'ai-tools', 'ai-chat', 'ai-image', 'ai-service', 'ai-tts', 'ai-voice-to-text',
  'changelog', 'daily-news', 'daily-wallpaper', 'deep-sea-museum',
  'gallery', 'grocery', 'ideas', 'mystery-box', 'resources', 'story-radio',
  'tool', 'tree-hole', 'tools', 'json-output', 'json-diff', 'log-redactor',
  'ai-cost', 'agent-lab', 'api-diagnostics', 'incident-report',
  'schema-check', 'sse-inspector', 'http-headers', 'usage-cost',
]);

export function onRequest(context) {
  const name = String(context.params.legacy || '').replace(/\.html$/, '');
  return RETIRED.has(name) ? gone() : context.next();
}
