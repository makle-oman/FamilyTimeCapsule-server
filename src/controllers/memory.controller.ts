import { Request, Response } from 'express';
import { memoryService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { prisma } from '../config/database';

/**
 * 创建记忆
 */
export const createMemory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { type, content, tags, images, voiceDuration, voiceUrl } = req.body;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', 400);
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
  const page = req.query.page as string | undefined;
  const limit = req.query.limit as string | undefined;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', 400);
  }

  const result = await memoryService.getMemories(user.familyId, {
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });

  ResponseHelper.success(res, result);
});

/**
 * 获取单个记忆详情
 */
export const getMemoryById = asyncHandler(async (req: Request, res: Response) => {
  const memoryId = req.params.memoryId as string;

  const memory = await memoryService.getMemoryById(memoryId);

  ResponseHelper.success(res, memory);
});

/**
 * 获取一年前今天的记忆
 */
export const getYearAgoMemories = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    ResponseHelper.success(res, []);
    return;
  }

  const memories = await memoryService.getYearAgoMemories(user.familyId);

  ResponseHelper.success(res, memories);
});

/**
 * 添加平行视角
 */
export const addParallelView = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const memoryId = req.params.memoryId as string;
  const { content, images, tags } = req.body;

  const parallelView = await memoryService.addParallelView(userId, {
    memoryId,
    content,
    images,
    tags,
  });

  ResponseHelper.created(res, parallelView, '视角添加成功');
});

/**
 * 添加共鸣
 */
export const addResonance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const memoryId = req.params.memoryId as string;
  const { parallelViewId } = req.body;

  await memoryService.addResonance(userId, memoryId, parallelViewId);

  ResponseHelper.success(res, { success: true }, '已共鸣');
});

/**
 * 取消共鸣
 */
export const removeResonance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const memoryId = req.params.memoryId as string;
  const { parallelViewId } = req.body;

  await memoryService.removeResonance(userId, memoryId, parallelViewId);

  ResponseHelper.success(res, { success: true }, '已取消共鸣');
});
