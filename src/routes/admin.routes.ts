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
router.get('/families/all', adminController.getAllFamilies);

// 记忆管理
router.get('/memories', adminController.getMemories);
router.delete('/memories/:id', adminController.deleteMemory);

// 照片管理
router.get('/photos', adminController.getPhotos);

// 信件管理
router.get('/letters', adminController.getLetters);

// 问答管理
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

export default router;
