import { Request, Response } from 'express';
import { photoService } from '../services';
import { ResponseHelper } from '../utils/response';
import { asyncHandler, AppError } from '../middlewares';
import { prisma } from '../config/database';
import { ResponseCode } from '../types';

/**
 * 获取家庭相册
 */
export const getPhotos = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { page, limit, tag } = req.body;

  // 获取用户的家庭ID
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    throw new AppError('请先加入一个家庭', ResponseCode.BAD_REQUEST);
  }

  const result = await photoService.getPhotos(
    user.familyId,
    {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    },
    tag
  );

  ResponseHelper.success(res, result, '获取成功');
});

/**
 * 获取单张照片
 */
export const getPhotoById = asyncHandler(async (req: Request, res: Response) => {
  const { photoId } = req.body;

  if (!photoId) {
    throw new AppError('照片ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const photo = await photoService.getPhotoById(photoId);

  ResponseHelper.success(res, photo, '获取成功');
});

/**
 * 获取所有标签（从有图片的记忆中提取）
 */
export const getTags = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.familyId) {
    ResponseHelper.success(res, [], '获取成功');
    return;
  }

  const tags = await photoService.getPhotoTags(user.familyId);
  ResponseHelper.success(res, tags, '获取成功');
});

/**
 * 更新照片标签
 */
export const updatePhotoTags = asyncHandler(async (req: Request, res: Response) => {
  const { photoId, tags } = req.body;

  if (!photoId) {
    throw new AppError('照片ID不能为空', ResponseCode.BAD_REQUEST);
  }

  const photo = await photoService.updatePhotoTags(photoId, tags);

  ResponseHelper.success(res, photo, '标签更新成功');
});
