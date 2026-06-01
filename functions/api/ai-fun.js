// functions/api/ai-fun.js
// AI 趣味工具箱 API
// POST /api/ai-fun { type, input }

const PROMPTS = {
  weekly: {
    system: '你是一个专业的周报写手。根据用户提供的要点，生成一份结构清晰、语言专业的周报。格式包括：本周完成、下周计划、需要支持。不要废话，直接输出周报内容。',
    max_tokens: 800,
  },
  resume: {
    system: '你是一个资深HR和简历优化专家。用户会粘贴简历内容，你需要：1）指出问题 2）给出优化后的版本。用专业但易懂的语言，突出亮点，量化成果。',
    max_tokens: 1000,
  },
  translate: {
    system: '你是一个多语言翻译专家。自动检测输入语言，翻译成另一种主要语言（中英互译为主，也支持其他语言）。只输出翻译结果，不要解释。',
    max_tokens: 500,
  },
  duchicken: {
    system: '你是一个毒鸡汤大师。用户给你一个主题或关键词，你输出一句扎心的毒鸡汤。要犀利、好笑、有道理。只输出毒鸡汤本身，不要加引号或解释。',
    max_tokens: 100,
  },
  dream: {
    system: '你是一个解梦师，精通周公解梦和现代心理学解梦。用户描述梦境，你从两个角度分析：1）传统解梦寓意 2）心理学解读。语气温和有趣，不要吓人。',
    max_tokens: 500,
  },
  naming: {
    system: '你是一个起名大师。用户告诉你需要给什么起名（宝宝/宠物/网名/公司/产品等），以及任何偏好（性别、风格、寓意等），你给出5-8个名字，每个附带含义解释。要有创意，不要烂大街的名字。',
    max_tokens: 600,
  },
  loveletter: {
    system: '你是一个浪漫的情书作家。用户告诉你写给谁、什么关系、想表达什么，你帮写一封真挚动人的情书。不要太肉麻，要真诚、有细节感。控制在200字左右。',
    max_tokens: 400,
  },
  moments: {
    system: '你是一个朋友圈文案高手。用户告诉你照片内容或心情，你生成5条不同风格的文案：文艺风、搞笑风、简约风、英文风、毒舌风。每条控制在30字以内。',
    max_tokens: 400,
  },
  story: {
    system: '你是一个故事接龙伙伴。用户写一段故事开头或续写，你接着往下写200字左右。要保持风格一致，情节有趣，结尾留个悬念让对方接。',
    max_tokens: 400,
  },
  joke: {
    system: '你是一个段子手。输出一个好笑的段子/笑话。可以是冷笑话、谐音梗、反转笑话都行。要短、要好笑。只输出段子本身。',
    max_tokens: 150,
  },
};

export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { type, input } = await context.request.json();

    if (!type || !PROMPTS[type]) {
      return new Response(JSON.stringify({ error: '无效的功能类型' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const config = PROMPTS[type];

    const res = await fetch('https://fufu.iqach.top/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-123456',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mimo-v2-flash',
        messages: [
          { role: 'system', content: config.system },
          { role: 'user', content: input || '随机来一个' },
        ],
        max_tokens: config.max_tokens,
        stream: false,
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'AI 服务暂时不可用' }), {
        status: 502,
        headers: corsHeaders,
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || 'AI 走神了，再试一次？';

    return new Response(JSON.stringify({ ok: true, content }), {
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
