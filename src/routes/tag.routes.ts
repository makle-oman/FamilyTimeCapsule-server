import { Router } from 'express';
import { body } from 'express-validator';
import * as tagController from '../controllers/tag.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/tags/list
 * 获取用户标签列表
 */
router.post('/list', tagController.getUserTags);

/**
 * POST /api/tags/create
 * 创建标签
 */
router.post(
  '/create',
  validate([
    body('name').trim().notEmpty().withMessage('标签名称不能为空').isLength({ max: 10 }).withMessage('标签名称最多10个字符'),
  ]),
  tagController.createUserTag
);

/**
 * POST /api/tags/delete
 * 删除标签
 */
router.post('/delete', tagController.deleteUserTag);

export default router;
