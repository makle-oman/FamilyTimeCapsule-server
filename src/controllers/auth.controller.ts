import { Request, Response } from 'express';
import { authService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler } from '../middlewares';

/**
 * 用户注册
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password, nickname, familyCode } = req.body;

  const result = await authService.register({
    phone,
    password,
    nickname,
    familyCode,
  });

  ResponseHelper.created(res, result, '注册成功');
});

/**
 * 用户登录
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;

  const result = await authService.login({ phone, password });

  ResponseHelper.success(res, result, '登录成功');
});

/**
 * 获取当前用户信息
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await authService.getCurrentUser(userId);

  ResponseHelper.success(res, user, '获取成功');
});
