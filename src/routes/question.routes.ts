import { Router } from 'express';
import { body } from 'express-validator';
import * as questionController from '../controllers/question.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/questions/today
 * 获取今日问题
 */
router.post('/today', questionController.getTodayQuestion);

/**
 * POST /api/questions/answer
 * 回答问题
 */
router.post(
  '/answer',
  validate([
    body('questionId').notEmpty().withMessage('问题ID不能为空').isUUID().withMessage('问题ID无效'),
    body('content').trim().notEmpty().withMessage('答案不能为空').isLength({ max: 500 }).withMessage('答案最多500字'),
  ]),
  questionController.answerQuestion
);

/**
 * POST /api/questions/history
 * 获取问答历史
 */
router.post('/history', questionController.getQuestionHistory);

export default router;
