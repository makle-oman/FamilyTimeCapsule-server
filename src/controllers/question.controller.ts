import { Request, Response } from 'express';
import { questionService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { prisma } from '../config/database';
import { ResponseCode } from '../types';

/**
 * 获取今日问题
 */
export const getTodayQuestion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', ResponseCode.BAD_REQUEST);
  }

  const question = await questionService.getTodayQuestion(user.familyId);

  // 检查当前用户是否已回答
  const hasAnswered = await questionService.hasAnsweredToday(userId, user.familyId);

  ResponseHelper.success(res, {
    ...question,
    hasAnswered,
  }, '获取成功');
});

/**
 * 回答问题
 */
export const answerQuestion = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { questionId, content } = req.body;

  const answer = await questionService.answerQuestion(userId, {
    questionId,
    content,
  });

  ResponseHelper.created(res, answer, '回答成功');
});

/**
 * 获取问答历史
 */
export const getQuestionHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { page, limit } = req.body;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', ResponseCode.BAD_REQUEST);
  }

  const result = await questionService.getQuestionHistory(
    user.familyId,
    page ? parseInt(page, 10) : undefined,
    limit ? parseInt(limit, 10) : undefined
  );

  ResponseHelper.success(res, result, '获取成功');
});
