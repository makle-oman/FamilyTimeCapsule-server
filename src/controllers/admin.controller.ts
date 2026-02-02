import { Request, Response } from 'express';
import { adminService } from '../services/admin.service';
import { adminAuthService } from '../services/adminAuth.service';
import { ResponseHelper } from '../utils/response';
import { asyncHandler } from '../middlewares';

/**
 * 获取图形验证码
 */
export const getCaptcha = asyncHandler(async (_req: Request, res: Response) => {
  const result = adminAuthService.generateCaptcha();
  ResponseHelper.success(res, result);
});

/**
 * 管理员登录
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password, captchaId, captchaCode } = req.body;

  if (!username || !password) {
    ResponseHelper.error(res, '请输入账号和密码');
    return;
  }
  if (!captchaId || !captchaCode) {
    ResponseHelper.error(res, '请输入验证码');
    return;
  }

  const data = await adminAuthService.login(username, password, captchaId, captchaCode);
  // 前端 pure-admin 需要 success 字段
  res.json({ success: true, data });
});

/**
 * 刷新Token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  if (!token) {
    ResponseHelper.error(res, '缺少刷新令牌');
    return;
  }
  const data = await adminAuthService.refreshToken(token);
  res.json({ success: true, data });
});

/**
 * 获取异步路由（管理后台不需要动态路由，返回空数组）
 */
export const getAsyncRoutes = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, data: [] });
});

/**
 * 获取仪表盘统计数据
 */
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const stats = await adminService.getDashboardStats();
  ResponseHelper.success(res, stats);
});

/**
 * 获取趋势数据
 */
export const getTrendData = asyncHandler(async (_req: Request, res: Response) => {
  const data = await adminService.getTrendData();
  ResponseHelper.success(res, data);
});

/**
 * 获取用户列表
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, keyword } = req.query;
  const result = await adminService.getUsers(
    { page: Number(page), limit: Number(limit) },
    keyword as string
  );
  ResponseHelper.success(res, result);
});

/**
 * 获取家庭列表
 */
export const getFamilies = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, keyword } = req.query;
  const result = await adminService.getFamilies(
    { page: Number(page), limit: Number(limit) },
    keyword as string
  );
  ResponseHelper.success(res, result);
});

/**
 * 获取记忆列表
 */
export const getMemories = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, type, keyword } = req.query;
  const result = await adminService.getMemories(
    { page: Number(page), limit: Number(limit) },
    type as string,
    keyword as string
  );
  ResponseHelper.success(res, result);
});

/**
 * 删除记忆
 */
export const deleteMemory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await adminService.deleteMemory(id);
  ResponseHelper.success(res, null, '删除成功');
});

/**
 * 获取照片列表
 */
export const getPhotos = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await adminService.getPhotos({
    page: Number(page),
    limit: Number(limit)
  });
  ResponseHelper.success(res, result);
});

/**
 * 获取信件列表
 */
export const getLetters = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, status } = req.query;
  const result = await adminService.getLetters(
    { page: Number(page), limit: Number(limit) },
    status as string
  );
  ResponseHelper.success(res, result);
});
