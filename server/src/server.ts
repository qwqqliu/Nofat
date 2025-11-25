// 👇 1. 强力环境加载逻辑 (保留这个，因为它能解决你找不到 .env 的问题)
import path from 'path';
import dotenv from 'dotenv';

// 强制指定 .env 文件的位置 (在 src 的上一级)
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

// 调试信息
console.log("------------------------------------------------");
console.log("正在加载配置文件...");
console.log("目标路径:", envPath);
if (result.error) {
  console.error("❌ 加载失败！找不到文件。请确认 server 目录下有 .env 文件");
} else {
  console.log("✅ 加载成功！");
  const key = process.env.OPENAI_API_KEY;
  console.log("读取到的 Key:", key ? `${key.substring(0, 10)}...` : "❌ 空 (未读取到内容)");
}
console.log("------------------------------------------------");

// --- 正常的 Imports ---
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/database';

// 👇 修复点：合并引用，只保留这一行！包含了 register, login 和 updateAvatar
import { register, login, updateAvatar } from './controllers/authController';

import { getHistory, sendMessage, clearHistory } from './controllers/chatController';
import { authMiddleware } from './middleware/auth'; 

const app = express();
const PORT = process.env.PORT || 5001;

// 中间件配置
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? '*' : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));

// 增加限制以允许上传大图片 (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 健康检查
app.get('/health', (req, res) => { res.json({ status: 'ok', timestamp: new Date().toISOString() }); });

// --- 路由配置 ---

// 1. 认证路由
const authRouter = express.Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
// 头像上传 (需要鉴权)
authRouter.post('/avatar', authMiddleware, updateAvatar); 
app.use('/api/auth', authRouter);

// 2. 聊天路由
const chatRouter = express.Router();
chatRouter.get('/history', authMiddleware, getHistory);
chatRouter.post('/message', authMiddleware, sendMessage);
chatRouter.delete('/history', authMiddleware, clearHistory);
app.use('/api/chat', chatRouter);

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({ message: err.message || '服务器错误' });
});

// 启动服务器
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`💾 数据库：Supabase (PostgreSQL)`);
      console.log(`🤖 AI模型：OpenRouter (Gemini 2.5)`);
      console.log(`🔒 聊天功能：已启用`);
    });
  } catch (err: any) {
    console.error('❌ 无法启动服务器:', err);
    process.exit(1);
  }
};

startServer();