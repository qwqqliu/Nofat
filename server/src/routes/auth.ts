import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '30d' });
};

/**
 * 注册
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, name } = req.body;

      // Sequelize 查询
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ message: '该邮箱已被注册' });
        return;
      }

      const finalName = name && name.trim() !== '' ? name : email.split('@')[0];

      const user = await User.create({
        email,
        password,
        name: finalName,
      });

      const token = generateToken(user.id);

      res.status(201).json({
        message: '注册成功',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isGuest: false,
        },
      });
    } catch (error) {
      console.error('注册错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

/**
 * 登录
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        res.status(401).json({ message: '邮箱或密码错误' });
        return;
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ message: '邮箱或密码错误' });
        return;
      }

      const token = generateToken(user.id);

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          isGuest: false,
        },
      });
    } catch (error) {
      console.error('登录错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

/**
 * 获取当前用户信息
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: '未提供授权令牌' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    
    // Sequelize 使用 findByPk
    const user = await User.findByPk(decoded.id);

    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        contactPhone: user.contactPhone,
        contactAddress: user.contactAddress,
        isGuest: false,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(401).json({ message: '令牌无效' });
  }
});

export default router;
