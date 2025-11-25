import { Request, Response } from 'express';
import Message from '../models/Message';
import OpenAI from 'openai';

// ... (getAIClient 函数保持不变，为了节省篇幅我省略了，保留你原有的即可) ...
const getAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("后端未读取到 API Key");
  return new OpenAI({
    apiKey: apiKey,
    baseURL: process.env.OPENAI_BASE_URL || "https://openrouter.ai/api/v1",
    defaultHeaders: { "HTTP-Referer": "http://localhost:3000", "X-Title": "Fitness AI App" }
  });
};

// 1. 获取聊天历史 (保持不变)
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

// 2. 发送消息 (❌ 核心修改都在这里)
export const sendMessage = async (req: Request | any, res: Response) => {
  try {
    // 👇 新增：从前端接收 save (是否保存) 和 system (系统指令) 参数
    // save 默认为 true，保证普通聊天正常存档
    const { content, imageUrl, save = true, system } = req.body;
    const userId = req.user.id;

    // A. 只有当 save 为 true 时，才存入用户消息
    if (save) {
      await Message.create({
        userId,
        role: 'user',
        content,
        imageUrl: imageUrl || null
      });
    }

    // B. 确定系统提示词 (System Prompt)
    // 如果前端传了 system (比如生成计划时)，就用前端的；否则用默认的 "Nofat" 人设
    let systemPrompt = system;
    
    if (!systemPrompt) {
      // 默认人设 (Nofat 聊天模式)
      systemPrompt = `
        你叫 "Nofat"，是用户的健身AI朋友。
        【回复规则】：
        1. 使用 Emoji (🎯, 💪) 美化。
        2. 简明扼要，不要啰嗦。
        3. 语气轻松，像朋友一样。
      `;
    }

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

    // E. 处理响应结果
    let responseData;

    if (save) {
      // ✅ 聊天模式：存入数据库，并返回数据库对象
      responseData = await Message.create({
        userId,
        role: 'assistant',
        content: aiResponseText,
      });
    } else {
      // 🚀 功能模式 (生成计划)：不存数据库，直接构造一个临时对象返回
      // 这样前端能收到数据，但数据库里没痕迹
      responseData = {
        role: 'assistant',
        content: aiResponseText,
        imageUrl: null,
        createdAt: new Date(),
        // 标记这是临时数据
        isTemporary: true 
      };
    }

    res.json(responseData);

  } catch (error: any) {
    console.error('AI 调用失败:', error);
    res.status(500).json({ message: `Nofat 暂时掉线了: ${error.message}` });
  }
};

// 3. 清除历史 (保持不变)
export const clearHistory = async (req: Request | any, res: Response) => {
  try {
    const userId = req.user.id;
    await Message.destroy({ where: { userId } });
    res.json({ message: '聊天记录已清除' });
  } catch (error) {
    res.status(500).json({ message: '清除失败' });
  }
};
