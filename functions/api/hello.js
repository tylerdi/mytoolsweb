// Cloudflare Pages Function: 示例接口
// 调用方式：fetch('/api/hello', { method: 'POST', body: JSON.stringify({ name: 'World' }) })

export async function onRequestPost(context) {
  // 处理CORS
  if (context.request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
      },
    })
  }

  try {
    // 解析请求体
    const { name } = await context.request.json()

    // 连接Supabase数据库
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = context.env
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // 示例：查询热门工具
    const { data: hotData } = await supabase
      .from('tool_hot')
      .select('tool_id, count')
      .order('count', { ascending: false })
      .limit(5)

    // 返回响应
    return new Response(
      JSON.stringify({
        message: `Hello ${name || 'World'}! 👋 来自Cloudflare Functions的问候~`,
        topTools: hotData,
        timestamp: new Date().toISOString(),
        env: 'cloudflare'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}

// Supabase客户端，不用额外安装依赖
function createClient(url, key) {
  return {
    from: (table) => ({
      select: (columns = '*') => ({
        order: (column, options = {}) => ({
          limit: (count) => ({
            async then(resolve, reject) {
              try {
                const res = await fetch(`${url}/rest/v1/${table}?select=${columns}&order=${column}.${options.ascending ? 'asc' : 'desc'}&limit=${count}`, {
                  headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                  }
                })
                const data = await res.json()
                resolve({ data, error: res.ok ? null : data })
              } catch (e) {
                reject(e)
              }
            }
          })
        })
      })
    })
  }
}
