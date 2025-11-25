// 👇👇👇 核弹级修复：强制劫持 DNS 解析，只允许 IPv4 👇👇👇
import dns from 'dns';

// 保存原始的 lookup 函数
const originalLookup = dns.lookup;

// 重写 lookup 函数
// @ts-ignore
dns.lookup = (hostname, options, callback) => {
  // 兼容参数处理
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  
  // 强制指定 IPv4 (family: 4)
  if (!options) options = {};
  options.family = 4;
  
  // console.log(`🔒 DNS 拦截: 正在强制 IPv4 解析域名 -> ${hostname}`);
  
  return originalLookup(hostname, options, callback);
};
// 👆👆👆 修复结束 👆👆👆


import path from 'path';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';

const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

console.log("------------------------------------------------");
console.log("🚀 服务器启动中...");
if (result.error) {
  console.log("⚠️ 使用 Render 环境变量");
} else {
  console.log("✅ 本地 .env 加载成功");
}
const key = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
console.log("API Key:", key ? "✅ 存在" : "❌ 缺失");
console.log("------------------------------------------------");

import cors from 'cors';
import { connectDB } from './config/database';

import { register, login, updateAvatar } from './controllers/authController';
import { getHistory, sendMessage, clearHistory } from './controllers/chatController';
import { authMiddleware } from './middleware/auth'; 
import plansRouter from './routes/plans'; 

const app = express();
const PORT = process.env.PORT || 10000;

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Title', 'HTTP-Referer'],
  credentials: true
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (req: Request, res: Response) => { 
  res.json({ status: 'ok', timestamp: new Date().toISOString() }); 
});

const authRouter = express.Router();
authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/avatar', authMiddleware, updateAvatar); 
app.use('/api/auth', authRouter);

const chatRouter = express.Router();
chatRouter.get('/history', authMiddleware, getHistory);
chatRouter.post('/message', authMiddleware, sendMessage);
chatRouter.delete('/history', authMiddleware, clearHistory);
app.use('/api/chat', chatRouter);

app.use('/api/plans', plansRouter);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({ message: err.message || '服务器错误' });
});

const startServer = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 服务已启动: 端口 ${PORT}`);
    });
  } catch (err: any) {
    console.error('❌ 启动失败:', err);
  }
};

startServer();
