/**
 * API 测试脚本 - 在浏览器控制台运行
 */

// 复制下面的代码到浏览器控制台运行：

const testAPI = async () => {
  const OPENROUTER_API_KEY = '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';
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
  const MODEL_NAME = 'google/gemini-2.5-flash-lite';

  console.log('🔍 开始测试 API 连接...');
  
  try {
    console.log('1️⃣ 测试基本对话...');
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.href,
        'X-Title': '健身App-测试',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: '你好，请用一句话自我介绍。',
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      }),
    });

    console.log('2️⃣ 响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API 错误响应:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('3️⃣ 响应数据:', data);
    
    if (data.choices && data.choices[0]) {
      console.log('✅ API 测试成功!');
      console.log('AI 回复:', data.choices[0].message.content);
      return true;
    } else {
      console.error('❌ 响应格式异常:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ 网络错误:', error);
    return false;
  }
};

// 运行测试
testAPI().then(success => {
  if (success) {
    console.log('\n✅ API 连接正常！');
  } else {
    console.log('\n❌ API 连接失败，请检查：');
    console.log('1. API Key 是否有效');
    console.log('2. 网络连接是否正常');
    console.log('3. 是否有跨域问题');
  }
});
