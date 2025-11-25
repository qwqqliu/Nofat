import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 定义扩展后的 Request 接口
export interface AuthRequest extends Request {
  user?: {
    id: string;
  };
  userId?: string; // 为了兼容你代码里有些地方用的 req.userId
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: '未提供授权令牌' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string;
    };

    // 同时赋值给两个属性，确保兼容
    req.user = { id: decoded.id };
    req.userId = decoded.id; 
    
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    res.status(401).json({ message: '令牌无效或已过期' });
  }
};
