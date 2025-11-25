import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import AIChatMessage from '../models/AIChatMessage';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * 保存聊天消息
 */
router.post(
  '/',
  authMiddleware,
  [
    body('role').isIn(['user', 'assistant']),
    body('content').notEmpty(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { role, content, imageData } = req.body;

      const message = new AIChatMessage({
        userId: req.userId,
        role,
        content,
        imageData: imageData || null,
      });

      await message.save();

      res.status(201).json({
        message: '消息保存成功',
        data: message,
      });
    } catch (error) {
      console.error('保存消息错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

/**
 * 获取用户聊天历史
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50; // 默认获取最近50条
    const skip = parseInt(req.query.skip as string) || 0;

    const messages = await AIChatMessage.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await AIChatMessage.countDocuments({ userId: req.userId });

    res.json({
      messages: messages.reverse(), // 反转使其按时间顺序显示
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('获取聊天历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 删除聊天历史
 */
router.delete('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await AIChatMessage.deleteMany({ userId: req.userId });

    res.json({
      message: '聊天历史已清空',
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('删除聊天历史错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 删除单条消息
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const message = await AIChatMessage.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!message) {
      res.status(404).json({ message: '消息不存在' });
      return;
    }

    res.json({ message: '消息已删除' });
  } catch (error) {
    console.error('删除消息错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
