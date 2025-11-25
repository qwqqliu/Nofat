import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';

// 生成 Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

// 注册
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // 1. 检查邮箱是否已存在
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: '该邮箱已被注册' });
    }

    // 2. 处理昵称逻辑 (后端兜底)
    // 如果前端传了 name 就用，没传就自动截取邮箱前缀 (比如 test@qq.com -> test)
    const finalName = name && name.trim() !== '' ? name : email.split('@')[0];

    // 3. 创建用户
    const user = await User.create({
      email,
      password,
      name: finalName
    });

    // 4. 返回成功
    if (user) {
      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name, // 确保返回刚才存进去的名字
        },
        token: generateToken(user.id),
      });
    }
  } catch (error) {
    console.error('注册报错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};

// 登录
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. 查找用户
    const user = await User.findOne({ where: { email } });

    // 2. 验证密码
    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name, // 确保登录时也能拿到名字
        },
        token: generateToken(user.id),
      });
    } else {
      res.status(401).json({ message: '邮箱或密码错误' });
    }
  } catch (error) {
    console.error('登录报错:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
};
export const updateAvatar = async (req: any, res: any) => {
  try {
    const userId = req.user.id; // 从中间件获取用户ID
    const { avatar } = req.body; // 获取前端传来的图片Base64

    if (!avatar) {
      return res.status(400).json({ message: '请提供图片数据' });
    }

    // 更新数据库
    await User.update({ avatar }, { where: { id: userId } });
    
    // 获取最新用户信息返回给前端
    const updatedUser = await User.findByPk(userId);

    res.json({
      success: true,
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        name: updatedUser?.name,
        avatar: updatedUser?.avatar, // 返回新头像
      }
    });
  } catch (error) {
    console.error('头像上传失败:', error);
    res.status(500).json({ message: '头像更新失败' });
  }
};