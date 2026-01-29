import { Router } from 'express';
import { body } from 'express-validator';
import * as memoryController from '../controllers/memory.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/memories
 * 创建记忆
 */
router.post(
  '/',
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
 * GET /api/memories
 * 获取时光轴记忆列表
 */
router.get('/', memoryController.getMemories);

/**
 * GET /api/memories/year-ago
 * 获取一年前今天的记忆
 */
router.get('/year-ago', memoryController.getYearAgoMemories);

/**
 * GET /api/memories/:memoryId
 * 获取单个记忆详情
 */
router.get('/:memoryId', memoryController.getMemoryById);

/**
 * POST /api/memories/:memoryId/parallel-views
 * 添加平行视角
 */
router.post(
  '/:memoryId/parallel-views',
  validate([
    body('content').trim().notEmpty().withMessage('内容不能为空'),
    body('images').optional().isArray().withMessage('图片必须是数组'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
  ]),
  memoryController.addParallelView
);

/**
 * POST /api/memories/:memoryId/resonance
 * 添加共鸣
 */
router.post('/:memoryId/resonance', memoryController.addResonance);

/**
 * DELETE /api/memories/:memoryId/resonance
 * 取消共鸣
 */
router.delete('/:memoryId/resonance', memoryController.removeResonance);

export default router;
