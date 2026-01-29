import { Router } from 'express';
import { body } from 'express-validator';
import * as photoController from '../controllers/photo.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * GET /api/photos
 * 获取家庭相册
 */
router.get('/', photoController.getPhotos);

/**
 * GET /api/photos/tags
 * 获取所有标签
 */
router.get('/tags', photoController.getTags);

/**
 * GET /api/photos/:photoId
 * 获取单张照片
 */
router.get('/:photoId', photoController.getPhotoById);

/**
 * PUT /api/photos/:photoId/tags
 * 更新照片标签
 */
router.put(
  '/:photoId/tags',
  validate([body('tags').isArray().withMessage('标签必须是数组')]),
  photoController.updatePhotoTags
);

export default router;
