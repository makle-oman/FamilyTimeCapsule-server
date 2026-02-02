import { Request, Response } from 'express';
import { familyService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { ResponseCode } from '../types';

/**
 * 创建家庭
 */
export const createFamily = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name, slogan, establishedYear } = req.body;

  const family = await familyService.createFamily(userId, {
    name,
    slogan,
    establishedYear,
  });

  ResponseHelper.created(res, family, '家庭创建成功');
});

/**
 * 加入家庭
 */
export const joinFamily = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { inviteCode } = req.body;

  const family = await familyService.joinFamily(userId, inviteCode);

  ResponseHelper.success(res, family, '加入家庭成功');
});

/**
 * 获取当前用户的家庭
 */
export const getMyFamily = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const family = await familyService.getUserFamily(userId);

  ResponseHelper.success(res, family, '获取成功');
});

/**
 * 获取家庭详情
 */
export const getFamilyById = asyncHandler(async (req: Request, res: Response) => {
  const { familyId } = req.body;

  if (!familyId) {
    throw new AppError('家庭ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const family = await familyService.getFamilyById(familyId);

  ResponseHelper.success(res, family, '获取成功');
});

/**
 * 更新家庭信息
 */
export const updateFamily = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { familyId, name, slogan, coverImage } = req.body;

  if (!familyId) {
    throw new AppError('家庭ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const family = await familyService.updateFamily(familyId, userId, {
    name,
    slogan,
    coverImage,
  });

  ResponseHelper.success(res, family, '更新成功');
});

/**
 * 获取家庭成员
 */
export const getFamilyMembers = asyncHandler(async (req: Request, res: Response) => {
  const { familyId } = req.body;

  if (!familyId) {
    throw new AppError('家庭ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const members = await familyService.getFamilyMembers(familyId);

  ResponseHelper.success(res, members, '获取成功');
});

/**
 * 获取家庭统计数据
 */
export const getFamilyStats = asyncHandler(async (req: Request, res: Response) => {
  const { familyId } = req.body;

  if (!familyId) {
    throw new AppError('家庭ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const stats = await familyService.getFamilyStats(familyId);

  ResponseHelper.success(res, stats, '获取成功');
});
