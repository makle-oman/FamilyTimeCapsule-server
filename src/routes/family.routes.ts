import { Router } from 'express';
import { body } from 'express-validator';
import * as familyController from '../controllers/family.controller';
import { validate } from '../middlewares/validate.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 所有路由都需要认证
router.use(authMiddleware);

/**
 * POST /api/families
 * 创建家庭
 */
router.post(
  '/',
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
 * GET /api/families/my
 * 获取我的家庭
 */
router.get('/my', familyController.getMyFamily);

/**
 * GET /api/families/:familyId
 * 获取家庭详情
 */
router.get('/:familyId', familyController.getFamilyById);

/**
 * PUT /api/families/:familyId
 * 更新家庭信息
 */
router.put(
  '/:familyId',
  validate([
    body('name').optional().isLength({ max: 12 }).withMessage('家庭名称最多12个字符'),
    body('slogan').optional().isLength({ max: 50 }).withMessage('口号最多50个字符'),
  ]),
  familyController.updateFamily
);

/**
 * GET /api/families/:familyId/members
 * 获取家庭成员
 */
router.get('/:familyId/members', familyController.getFamilyMembers);

/**
 * GET /api/families/:familyId/stats
 * 获取家庭统计数据
 */
router.get('/:familyId/stats', familyController.getFamilyStats);

export default router;
