import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * POST /api/auth/register
 * 用户注册
 */
router.post(
  '/register',
  validate([
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('手机号不能为空')
      .isMobilePhone('zh-CN')
      .withMessage('手机号格式不正确'),
    body('password')
      .notEmpty()
      .withMessage('密码不能为空')
      .isLength({ min: 6 })
      .withMessage('密码至少6位'),
    body('nickname')
      .trim()
      .notEmpty()
      .withMessage('昵称不能为空')
      .isLength({ max: 20 })
      .withMessage('昵称最多20个字符'),
    body('familyCode').optional().isLength({ min: 6, max: 6 }).withMessage('邀请码为6位'),
  ]),
  authController.register
);

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post(
  '/login',
  validate([
    body('phone').trim().notEmpty().withMessage('手机号不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ]),
  authController.login
);

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
