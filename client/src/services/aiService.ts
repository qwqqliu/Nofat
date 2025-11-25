// AI 服务 - 使用 OpenRouter API
const OPENROUTER_API_KEY = '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';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL_NAME = 'google/gemini-2.5-flash-lite';

// 添加诊断日志
console.log('🔧 AI Service 初始化');
console.log('API Key:', OPENROUTER_API_KEY.substring(0, 20) + '...');
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
  frequency: string; // 这里现在包含具体的星期和时间，例如 "每周 3 天：[周一、周三]..."
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
  // 验证必要的个人信息
  if (!options.age || !options.gender || !options.height || !options.weight) {
    throw new Error('缺少必要的个人信息：年龄、性别、身高、体重');
  }

  const prompt = buildPrompt(options);
  
  try {
    console.log('📤 发送 AI 计划生成请求...');
    console.log('用户信息:', {
      age: options.age,
      gender: options.gender,
      height: options.height,
      weight: options.weight,
      goal: options.goal,
      schedule: options.frequency, // 打印时间安排
    });

    const requestBody = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: '你是一个只输出 JSON 的 API。严禁输出 Markdown 标记（如 ```json）。严禁输出任何解释性文字。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000, // 增加 token 限制以确保完整输出
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.href, // 动态获取当前域名
        'X-Title': 'Nofat-Fitness',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('📥 API 响应状态:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenRouter API 错误:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(`API 错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ AI 计划生成成功');
    const content = data.choices[0].message.content;
    
    // 解析 AI 返回的计划
    const plan = parseAIPlan(content, options);
    return plan;
  } catch (error) {
    console.error('❌ 调用 AI 服务失败:', error);
    // 如果 API 调用失败，返回默认计划
    return generateDefaultPlan(options);
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
    'home': '在家',
    'gym': '健身房',
  };

  const genderText = options.gender === 'male' ? '男性' : '女性';
  const bmi = (options.weight / ((options.height / 100) * (options.height / 100))).toFixed(1);

  let personalInfo = `请为一名${genderText}客户生成私人定制训练计划，客户个人信息如下：
- 年龄：${options.age}岁
- 性别：${genderText}
- 身高：${options.height}cm
- 体重：${options.weight}kg
- BMI指数：${bmi}`;

  if (options.waistCircumference) {
    personalInfo += `\n- 腰围：${options.waistCircumference}cm`;
  }

  if (options.injuryHistory) {
    personalInfo += `\n- 伤病史：${options.injuryHistory}`;
  }

  if (options.notes) {
    personalInfo += `\n- 特殊说明：${options.notes}`;
  }

  return `${personalInfo}

训练目标与偏好：
- 主要目标：${goalMap[options.goal]}
- 训练水平：${levelMap[options.level]}
- 训练场地：${preferenceMap[options.preference]}
- 每次训练时长：${options.duration}
- 📅 时间安排：${options.frequency} 
  (请严格按照上方指定的时间安排生成日程。例如用户选了“周一、周三”，则只有这两天安排训练，其余时间标记为“休息”)

请根据以上客户的个人信息（年龄、性别、身高、体重、BMI等）和训练目标，生成一个私人定制的周期性训练计划。计划应该：
1. 针对性强，充分考虑客户的身体状况
2. 科学合理，符合其训练水平
3. 循序渐进，有明确的进度安排
4. 包含热身、主训练、放松三个阶段
5. 提供具体的动作名称和次数/时间
6. 包含营养建议
7. 包含安全注意事项

请以以下JSON格式返回计划，不要包含任何其他文本（也不要包含 Markdown 代码块标记）：
{
  "name": "计划名称（如：李四12周增肌计划）",
  "duration": "计划周期（如：12周）",
  "goal": {
    "name": "目标名称",
    "focus": "训练重点",
    "expectedResults": "预期效果"
  },
  "personalizedAnalysis": "基于客户信息的个性化分析（1-2句）",
  "weeklySchedule": {
    "Monday": {"name": "训练名称", "duration": "时长", "description": "简短描述"},
    "Tuesday": {"name": "训练名称", "duration": "时长", "description": "简短描述"},
    "Wednesday": {"name": "训练名称", "duration": "时长", "description": "简短描述"},
    "Thursday": {"name": "训练名称", "duration": "时长", "description": "简短描述"},
    "Friday": {"name": "训练名称", "duration": "时长", "description": "简短描述"},
    "Saturday": {"name": "训练名称", "duration": "时长", "description": "简短描述"},
    "Sunday": {"name": "训练名称", "duration": "时长", "description": "简短描述"}
  },
  "workouts": [
    {
      "name": "训练日标题 (休息日填'休息')",
      "day": "周几 (请对应实际安排)",
      "duration": "${options.duration} (休息日填'0')",
      "exercises": [
        // 如果是训练日，列出动作。如果是休息日，此数组为空 []
        {"name": "动作名", "sets": "组数", "reps": "次数/时间", "rest": "休息时间"},
        {"name": "动作名", "sets": "组数", "reps": "次数/时间", "rest": "休息时间"}
      ]
    }
    // ... 必须生成从周一到周日完整的7天数据
  ],
  "nutritionTips": ["营养建议1", "营养建议2", "营养建议3"],
  "tips": ["训练小贴士1", "训练小贴士2", "训练小贴士3"],
  "warnings": ["注意事项1", "注意事项2"]
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
      name: parsed.name || '定制训练计划',
      level: levelMap[options.level] || parsed.level || '定制',
      goal: parsed.goal || { name: '健身目标', focus: '提升身体素质' },
      frequency: options.frequency, // 使用前端传来的完整时间字符串
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
 * 生成默认计划（当 AI 调用失败时）
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
  // 防止 AI 挂了之后，这里还能根据用户选的星期排课
  const fallbackWorkouts = [];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  for (let day of days) {
    // 检查用户的 frequency 字符串是否包含当前星期
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
 * 获取 AI 训练建议
 */
export async function getAIFitnessAdvice(userStatus: any): Promise<string> {
  const prompt = `基于以下用户健身数据，请提供个性化的训练建议：
- 本周完成训练：${userStatus.weeklyWorkouts || 0} 次
- 本周总时长：${userStatus.weeklyMinutes || 0} 分钟
- 燃烧卡路里：${userStatus.weeklyCalories || 0} kcal
- 当前体重：${userStatus.weight || 0} kg
- 当前目标：${userStatus.goal || '保持健康'}

请给出 2-3 条个性化的、鼓励性的建议。`;

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
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('获取 AI 建议失败:', error);
    return '继续坚持训练，你的进步会逐步显现！';
  }
}

/**
 * AI 问答对话 - 用于健身相关问题 (Nofat 人设)
 */
export async function askAIQuestion(question: string, userContext?: any): Promise<string> {
  let systemPrompt = `你叫 "Nofat"，是用户的健身AI朋友。

【回复规则】
✓ 核心原则：简洁有力，不要长篇大论
✓ 结构清晰：用emoji标记要点，不要使用* ** *** 等符号
✓ 循序渐进：先给基础答案，再询问是否需要深入
✓ 人性化：像朋友一样交流，不要冗长的学术科普

【回答格式示例】
🎯 核心要点：（2-3句话，直接回答问题）
✅ 关键步骤：（用编号1️⃣ 2️⃣ 3️⃣等简列，每点一句话）
⚠️ 常见误区：（1-2个最重要的）
❓ 需要了解更多吗？（询问是否需要进阶内容、细节纠正、营养建议等）

【具体要求】
1. 不要超过200字，除非用户明确要求详细
2. 不要出现Markdown的* ** *** 符号，改用 🎯 ✅ 🔍 ⚠️ 💡 🏋️ 📊 等emoji
3. 对初级用户，先给基础动作，再问"需要学进阶版本吗？"
4. 对图片分析（食物/动作），直接给数字和结论，少说为什么
5. 语言亲切自然，像健身房里的教练和朋友，不要提及Gemini等身份`;
  
  if (userContext) {
    systemPrompt += `

【用户信息】
🎯 等级：${userContext.level}${userContext.level === '初级' ? '（建议从基础开始）' : '（可以加强进阶内容）'}
👤 年龄：${userContext.age}岁 | 体重：${userContext.weight}kg
🎪 目标：${userContext.goal}
${userContext.injuryHistory ? `⚠️ 注意：${userContext.injuryHistory}` : ''}`;
  }

  try {
    console.log('📤 发送 AI 问答请求...');
    
    const requestBody = {
      model: MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: question,
        },
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
 * 流式 AI 问答 - 返回可处理的异步生成器（支持渐进式输出）
 */
export async function* streamAIQuestion(question: string, userContext?: any): AsyncGenerator<string> {
  const content = await askAIQuestion(question, userContext);
  // 模拟流式输出
  const chunkSize = 5;
  for (let i = 0; i < content.length; i += chunkSize) {
    yield content.slice(i, i + chunkSize);
    await new Promise(r => setTimeout(r, 10)); 
  }
}
