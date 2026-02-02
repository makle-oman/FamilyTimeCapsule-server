import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// 认证（无需登录）
router.get('/captcha', adminController.getCaptcha);
router.post('/login', adminController.login);
router.post('/refresh-token', adminController.refreshToken);
router.get('/get-async-routes', adminController.getAsyncRoutes);

// 仪表盘
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/trend', adminController.getTrendData);

// 用户管理
router.get('/users', adminController.getUsers);

// 家庭管理
router.get('/families', adminController.getFamilies);

// 记忆管理
router.get('/memories', adminController.getMemories);
router.delete('/memories/:id', adminController.deleteMemory);

// 照片管理
router.get('/photos', adminController.getPhotos);

// 信件管理
router.get('/letters', adminController.getLetters);

export default router;
