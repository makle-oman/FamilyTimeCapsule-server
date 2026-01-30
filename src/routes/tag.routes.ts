import { Router } from 'express';
import { body } from 'express-validator';
import * as tagController from '../controllers/tag.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/tags
 * 获取用户标签列表
 */
router.get('/', tagController.getUserTags);

/**
 * POST /api/tags
 * 创建标签
 */
router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('标签名称不能为空').isLength({ max: 10 }).withMessage('标签名称最多10个字符'),
  ]),
  tagController.createUserTag
);

/**
 * DELETE /api/tags/:tagId
 * 删除标签
 */
router.delete('/:tagId', tagController.deleteUserTag);

export default router;
