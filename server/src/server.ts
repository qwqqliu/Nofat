// 👇 1. 强制使用 IPv4 (解决 Render 连接 Supabase 报错 ENETUNREACH 的关键!)
import dns from 'node:dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {
  console.log("Node version too old for setDefaultResultOrder, skipping...");
}

// 👇 1. 强力环境加载逻辑
import path from 'path';
import dotenv from 'dotenv';
// ✅ 修复：在这里一次性引入 express 和所需的类型
import express, { Request, Response, NextFunction } from 'express';

// 强制指定 .env 文件的位置 (在 src 的上一级)
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

// 调试信息
console.log("------------------------------------------------");
console.log("正在加载配置文件...");
console.log("目标路径:", envPath);
if (result.error) {
  console.log("⚠️ 本地 .env 加载跳过 (生产环境使用系统环境变量)");
} else {
  console.log("✅ 本地 .env 加载成功！");
}
// 检查 Key 是否存在 (只打印前几位，防止泄露)
const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
console.log("API Key 状态:", key ? `✅ 已读取 (${key.substring(0, 5)}...)` : "❌ 未读取到");
console.log("------------------------------------------------");

// --- 正常的 Imports ---
// ❌ 删除：import express from 'express'; (上面已经引入过了)
import cors from 'cors';
import { connectDB } from './config/database';

import { register, login, updateAvatar } from './controllers/authController';
import { getHistory, sendMessage, clearHistory } from './controllers/chatController';
import { authMiddleware } from './middleware/auth'; 
// 引入计划相关的路由 (确保你之前修复的 plans.ts 已经 export default router)
import plansRouter from './routes/plans'; 
import authRouterFile from './routes/auth';

const app = express();
const PORT = process.env.PORT || 10000; // Render 默认使用 10000 端口

// 中间件配置
const corsOptions = {
  // 允许 Render 生产环境和本地开发环境
  origin: '*', // 调试阶段建议先允许所有，跑通后再限制
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Title', 'HTTP-Referer'], // 增加 AI 服务需要的 Header
  credentials: true
};
app.use(cors(corsOptions));

// 增加限制以允许上传大图片 (Base64)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 健康检查
app.get('/health', (req: Request, res: Response) => { 
  res.json({ status: 'ok', timestamp: new Date().toISOString() }); 
});

// --- 路由配置 ---

// 1. 认证路由
// 建议使用单独的路由文件，但如果你想保持现在的结构也可以。
// 这里为了稳妥，我们使用你之前定义的 controller
const authRouter = express.Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/avatar', authMiddleware, updateAvatar); 
app.use('/api/auth', authRouter);

// 2. 聊天路由
const chatRouter = express.Router();
chatRouter.get('/history', authMiddleware, getHistory);
chatRouter.post('/message', authMiddleware, sendMessage);
chatRouter.delete('/history', authMiddleware, clearHistory);
app.use('/api/chat', chatRouter);

// 3. 计划路由 (这一步非常重要，之前你在 WorkoutPage 里调用了 /api/plans)
app.use('/api/plans', plansRouter);

// 全局错误处理
// ✅ 修复：这里显式使用了 Request, Response 类型，解决了 TS7006 报错
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({ message: err.message || '服务器错误' });
});

// 启动服务器
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在端口: ${PORT}`);
      console.log(`💾 数据库连接尝试完成`);
    });
  } catch (err: any) {
    console.error('❌ 无法启动服务器:', err);
    process.exit(1);
  }
};

startServer();
