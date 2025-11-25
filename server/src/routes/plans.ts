import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import AIPlan from '../models/AIPlan';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * 保存AI定制计划
 */
router.post(
  '/',
  authMiddleware,
  [
    body('name').notEmpty(),
    body('goal').notEmpty(),
    body('level').notEmpty(),
    body('frequency').notEmpty(),
    body('duration').notEmpty(),
    body('planData').notEmpty(),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { name, goal, level, frequency, duration, planData } = req.body;

      const plan = new AIPlan({
        userId: req.userId,
        name,
        goal,
        level,
        frequency,
        duration,
        planData,
      });

      await plan.save();

      res.status(201).json({
        message: '计划保存成功',
        plan,
      });
    } catch (error) {
      console.error('保存计划错误:', error);
      res.status(500).json({ message: '服务器错误' });
    }
  }
);

/**
 * 获取用户所有计划
 */
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plans = await AIPlan.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ plans });
  } catch (error) {
    console.error('获取计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 获取单个计划
 */
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await AIPlan.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!plan) {
      res.status(404).json({ message: '计划不存在' });
      return;
    }

    res.json({ plan });
  } catch (error) {
    console.error('获取计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

/**
 * 删除计划
 */
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await AIPlan.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!plan) {
      res.status(404).json({ message: '计划不存在' });
      return;
    }

    res.json({ message: '计划已删除' });
  } catch (error) {
    console.error('删除计划错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
});

export default router;
