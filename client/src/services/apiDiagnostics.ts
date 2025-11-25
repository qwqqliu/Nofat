/**
 * API 诊断工具 - 用于测试 OpenRouter API 连接
 */

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash-lite';

export async function testAPIConnection(): Promise<{
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}> {
  console.log('🔍 开始测试 API 连接...');
  
  try {
    const testPrompt = '你好，请回答"你好"';
    
    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: testPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 100,
    };

    console.log('📤 发送测试请求到:', API_URL);
    console.log('📋 使用模型:', MODEL);
    console.log('🔑 API Key 前缀:', API_KEY.substring(0, 20) + '...');

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://fitness-app.example.com',
        'X-Title': 'Fitness-App',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 响应状态:', response.status, response.statusText);
    console.log('📥 响应头:', {
      'content-type': response.headers.get('content-type'),
      'x-ratelimit-limit-requests': response.headers.get('x-ratelimit-limit-requests'),
      'x-ratelimit-limit-tokens': response.headers.get('x-ratelimit-limit-tokens'),
    });

    const responseText = await response.text();
    console.log('📋 原始响应文本长度:', responseText.length);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ JSON 解析错误:', e);
      return {
        success: false,
        message: `无法解析 API 响应: ${e}`,
        error: responseText,
      };
    }

    if (!response.ok) {
      console.error('❌ API 返回错误:', data);
      return {
        success: false,
        message: `API 返回错误 ${response.status}: ${data.error?.message || '未知错误'}`,
        error: data,
      };
    }

    console.log('✅ API 响应成功!');
    console.log('✅ 模型响应:', data.choices[0].message.content);

    return {
      success: true,
      message: '✅ API 连接成功!',
      response: data,
    };
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return {
      success: false,
      message: `连接失败: ${error instanceof Error ? error.message : String(error)}`,
      error,
    };
  }
}

/**
 * 诊断健身问题
 */
export async function testFitnessQuestion(question: string = '怎样做好深蹲？'): Promise<{
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}> {
  console.log('🏋️ 测试健身问题:', question);

  try {
    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: '你是一个专业的健身教练 AI 助手。',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'HTTP-Referer': 'https://fitness-app.example.com',
        'X-Title': 'Fitness-App',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 响应状态:', response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ 错误:', data);
      return {
        success: false,
        message: data.error?.message || '未知错误',
        error: data,
      };
    }

    console.log('✅ 健身问题回答成功!');
    console.log('📝 回答:', data.choices[0].message.content);

    return {
      success: true,
      message: '✅ 健身问题回答成功!',
      response: data,
    };
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return {
      success: false,
      message: `测试失败: ${error instanceof Error ? error.message : String(error)}`,
      error,
    };
  }
}
