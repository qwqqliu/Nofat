import { Request, Response } from 'express';
import Message from '../models/Message';
import OpenAI from 'openai';

// 👇 改进：获取 Client 的函数 (增加调试日志)
const getAIClient = () => {
  // 1. 尝试读取两种常见的 Key 名字
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  
  // 2. 调试日志：告诉我们在哪里运行，读到了什么
  console.log('正在初始化 AI 客户端...');
  console.log('API Base URL:', process.env.OPENAI_BASE_URL || "默认使用 openrouter.ai");
  console.log('API Key 状态:', apiKey ? `✅ 已读取 (长度: ${apiKey.length})` : '❌ 未读取到');

  if (!apiKey) {
    throw new Error("后端未读取到 API Key。请确保 server/.env 文件存在，并且包含 OPENAI_API_KEY=sk-or-v1...");
  }
  
  return new OpenAI({
    apiKey: apiKey,
    // 如果 .env 没配 URL，就默认用 OpenRouter
    baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Fitness AI App",
    }
  });
};

// 1. 获取聊天历史
export const getHistory = async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.id; 
    const messages = await Message.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']], 
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: '获取历史失败' });
  }
};

// 2. 发送消息
export const sendMessage = async (req: Request | any, res: Response) => {
  try {
    const { content, imageUrl } = req.body;
    const userId = req.user.id;

    // A. 存入用户消息
    await Message.create({
      userId,
      role: 'user',
      content,
      imageUrl: imageUrl || null
    });

    // B. 👇 核心修改：全新的人设与排版指令
    const systemPrompt = `
      你叫 "Nofat"，是用户的健身AI朋友，而不是冷冰冰的助手。
      
      【回复规则】：
      1. **排版美化**：严禁使用 markdown 的星号 (*, -) 做列表。必须使用 Emoji 图标 (如 🎯, 🔍, 🍎, 🥗, 🏃‍♂️, 💪, ⚠️, ❤️) 作为分隔符或列表头。
      2. **篇幅控制**：回答要简明扼要、直击重点，不要太啰嗦太臃肿。除非用户明确要求“详细解释”，否则点到为止。
      3. **语气风格**：轻松、像朋友一样交流，多给鼓励。
      4. **视觉任务**：如果用户发了食物图片，直接给出热量估算和简单的建议即可；如果发了动作图，指出关键纠正点。
    `;

    const messagesForAI: any[] = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    if (imageUrl) {
      messagesForAI.push({
        role: "user",
        content: [
          { type: "text", text: content || "请分析这张图片。" },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      });
    } else {
      messagesForAI.push({ role: "user", content: content });
    }

    // C. 初始化 Client
    const openai = getAIClient();

    // D. 调用 API
    const completion = await openai.chat.completions.create({
      model: "google/gemini-2.5-flash-lite", 
      messages: messagesForAI,
    });

    const aiResponseText = completion.choices[0]?.message?.content || "思考中...";

    // E. 存入 AI 回复
    const aiMessage = await Message.create({
      userId,
      role: 'assistant',
      content: aiResponseText,
    });

    res.json(aiMessage);

  } catch (error: any) {
    console.error('AI 调用失败:', error);
    res.status(500).json({ message: `Nofat 暂时掉线了: ${error.message}` });
  }
};

// 3. 清除历史
export const clearHistory = async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.id;
    await Message.destroy({ where: { userId } });
    res.json({ message: '聊天记录已清除' });
  } catch (error) {
    res.status(500).json({ message: '清除失败' });
  }
};