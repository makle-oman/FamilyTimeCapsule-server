import { Router } from 'express';
import { body } from 'express-validator';
import * as letterController from '../controllers/letter.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/letters
 * 创建信件
 */
router.post(
  '/',
  validate([
    body('content').trim().notEmpty().withMessage('信件内容不能为空'),
    body('receiverId').notEmpty().withMessage('收件人不能为空').isUUID().withMessage('收件人ID无效'),
    body('unlockTime').notEmpty().withMessage('送达时间不能为空').isISO8601().withMessage('时间格式无效'),
  ]),
  letterController.createLetter
);

/**
 * GET /api/letters/pending
 * 获取待开启的信件
 */
router.get('/pending', letterController.getPendingLetters);

/**
 * GET /api/letters/sent
 * 获取已发送的信件
 */
router.get('/sent', letterController.getSentLetters);

/**
 * GET /api/letters/opened
 * 获取已打开的信件（书架）
 */
router.get('/opened', letterController.getOpenedLetters);

/**
 * GET /api/letters/years
 * 获取信件年份列表
 */
router.get('/years', letterController.getLetterYears);

/**
 * POST /api/letters/:letterId/open
 * 打开信件
 */
router.post('/:letterId/open', letterController.openLetter);

export default router;
