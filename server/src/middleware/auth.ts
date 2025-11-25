import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 扩展 Request 类型，让它支持 user 属性
export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // 1. 获取 Token
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: '未提供授权令牌' });
      return;
    }

    // 2. 解码 Token
    // 注意：这里我们匹配 authController 里的 jwt.sign({ id }, ...)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string; // 👈 关键修改：这里必须是 id，不是 userId
    };

    // 3. 将用户信息挂载到 req 对象上，供后面的 Controller 使用
    req.user = { id: decoded.id };
    
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    res.status(401).json({ message: '令牌无效或已过期' });
  }
};