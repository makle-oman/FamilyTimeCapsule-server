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

    // SQLite 使用字符串存储 JSON，需要用 contains 查询
    const where: any = { familyId };
    if (tag) {
      where.aiTags = { contains: tag };
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

    // 解析 JSON 字符串
    const formattedPhotos = photos.map((photo) => ({
      ...photo,
      aiTags: typeof photo.aiTags === 'string' ? JSON.parse(photo.aiTags) : photo.aiTags,
    }));

    return {
      items: formattedPhotos,
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

    return {
      ...photo,
      aiTags: typeof photo.aiTags === 'string' ? JSON.parse(photo.aiTags) : photo.aiTags,
    };
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
      const tags = typeof photo.aiTags === 'string' ? JSON.parse(photo.aiTags) : photo.aiTags;
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          tagSet.add(tag);
        }
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
      data: { aiTags: JSON.stringify(tags) },
    });

    return {
      ...photo,
      aiTags: tags,
    };
  }
}

export const photoService = new PhotoService();
