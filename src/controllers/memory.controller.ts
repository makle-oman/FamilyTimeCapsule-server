import { Request, Response } from 'express';
import { memoryService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { prisma } from '../config/database';
import { ResponseCode } from '../types';

/**
 * 创建记忆
 */
export const createMemory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { type, content, tags, images, voiceDuration, voiceUrl } = req.body;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', ResponseCode.BAD_REQUEST);
  }

  const memory = await memoryService.createMemory(userId, user.familyId, {
    type,
    content,
    tags,
    images,
    voiceDuration,
    voiceUrl,
  });

  ResponseHelper.created(res, memory, '记录成功');
});

/**
 * 获取时光轴记忆列表
 */
export const getMemories = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { page, limit } = req.body;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', ResponseCode.BAD_REQUEST);
  }

  const result = await memoryService.getMemories(user.familyId, {
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });

  ResponseHelper.success(res, result, '获取成功');
});

/**
 * 获取单个记忆详情
 */
export const getMemoryById = asyncHandler(async (req: Request, res: Response) => {
  const { memoryId } = req.body;

  if (!memoryId) {
    throw new AppError('记忆ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const memory = await memoryService.getMemoryById(memoryId);

  ResponseHelper.success(res, memory, '获取成功');
});

/**
 * 获取一年前今天的记忆
 */
export const getYearAgoMemories = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    ResponseHelper.success(res, [], '获取成功');
    return;
  }

  const memories = await memoryService.getYearAgoMemories(user.familyId);

  ResponseHelper.success(res, memories, '获取成功');
});

/**
 * 添加平行视角
 */
export const addParallelView = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { memoryId, content, images, tags } = req.body;

  const parallelView = await memoryService.addParallelView(userId, {
    memoryId,
    content,
    images,
    tags,
  });

  ResponseHelper.created(res, parallelView, '视角添加成功');
});

/**
 * 添加/取消共鸣 (toggle)
 */
export const addResonance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { memoryId, parallelViewId } = req.body;

  if (!memoryId) {
    throw new AppError('记忆ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const result = await memoryService.addResonance(userId, memoryId, parallelViewId);

  ResponseHelper.success(res, result, result.action === 'added' ? '已共鸣' : '已取消共鸣');
});

/**
 * 取消共鸣 (保留兼容)
 */
export const removeResonance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { memoryId, parallelViewId } = req.body;

  await memoryService.removeResonance(userId, memoryId, parallelViewId);

  ResponseHelper.success(res, null, '已取消共鸣');
});
