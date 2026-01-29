import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { PaginationParams } from '../types';

class PhotoService {
  /**
   * 获取家庭相册（瀑布流）
   */
  async getPhotos(familyId: string, pagination: PaginationParams, tag?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = { familyId };
    if (tag) {
      where.aiTags = { has: tag };
    }

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.photo.count({ where }),
    ]);

    return {
      items: photos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单张照片详情
   */
  async getPhotoById(photoId: string) {
    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new AppError('照片不存在', 404);
    }

    return photo;
  }

  /**
   * 获取所有可用标签
   */
  async getTags(familyId: string): Promise<string[]> {
    const photos = await prisma.photo.findMany({
      where: { familyId },
      select: { aiTags: true },
    });

    // 收集所有标签并去重
    const tagSet = new Set<string>();
    for (const photo of photos) {
      for (const tag of photo.aiTags) {
        tagSet.add(tag);
      }
    }

    return Array.from(tagSet);
  }

  /**
   * 更新照片标签
   */
  async updatePhotoTags(photoId: string, tags: string[]) {
    const photo = await prisma.photo.update({
      where: { id: photoId },
      data: { aiTags: tags },
    });

    return photo;
  }
}

export const photoService = new PhotoService();
