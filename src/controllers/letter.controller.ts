import { Request, Response } from 'express';
import { letterService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { prisma } from '../config/database';
import { ResponseCode } from '../types';

/**
 * 创建信件
 */
export const createLetter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { content, receiverId, unlockTime } = req.body;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', ResponseCode.BAD_REQUEST);
  }

  const letter = await letterService.createLetter(userId, user.familyId, {
    content,
    receiverId,
    unlockTime: new Date(unlockTime),
  });

  ResponseHelper.created(res, letter, '信件已封存');
});

/**
 * 获取待开启的信件
 */
export const getPendingLetters = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const letters = await letterService.getPendingLetters(userId);

  ResponseHelper.success(res, letters, '获取成功');
});

/**
 * 打开信件
 */
export const openLetter = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { letterId } = req.body;

  if (!letterId) {
    throw new AppError('信件ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const letter = await letterService.openLetter(userId, letterId);

  ResponseHelper.success(res, letter, '信件已打开');
});

/**
 * 获取已发送的信件
 */
export const getSentLetters = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { page, limit } = req.body;

  const result = await letterService.getSentLetters(userId, {
    page: page ? parseInt(page, 10) : undefined,
    limit: limit ? parseInt(limit, 10) : undefined,
  });

  ResponseHelper.success(res, result, '获取成功');
});

/**
 * 获取已打开的信件（书架）
 */
export const getOpenedLetters = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { year } = req.body;

  const letters = await letterService.getOpenedLetters(
    userId,
    year ? parseInt(year, 10) : undefined
  );

  ResponseHelper.success(res, letters, '获取成功');
});

/**
 * 获取信件年份列表
 */
export const getLetterYears = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const years = await letterService.getLetterYears(userId);

  ResponseHelper.success(res, years, '获取成功');
});
