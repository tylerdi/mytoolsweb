// functions/api/v1/models.js
// MIMO API 中转站 — 模型列表
// GET /api/v1/models
// 兼容 OpenAI Models API 格式

import { corsHeaders, corsResponse } from './metapi-auth.js';

// 兼容别名（用户可用 GPT/Claude 模型名调用，底层走 MIMO）
const MODEL_ALIASES = {
  'gpt-4o':            'mimo-v2-pro',
  'gpt-4o-mini':       'mimo-v2-flash',
  'gpt-4':             'mimo-v2.5-pro',
  'gpt-3.5-turbo':     'mimo-v2-flash',
  'claude-3.5-sonnet': 'mimo-v2-pro',
  'claude-3-haiku':    'mimo-v2-flash',
};

// 中转站提供的模型列表（带定价信息）
const MODELS = [
  {
    id: 'mimo-v2-flash',
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo',
    context_length: 256000,
    max_tokens: 256000,
    pricing: { input: 0.5, output: 1.0, unit: 'per_million_tokens', currency: 'CNY' },
    description: '快速轻量模型，适合日常对话',
  },
  {
    id: 'mimo-v2-pro',
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo',
    context_length: 1048576,
    max_tokens: 1048576,
    pricing: { input: 2.0, output: 5.0, unit: 'per_million_tokens', currency: 'CNY' },
    description: '专业级模型，复杂推理能力强',
  },
  {
    id: 'mimo-v2-omni',
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo',
    context_length: 256000,
    max_tokens: 256000,
    pricing: { input: 2.0, output: 5.0, unit: 'per_million_tokens', currency: 'CNY' },
    description: '多模态模型，支持图片理解',
  },
  {
    id: 'mimo-v2.5',
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo',
    context_length: 1048576,
    max_tokens: 1048576,
    pricing: { input: 3.0, output: 6.0, unit: 'per_million_tokens', currency: 'CNY' },
    description: '2.5代基础模型，性能均衡',
  },
  {
    id: 'mimo-v2.5-pro',
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo',
    context_length: 1048576,
    max_tokens: 1048576,
    pricing: { input: 5.0, output: 10.0, unit: 'per_million_tokens', currency: 'CNY' },
    description: '2.5代旗舰模型，最强推理能力',
  },
  {
    id: 'mimo-v2-tts',
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo',
    context_length: 8192,
    max_tokens: 8192,
    pricing: { input: 0.01, output: 0, unit: 'per_thousand_chars', currency: 'CNY' },
    description: '文字转语音模型',
  },
];

export async function onRequestGet(context) {
  // 生成别名模型条目
  const aliasModels = Object.entries(MODEL_ALIASES).map(([alias, realModel]) => ({
    id: alias,
    object: 'model',
    created: 1700000000,
    owned_by: 'mimo (alias)',
    context_length: 0,
    max_tokens: 0,
    _alias_for: realModel,
  }));

  return new Response(JSON.stringify({
    object: 'list',
    data: [...MODELS, ...aliasModels],
  }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

export async function onRequestOptions() {
  return corsResponse();
}
