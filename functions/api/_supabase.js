// functions/api/_supabase.js
// Supabase 客户端（Cloudflare Pages Functions 共用）

const SUPABASE_URL = 'https://twyosmombfrcheyjujvb.supabase.co';

// 从环境变量获取 Supabase Key
function getSupabaseKey(env) {
  // Cloudflare Pages: 通过 context.env 传入
  if (env && env.SUPABASE_ANON_KEY) return env.SUPABASE_ANON_KEY;
  // 全局变量兼容
  if (typeof SUPABASE_ANON_KEY !== 'undefined') return SUPABASE_ANON_KEY;
  // Node.js 环境
  if (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) return process.env.SUPABASE_ANON_KEY;
  return '';
}

export async function supabaseQuery(table, options = {}) {
  const { method = 'GET', body, filters = {}, select = '*', order, limit, offset, extraHeaders = {}, env } = options;

  const SUPABASE_KEY = getSupabaseKey(env);

  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();

  if (select !== '*') params.append('select', select);
  for (const [key, val] of Object.entries(filters)) {
    params.append(key, val);
  }
  if (order) params.append('order', order);
  if (limit) params.append('limit', limit.toString());
  if (offset) params.append('offset', offset.toString());

  const qs = params.toString();
  if (qs) url += '?' + qs;

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  // 清理 undefined
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

  // 自动添加 Prefer header
  if (method === 'POST' && !headers['Prefer']) {
    headers['Prefer'] = 'return=representation';
  }
  if (method === 'PATCH' && !headers['Prefer']) {
    headers['Prefer'] = 'return=representation';
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${res.status} ${err}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// 创建绑定 env 的 db 实例
export function createDb(env) {
  return {
    get: (table, opts) => supabaseQuery(table, { method: 'GET', env, ...opts }),
    insert: (table, body) => supabaseQuery(table, { method: 'POST', body, env }),
    update: (table, body, filters) => supabaseQuery(table, { method: 'PATCH', body, filters, env }),
    upsert: (table, body) => supabaseQuery(table, { method: 'POST', body, env, extraHeaders: { 'Prefer': 'return=representation,resolution=merge-duplicates' } }),
    delete: (table, filters) => supabaseQuery(table, { method: 'DELETE', filters, env }),
  };
}

// 向后兼容：不带 env 的 db（用于已有代码过渡）
export const db = {
  get: (table, opts) => supabaseQuery(table, { method: 'GET', ...opts }),
  insert: (table, body) => supabaseQuery(table, { method: 'POST', body }),
  update: (table, body, filters) => supabaseQuery(table, { method: 'PATCH', body, filters }),
  upsert: (table, body) => supabaseQuery(table, { method: 'POST', body, extraHeaders: { 'Prefer': 'return=representation,resolution=merge-duplicates' } }),
  delete: (table, filters) => supabaseQuery(table, { method: 'DELETE', filters }),
};
