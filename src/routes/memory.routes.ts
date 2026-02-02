import { Router } from 'express';
import { body } from 'express-validator';
import * as memoryController from '../controllers/memory.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/memories/create
 * 创建记忆
 */
router.post(
  '/create',
  validate([
    body('type').isIn(['TEXT', 'PHOTO', 'VOICE']).withMessage('类型必须是 TEXT、PHOTO 或 VOICE'),
    body('content').trim().notEmpty().withMessage('内容不能为空'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('images').optional().isArray().withMessage('图片必须是数组'),
    body('voiceDuration').optional().isInt({ min: 0 }).withMessage('语音时长无效'),
    body('voiceUrl').optional().isURL().withMessage('语音URL无效'),
  ]),
  memoryController.createMemory
);

/**
 * POST /api/memories/list
 * 获取时光轴记忆列表
 */
router.post('/list', memoryController.getMemories);

/**
 * POST /api/memories/year-ago
 * 获取一年前今天的记忆
 */
router.post('/year-ago', memoryController.getYearAgoMemories);

/**
 * POST /api/memories/detail
 * 获取单个记忆详情
 */
router.post('/detail', memoryController.getMemoryById);

/**
 * POST /api/memories/parallel-view
 * 添加平行视角
 */
router.post(
  '/parallel-view',
  validate([
    body('memoryId').notEmpty().withMessage('记忆ID不能为空'),
    body('content').trim().notEmpty().withMessage('内容不能为空'),
    body('images').optional().isArray().withMessage('图片必须是数组'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
  ]),
  memoryController.addParallelView
);

/**
 * POST /api/memories/resonance
 * 添加/取消共鸣 (toggle)
 */
router.post('/resonance', memoryController.addResonance);

export default router;
