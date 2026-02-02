import { Request, Response } from 'express';
import { tagService } from '../services/tag.service';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { ResponseCode } from '../types';

/**
 * POST /api/tags/list
 * 获取用户标签列表
 */
export const getUserTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tags = await tagService.getTags(userId);
  ResponseHelper.success(res, tags, '获取成功');
});

/**
 * POST /api/tags/create
 * 创建标签
 */
export const createUserTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name } = req.body;
  const tag = await tagService.createTag(userId, { name });
  ResponseHelper.created(res, tag, '创建成功');
});

/**
 * POST /api/tags/delete
 * 删除标签
 */
export const deleteUserTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { tagId } = req.body;

  if (!tagId) {
    throw new AppError('标签ID不能为空', ResponseCode.BAD_REQUEST);
  }

  await tagService.deleteTag(userId, tagId);
  ResponseHelper.success(res, null, '删除成功');
});
