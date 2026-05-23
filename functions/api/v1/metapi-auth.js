// functions/api/_metapi-auth.js
// MIMO API 中转站 — API Key 鉴权中间件

import { supabaseQuery } from '../_supabase.js';

// SHA-256 hash（Cloudflare Workers 内置 crypto）
async function sha256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 从请求中提取 API Key
function extractApiKey(request) {
  // Authorization: Bearer mk_xxxx
  const auth = request.headers.get('Authorization');
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  // X-API-Key: mk_xxxx
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) return apiKey.trim();
  // Query param: ?api_key=mk_xxxx
  const url = new URL(request.url);
  return url.searchParams.get('api_key');
}

// 验证 API Key，返回用户信息
// 返回 { valid, userId, keyId, error, status }
export async function validateApiKey(request, env) {
  const key = extractApiKey(request);

  if (!key) {
    return { valid: false, error: 'Missing API key. Provide via Authorization: Bearer mk_xxxx', status: 401 };
  }

  if (!key.startsWith('mk_')) {
    return { valid: false, error: 'Invalid API key format. Key must start with mk_', status: 401 };
  }

  const keyHash = await sha256(key);

  // 查找 Key
  let keys;
  try {
    keys = await supabaseQuery('api_keys', {
      method: 'GET',
      filters: { key_hash: `eq.${keyHash}`, is_active: `eq.true` },
      limit: 1,
      env,
    });
  } catch (err) {
    return { valid: false, error: 'Auth service unavailable', status: 503 };
  }

  if (!keys || keys.length === 0) {
    return { valid: false, error: 'Invalid or inactive API key', status: 401 };
  }

  const keyRecord = keys[0];

  // 检查用户余额
  let users;
  try {
    users = await supabaseQuery('user_profiles', {
      method: 'GET',
      filters: { id: `eq.${keyRecord.user_id}` },
      select: 'id,balance,username',
      limit: 1,
      env,
    });
  } catch (err) {
    return { valid: false, error: 'User service unavailable', status: 503 };
  }

  if (!users || users.length === 0) {
    return { valid: false, error: 'User not found', status: 401 };
  }

  const user = users[0];

  if (user.balance <= 0) {
    return { valid: false, error: 'Insufficient balance. Please recharge at metapi.tylerzhang.xyz/dashboard', status: 402 };
  }

  // 更新 last_used_at（异步，不阻塞请求）
  supabaseQuery('api_keys', {
    method: 'PATCH',
    body: { last_used_at: new Date().toISOString() },
    filters: { id: `eq.${keyRecord.id}` },
    env,
  }).catch(() => {});

  return {
    valid: true,
    userId: user.id,
    keyId: keyRecord.id,
    username: user.username,
    balance: user.balance,
  };
}

// 记录用量（异步调用，不阻塞响应）
export async function logUsage({ userId, keyId, model, endpoint, promptTokens, completionTokens, totalTokens, statusCode }, env) {
  try {
    await supabaseQuery('usage_logs', {
      method: 'POST',
      body: {
        user_id: userId,
        api_key_id: keyId,
        model,
        endpoint,
        prompt_tokens: promptTokens || 0,
        completion_tokens: completionTokens || 0,
        total_tokens: totalTokens || 0,
        cost_tokens: totalTokens || 0,
        status_code: statusCode || 200,
      },
      env,
    });
  } catch (err) {
    console.error('[METAPI] Failed to log usage:', err.message);
  }
}

// 扣除用户余额
export async function deductBalance(userId, tokens, env) {
  try {
    // 先查当前余额
    const users = await supabaseQuery('user_profiles', {
      method: 'GET',
      filters: { id: `eq.${userId}` },
      select: 'balance,total_used',
      limit: 1,
      env,
    });

    if (users && users.length > 0) {
      const current = users[0];
      const newBalance = Math.max(0, current.balance - tokens);
      const newTotalUsed = (current.total_used || 0) + tokens;

      await supabaseQuery('user_profiles', {
        method: 'PATCH',
        body: { balance: newBalance, total_used: newTotalUsed },
        filters: { id: `eq.${userId}` },
        env,
      });
    }
  } catch (err) {
    console.error('[METAPI] Failed to deduct balance:', err.message);
  }
}

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

// CORS preflight response
export function corsResponse() {
  return new Response(null, { headers: corsHeaders });
}

// 错误响应
export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    error: { message, type: 'invalid_request_error', code: status },
  }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
