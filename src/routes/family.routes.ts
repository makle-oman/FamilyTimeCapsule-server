import { Router } from 'express';
import { body } from 'express-validator';
import * as familyController from '../controllers/family.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/families/create
 * 创建家庭
 */
router.post(
  '/create',
  validate([
    body('name')
      .trim()
      .notEmpty()
      .withMessage('家庭名称不能为空')
      .isLength({ max: 12 })
      .withMessage('家庭名称最多12个字符'),
    body('slogan').optional().isLength({ max: 50 }).withMessage('口号最多50个字符'),
    body('establishedYear').optional().isInt({ min: 1900, max: 2100 }).withMessage('年份无效'),
  ]),
  familyController.createFamily
);

/**
 * POST /api/families/join
 * 加入家庭
 */
router.post(
  '/join',
  validate([
    body('inviteCode')
      .trim()
      .notEmpty()
      .withMessage('邀请码不能为空')
      .isLength({ min: 6, max: 6 })
      .withMessage('邀请码为6位'),
  ]),
  familyController.joinFamily
);

/**
 * POST /api/families/my
 * 获取我的家庭
 */
router.post('/my', familyController.getMyFamily);

/**
 * POST /api/families/detail
 * 获取家庭详情
 */
router.post('/detail', familyController.getFamilyById);

/**
 * POST /api/families/update
 * 更新家庭信息
 */
router.post(
  '/update',
  validate([
    body('name').optional().isLength({ max: 12 }).withMessage('家庭名称最多12个字符'),
    body('slogan').optional().isLength({ max: 50 }).withMessage('口号最多50个字符'),
  ]),
  familyController.updateFamily
);

/**
 * POST /api/families/members
 * 获取家庭成员
 */
router.post('/members', familyController.getFamilyMembers);

/**
 * POST /api/families/stats
 * 获取家庭统计数据
 */
router.post('/stats', familyController.getFamilyStats);

export default router;
