import { API_BASE_URL } from './config';

// AI 服务 - 前端适配新后端逻辑
// 添加诊断日志
console.log('🔧 AI Service 初始化 (Backend Proxy Mode)');
console.log('Backend URL:', API_BASE_URL);

export interface AIRequestOptions {
  // 个人信息
  age: number;
  gender: string;
  height: number; // cm
  weight: number; // kg
  waistCircumference?: number; // cm
  // 👇👇👇 在这里添加 name 字段 👇👇👇
  name?: string; // 用户昵称
  // 健身信息
  goal: string;
  level: string;
  frequency: string; // 包含具体的星期和时间
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
 * 1. 生成 AI 定制训练计划
 * 修正点：使用 save: false 防止存入数据库，使用 system 字段强制 JSON 格式
 */
export async function generateAIWorkoutPlan(options: AIRequestOptions): Promise<WorkoutPlan> {
  // 验证必要的个人信息
  if (!options.age || !options.gender || !options.height || !options.weight) {
    throw new Error('缺少必要的个人信息：年龄、性别、身高、体重');
  }

  const prompt = buildPrompt(options);
  
  try {
    console.log('📤 请求后端生成 AI 计划...');
    
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('未登录');

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        // 👇 核心修复 1：明确告诉后端不要保存这条记录！(解决 Bug)
        save: false,
        
        // 👇 核心修复 2：将格式约束放在 system 字段，而不是拼接在 content 里
        system: '你是一个只输出 JSON 的 API。严禁输出 Markdown 标记（如 ```json）。严禁输出任何解释性文字。',
        
        // content 只放纯粹的数据提示词
        content: prompt,
        role: 'user'
      }),
    });

    if (!response.ok) {
      throw new Error(`后端请求失败: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ 后端 AI 响应成功');

    // 兼容后端返回结构 (根据你新后端的逻辑，临时消息可能在 data.content)
    const content = data.content || data.data?.content || data.message;
    
    if (!content || typeof content !== 'string') {
       console.error('后端返回数据异常:', data);
       throw new Error('后端未返回有效内容');
    }

    // 解析 AI 返回的计划
    return parseAIPlan(content, options);

  } catch (error) {
    console.error('❌ AI 生成失败，转为兜底计划:', error);
    return generateDefaultPlan(options);
  }
}

/**
 * 2. 获取 AI 训练建议
 * 修正点：同样增加 save: false，避免这些小建议污染聊天记录
 */
export async function getAIFitnessAdvice(userStatus: any): Promise<string> {
  const prompt = `基于以下用户健身数据，请提供 2-3 条个性化的、鼓励性的建议（使用 Emoji）：
- 本周完成训练：${userStatus.weeklyWorkouts || 0} 次
- 本周总时长：${userStatus.weeklyMinutes || 0} 分钟
- 燃烧卡路里：${userStatus.weeklyCalories || 0} kcal
- 当前体重：${userStatus.weight || 0} kg
- 当前目标：${userStatus.goal || '保持健康'}`;

  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return '坚持就是胜利！💪';

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        content: prompt, 
        role: 'user',
        // 👇 同样不保存到聊天记录
        save: false, 
        system: '你是一个专业的健身数据分析师，请给出简短、鼓励性的建议。' 
      }),
    });

    if (!response.ok) throw new Error('API Error');
    const data = await response.json();
    return data.content || data.data?.content || '坚持就是胜利！💪';
  } catch (error) {
    return '继续坚持训练，你的进步会逐步显现！💪';
  }
}

/**
 * 3. AI 问答对话 (Nofat)
 * 修正点：使用 system 参数传递人设，默认 save: true (保存聊天记录)
 */
export async function askAIQuestion(question: string, userContext?: any): Promise<string> {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) return '请先登录';

    // 1. 定义人设 (System Prompt)
    const systemPrompt = `你叫 "Nofat"，是用户的健身AI朋友。
【回复规则】
✓ 核心原则：简洁有力，不要长篇大论，不要超过200字
✓ 结构清晰：用emoji标记要点(🎯 ✅ ⚠️ 💡)，不要使用 Markdown 的 * ** 等符号
✓ 语气：亲切自然，像健身房里的教练和朋友`;

    // 2. 构建用户上下文 (拼接到 User Content 中)
    let userContent = "";
    if (userContext) {
      userContent += `【用户信息：${userContext.level} | ${userContext.age}岁 | ${userContext.weight}kg | 目标:${userContext.goal}】\n`;
    }
    userContent += question;

    const response = await fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        content: userContent,
        role: 'user',
        // 👇 聊天需要保存历史，这里可以传 true，也可以不传(如果后端默认是true)
        save: true,
        // 👇 将人设传给后端
        system: systemPrompt
      }),
    });

    if (!response.ok) throw new Error('后端请求失败');
    
    const data = await response.json();
    return data.content || data.data?.content || 'AI 暂时无法回答';

  } catch (error) {
    console.error('AI 问答失败:', error);
    return '抱歉，Nofat 暂时有点累，请稍后再试 😴';
  }
}

/**
 * 流式 AI 问答
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

// ==========================================
// 下面是辅助函数，逻辑保持不变
// ==========================================

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
  // 👇👇👇 修改开始：获取名字 👇👇👇
  const userName = options.name || '用户';

  let personalInfo = `请为一名${genderText}客户（昵称：${userName}）生成私人定制训练计划，客户个人信息如下：
- 姓名：${userName}
- 年龄：${options.age}岁
- 性别：${genderText}
- 身高：${options.height}cm
- 体重：${options.weight}kg
- BMI指数：${bmi}`;
  // 👆👆👆 修改结束 👆👆👆

  if (options.waistCircumference) personalInfo += `\n- 腰围：${options.waistCircumference}cm`;
  if (options.injuryHistory) personalInfo += `\n- 伤病史：${options.injuryHistory}`;
  if (options.notes) personalInfo += `\n- 特殊说明：${options.notes}`;

  return `${personalInfo}

训练目标与偏好：
- 主要目标：${goalMap[options.goal] || options.goal}
- 训练水平：${levelMap[options.level] || options.level}
- 训练场地：${preferenceMap[options.preference] || options.preference}
- 每次训练时长：${options.duration}
- 📅 时间安排：${options.frequency} 
  (请严格按照上方指定的时间安排生成日程。例如用户选了“周一、周三”，则只有这两天安排训练，其余时间标记为“休息”)

请根据以上客户的个人信息和训练目标，生成一个私人定制的周期性训练计划。计划应该：
1. 针对性强，充分考虑客户的身体状况
2. 科学合理，符合其训练水平
3. 循序渐进，包含热身、主训练、放松
4. 包含具体的动作名称和次数/时间

请以以下 JSON 格式返回计划，不要包含任何其他文本（也不要包含 Markdown 代码块标记）：
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
      "day": "周几 (必须对应实际安排)",
      "duration": "${options.duration} (休息日填'0')",
      "exercises": [
        {"name": "动作名", "sets": "组数", "reps": "次数/时间", "rest": "休息时间"}
      ]
    }
  ],
  "nutritionTips": ["营养建议1", "营养建议2"],
  "tips": ["训练小贴士1", "训练小贴士2"],
  "warnings": ["注意事项1", "注意事项2"]
}`;
}

function parseAIPlan(content: string, options: AIRequestOptions): WorkoutPlan {
  try {
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('未检测到 JSON，尝试兜底');
      return generateDefaultPlan(options);
    }
    const parsed = JSON.parse(jsonMatch[0]);
    const levelMap: any = { 'beginner': '初级', 'intermediate': '中级', 'advanced': '高级' };
    const workouts = parsed.workouts || [];
    
    return {
      name: parsed.name || 'AI 定制计划',
      level: levelMap[options.level] || parsed.level || '定制',
      goal: parsed.goal || { name: '健身目标', focus: '提升身体素质' },
      frequency: options.frequency,
      duration: options.duration,
      workouts: workouts.length > 0 ? workouts : [],
      tips: [...(parsed.nutritionTips || []), ...(parsed.tips || [])],
    };
  } catch (error) {
    console.error('解析 AI 返回内容失败:', error);
    return generateDefaultPlan(options);
  }
}

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

  const fallbackWorkouts = [];
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  
  for (let day of days) {
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
