import { Router } from 'express';
import { body } from 'express-validator';
import * as letterController from '../controllers/letter.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/letters/create
 * 创建信件
 */
router.post(
  '/create',
  validate([
    body('content').trim().notEmpty().withMessage('信件内容不能为空'),
    body('receiverId').notEmpty().withMessage('收件人不能为空').isUUID().withMessage('收件人ID无效'),
    body('unlockTime').notEmpty().withMessage('送达时间不能为空').isISO8601().withMessage('时间格式无效'),
  ]),
  letterController.createLetter
);

/**
 * POST /api/letters/pending
 * 获取待开启的信件
 */
router.post('/pending', letterController.getPendingLetters);

/**
 * POST /api/letters/sent
 * 获取已发送的信件
 */
router.post('/sent', letterController.getSentLetters);

/**
 * POST /api/letters/opened
 * 获取已打开的信件（书架）
 */
router.post('/opened', letterController.getOpenedLetters);

/**
 * POST /api/letters/years
 * 获取信件年份列表
 */
router.post('/years', letterController.getLetterYears);

/**
 * POST /api/letters/open
 * 打开信件
 */
router.post('/open', letterController.openLetter);

export default router;
