import { Router } from 'express';
import { body } from 'express-validator';
import * as photoController from '../controllers/photo.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/photos/list
 * 获取家庭相册
 */
router.post('/list', photoController.getPhotos);

/**
 * POST /api/photos/tags
 * 获取所有标签
 */
router.post('/tags', photoController.getTags);

/**
 * POST /api/photos/detail
 * 获取单张照片
 */
router.post('/detail', photoController.getPhotoById);

/**
 * POST /api/photos/update-tags
 * 更新照片标签
 */
router.post(
  '/update-tags',
  validate([
    body('photoId').notEmpty().withMessage('照片ID不能为空'),
    body('tags').isArray().withMessage('标签必须是数组'),
  ]),
  photoController.updatePhotoTags
);

export default router;
