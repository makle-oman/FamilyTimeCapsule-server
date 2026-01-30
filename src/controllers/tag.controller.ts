import { Request, Response } from 'express';
import { tagService } from '../services/tag.service';
import { ResponseHelper } from '../utils/response';
import { asyncHandler } from '../middlewares';

/**
 * GET /api/tags
 * 获取用户标签列表
 */
export const getUserTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tags = await tagService.getTags(userId);
  ResponseHelper.success(res, tags);
});

/**
 * POST /api/tags
 * 创建标签
 */
export const createUserTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { name } = req.body;
  const tag = await tagService.createTag(userId, { name });
  ResponseHelper.created(res, tag, '创建成功');
});

/**
 * DELETE /api/tags/:tagId
 * 删除标签
 */
export const deleteUserTag = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { tagId } = req.params;
  await tagService.deleteTag(userId, tagId);
  ResponseHelper.success(res, null, '删除成功');
});
