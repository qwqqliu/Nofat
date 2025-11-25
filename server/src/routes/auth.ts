import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'a_very_long_and_secure_default_secret_key_for_testing';

const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
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

      const { email, password } = req.body;

      // 检查用户是否已存在
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: '该邮箱已被注册' });
        return;
      }

      // 创建新用户
      const user = new User({
        email,
        password,
        name: email.split('@')[0], // 默认使用邮箱前缀作为名称
      });

      const savedUser = await user.save();

      // 生成token
      const token = generateToken(savedUser._id.toString(), savedUser.email);

      res.status(201).json({
        message: '注册成功',
        token,
        user: {
          id: savedUser._id,
          email: savedUser.email,
          name: savedUser.name,
          isGuest: false,
          createdAt: user.createdAt,
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

      // 查找用户
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        res.status(401).json({ message: '邮箱或密码错误' });
        return;
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ message: '邮箱或密码错误' });
        return;
      }

      // 生成token
      const token = generateToken(user._id.toString(), user.email);

      res.json({
        message: '登录成功',
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isGuest: false,
          createdAt: user.createdAt,
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as {
      userId: string;
    };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
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
