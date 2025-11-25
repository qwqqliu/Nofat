// AI 服务 - 使用 OpenRouter API
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.5-flash-lite';

// 添加诊断日志
console.log('🔧 AI Service 初始化');
console.log('API Key:', OPENROUTER_API_KEY ? 'Loaded' : 'Missing');
console.log('API URL:', OPENROUTER_API_URL);
console.log('Model:', MODEL_NAME);

export interface AIRequestOptions {
  // 个人信息
  age: number;
  gender: string;
  height: number; // cm
  weight: number; // kg
  waistCircumference?: number; // cm
  // 健身信息
  goal: string;
  level: string;
  frequency: string; // 这里包含具体的星期和时间
  duration: string;
  preference: string;
  injuryHistory?: string; // 伤病史
  notes?: string; // 额外说明
}

export interface WorkoutPlan {
  name: string;
  level: string;
  goal: any;
  frequency: string;
  duration: string;
  workouts: any[];
  tips: string[];
}

/**
 * 生成 AI 定制训练计划 - 基于真实个人数据
 */
export async function generateAIWorkoutPlan(options: AIRequestOptions): Promise<WorkoutPlan> {
  // 1. 验证必要信息
  if (!options.age || !options.gender || !options.height || !options.weight) {
    throw new Error('缺少必要的个人信息：年龄、性别、身高、体重');
  }

  // 2. 👇 核心修改：在这里直接构建 Prompt，强调时间安排
  // 我们特意强调了 "frequency" 字段，因为前端现在传过来的是 "每周3天：[周一、周三]..."
  const prompt = `
    你是一位拥有20年经验的专业健身教练。请根据以下用户数据，生成一份详细的周训练计划。

    【用户画像】
    - 基本数据：${options.age}岁 / ${options.gender === 'male' ? '男' : '女'} / ${options.height}cm / ${options.weight}kg
    - 核心目标：${options.goal} (请针对此目标设计)
    - 当前水平：${options.level}
    - 训练偏好：${options.preference} (请根据偏好选择动作)
    - 身体状况：${options.injuryHistory || '无伤病'}
    - 备注说明：${options.notes || '无'}
    
    【🔴 重点约束 - 时间安排】
    用户的具体时间表是："${options.frequency}"。
    请严格按照用户选择的“星期几”来安排训练日。
    例如：如果用户只选了“周一、周三”，那么只有这两天有具体训练内容，其他日子标记为“休息日”或“主动恢复”。
    
    【输出格式要求】
    必须返回纯 JSON 格式，不要包含 Markdown 标记（如 \`\`\`json）。结构如下：
    {
      "name": "给计划起个霸气的名字",
      "goal": { "name": "目标", "focus": "一句话重点" },
      "level": "${options.level}",
      "duration": "${options.duration}",
      "frequency": "${options.frequency}", 
      "workouts": [
        {
          "day": "周一",
          "name": "训练日标题 (如果是休息日则填'休息')",
          "duration": "${options.duration} (如果是休息日填0)",
          "exercises": [
             // 如果是休息日，这里留空数组 []
             // 如果是训练日，列出动作：
             { "name": "动作名称", "sets": "组数", "reps": "次数/时长", "rest": "休息时间" }
          ]
        }
        // ... 请必须生成从 "周一" 到 "周日" 的完整7天数据
      ],
      "tips": ["给出的3条专业饮食或恢复建议"]
    }
  `;
  
  try {
    console.log('📤 发送 AI 请求...');
    
    // 3. 发送请求 (OpenRouter / Gemini)
    // 注意：这里复用了你 Chat 功能的后端接口，或者是直接调用 OpenRouter
    // 如果你是前端直接调用 OpenRouter，保持你原有的 fetch 逻辑
    // 如果你是通过后端转发，请确保这里指向 '/api/chat/message' 或类似的端点
    
    // 假设你前端直接调 OpenRouter (根据你之前的 APITestPage 推断):
    const apiKey = localStorage.getItem('ai_api_key') || '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'; // 这里可以用你写死的 Key
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Nofat Fitness',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite', // 保持使用 Gemini
        messages: [
          {
            role: 'system',
            content: '你是一个只输出 JSON 的 API。不要输出任何解释性文字。'
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API 请求失败: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) throw new Error('AI 未返回内容');

    // 4. 解析 JSON
    // 有时候 AI 会带上 ```json 前缀，我们需要清理掉
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(jsonString);

    return plan;

  } catch (error) {
    console.error('AI 生成出错:', error);
    throw error;
  }
}

/**
 * 构建提示词 - 基于真实个人数据 (已增强时间安排逻辑)
 */
function buildPrompt(options: AIRequestOptions): string {
  const goalMap: any = {
    'weight-loss': '减脂塑形',
    'muscle-gain': '增肌强壮',
    'endurance': '提升耐力',
    'flexibility': '柔韧灵活',
  };

  const levelMap: any = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级',
  };

  const preferenceMap: any = {
    'home': '在家 (无器械或小器械)',
    'gym': '健身房 (器械齐全)',
  };

  const genderText = options.gender === 'male' ? '男性' : '女性';
  const bmi = (options.weight / ((options.height / 100) * (options.height / 100))).toFixed(1);

  let personalInfo = `请为一名${genderText}客户生成私人定制训练计划。
【客户档案】
- 年龄：${options.age}岁
- 身体数据：${options.height}cm / ${options.weight}kg (BMI: ${bmi})`;

  if (options.waistCircumference) personalInfo += `\n- 腰围：${options.waistCircumference}cm`;
  if (options.injuryHistory) personalInfo += `\n- ⚠️ 伤病史：${options.injuryHistory}`;
  if (options.notes) personalInfo += `\n- 📝 特殊说明：${options.notes}`;

  return `${personalInfo}

【训练目标与限制】
- 核心目标：${goalMap[options.goal] || options.goal}
- 训练水平：${levelMap[options.level] || options.level}
- 训练场地：${preferenceMap[options.preference] || options.preference}
- 单次时长：${options.duration}
- 📅 时间安排：${options.frequency} 
  (请严格按照上方指定的时间安排生成日程。例如用户选了“周一、周三”，则只有这两天安排训练，其余时间标记为“休息”)

【输出要求】
请生成一个纯 JSON 对象，不要包含 Markdown 格式。结构如下：
{
  "name": "给计划起个响亮的名字",
  "goal": { "name": "目标名称", "focus": "一句话重点" },
  "level": "${levelMap[options.level] || options.level}",
  "frequency": "${options.frequency}",
  "duration": "${options.duration}",
  "workouts": [
    {
      "day": "周一 (请对应实际安排)", 
      "name": "训练日标题 (休息日填'休息')",
      "duration": "${options.duration} (休息日填'0')",
      "exercises": [
        // 如果是训练日，列出动作。如果是休息日，此数组为空 []
        {"name": "动作名称", "sets": "组数", "reps": "次数/时间", "rest": "休息时间"}
      ]
    }
    // ... 必须生成从周一到周日完整的7天数据
  ],
  "nutritionTips": ["3条简短的饮食建议 (带Emoji)"],
  "tips": ["3条简短的恢复建议 (带Emoji)"],
  "warnings": ["注意事项 (带Emoji)"]
}`;
}

/**
 * 解析 AI 返回的计划
 */
function parseAIPlan(content: string, options: AIRequestOptions): WorkoutPlan {
  try {
    // 清理 Markdown 标记 (防止 AI 输出 ```json)
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 提取 JSON 内容
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return generateDefaultPlan(options);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    const levelMap: any = {
      'beginner': '初级',
      'intermediate': '中级',
      'advanced': '高级',
    };

    // 处理workouts数组 - 保留AI生成的详细信息
    const workouts = parsed.workouts || [];
    
    return {
      name: parsed.name || 'AI 定制计划',
      level: levelMap[options.level] || parsed.level || '定制',
      goal: parsed.goal || { name: '健身目标', focus: '提升身体素质' },
      frequency: options.frequency, // 使用前端传来的格式化字符串
      duration: options.duration,
      workouts: workouts.length > 0 ? workouts : [],
      tips: [...(parsed.nutritionTips || []), ...(parsed.tips || [])],
    };
  } catch (error) {
    console.error('解析 AI 返回内容失败:', error);
    return generateDefaultPlan(options);
  }
}

/**
 * 生成默认计划（当 AI 调用失败时，完整兜底逻辑）
 */
function generateDefaultPlan(options: AIRequestOptions): WorkoutPlan {
  const goalMap: any = {
    'weight-loss': { name: '减脂塑形', focus: '有氧为主，力量为辅' },
    'muscle-gain': { name: '增肌强壮', focus: '力量训练为主' },
    'endurance': { name: '提升耐力', focus: '有氧耐力训练' },
    'flexibility': { name: '柔韧灵活', focus: '瑜伽拉伸为主' },
  };

  const levelMap: any = {
    'beginner': '初级',
    'intermediate': '中级',
    'advanced': '高级',
  };

  const workoutSets: any = {
    'weight-loss': [
      { name: '热身训练', duration: '5-10分钟', exercises: ['动态拉伸', '关节活动', '轻度有氧'] },
      { name: '主要训练', duration: options.duration, exercises: ['开合跳', '高抬腿', '跳绳', '山地爬行', '波比跳'] },
      { name: '放松整理', duration: '5-10分钟', exercises: ['静态拉伸', '深呼吸', '肌肉放松'] },
    ],
    'muscle-gain': [
      { name: '热身训练', duration: '5-10分钟', exercises: ['动态拉伸', '关节活动', '轻度有氧'] },
      { name: '主要训练', duration: options.duration, exercises: ['卧推', '深蹲', '硬拉', '划船', '肩推'] },
      { name: '放松整理', duration: '5-10分钟', exercises: ['静态拉伸', '深呼吸', '肌肉放松'] },
    ],
    'endurance': [
      { name: '热身训练', duration: '5-10分钟', exercises: ['动态拉伸', '关节活动', '轻度跑步'] },
      { name: '主要训练', duration: options.duration, exercises: ['有氧跑步', '交替冲刺', '负重行走', '阶梯训练'] },
      { name: '放松整理', duration: '5-10分钟', exercises: ['静态拉伸', '深呼吸', '肌肉放松'] },
    ],
    'flexibility': [
      { name: '热身运动', duration: '5-10分钟', exercises: ['关节转动', '轻度活动'] },
      { name: '主要训练', duration: options.duration, exercises: ['前屈', '侧伸', '猫式伸展', '婴儿式', '蛇式'] },
      { name: '放松整理', duration: '5-10分钟', exercises: ['深呼吸', '冥想'] },
    ],
  };

  // 智能周计划生成逻辑 (根据用户选择的 frequency 动态生成)
  const fallbackWorkouts = [];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  for (let day of days) {
    // 检查用户的 frequency 字符串是否包含当前星期
    // 前端传来的格式如："每周 3 天：[周一、周三、周五]..."
    if (options.frequency && options.frequency.includes(day)) {
      fallbackWorkouts.push({
        day: day,
        name: '训练日',
        duration: options.duration,
        exercises: workoutSets[options.goal] || workoutSets['weight-loss']
      });
    } else {
      fallbackWorkouts.push({
        day: day,
        name: '休息',
        duration: '0',
        exercises: []
      });
    }
  }

  return {
    name: `${goalMap[options.goal]?.name || '定制'}计划 (离线版)`,
    level: levelMap[options.level] || '定制',
    goal: goalMap[options.goal] || { name: '健身目标', focus: '提升身体素质' },
    frequency: options.frequency,
    duration: options.duration,
    workouts: fallbackWorkouts,
    tips: [
      '⚠️ AI 连接超时，这是为您生成的默认计划模板',
      '训练前请充分热身，避免受伤',
      '注意动作标准，质量优于数量',
      '配合合理饮食，效果更佳',
      '训练后进行充分放松和恢复',
    ],
  };
}

/**
 * 获取 AI 训练建议 (用于首页统计卡片)
 */
export async function getAIFitnessAdvice(userStatus: any): Promise<string> {
  const prompt = `基于用户数据：本周训练${userStatus.weeklyWorkouts||0}次，时长${userStatus.weeklyMinutes||0}分钟，消耗${userStatus.weeklyCalories||0}kcal。体重${userStatus.weight||0}kg，目标${userStatus.goal||'健康'}。
  请用一句话给出鼓励建议（带Emoji）。`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Nofat-Fitness',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    return '坚持就是胜利！保持训练节奏，你正在变得更强！💪';
  }
}

/**
 * AI 问答对话 - Nofat 人设版
 */
export async function askAIQuestion(question: string, userContext?: any): Promise<string> {
  let systemPrompt = `你叫 "Nofat"，是用户的健身AI朋友。

【回复规则】
1. **排版美化**：严禁使用星号 (*, -)。必须使用 Emoji (🎯, 🔍, 🍎, 🏃‍♂️, 💪, ⚠️) 作为列表头。
2. **篇幅控制**：回答要简明扼要，不要太啰嗦，除非用户追问。
3. **语气风格**：轻松、像朋友一样交流，不要显示"Gemini"或"机器人"身份。
4. **思考状态**：如果需要思考，直接显示"思考中..."。`;
  
  if (userContext) {
    systemPrompt += `\n【用户数据】等级:${userContext.level} | 目标:${userContext.goal}`;
  }

  try {
    console.log('📤 发送 AI 问答请求...');
    
    const requestBody = {
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.7,
      max_tokens: 800,
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.href,
        'X-Title': 'Nofat-Fitness',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('❌ AI 问答失败:', error);
    return '抱歉，Nofat 暂时有点累，请稍后再试 😴';
  }
}

/**
 * 流式 AI 问答 (模拟流式输出)
 */
export async function* streamAIQuestion(question: string, userContext?: any): AsyncGenerator<string> {
  const content = await askAIQuestion(question, userContext);
  // 模拟流式输出，每 5 个字符输出一次，提升体验
  const chunkSize = 5;
  for (let i = 0; i < content.length; i += chunkSize) {
    yield content.slice(i, i + chunkSize);
    await new Promise(r => setTimeout(r, 10)); 
  }
}