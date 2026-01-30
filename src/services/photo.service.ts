import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { PaginationParams } from '../types';

class PhotoService {
  /**
   * 获取家庭相册（从 memory 表中过滤出有图片的记录）
   */
  async getPhotos(familyId: string, pagination: PaginationParams, tag?: string) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    // 查询有图片的 memory
    const where: any = {
      familyId,
      images: { some: {} },
    };

    // 按标签过滤
    if (tag) {
      where.tags = { contains: tag };
    }

    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
          images: { orderBy: { sort: 'asc' } },
        },
      }),
      prisma.memory.count({ where }),
    ]);

    // 将 memory 的图片展平为照片列表
    const photos: any[] = [];
    for (const memory of memories) {
      const tags = typeof memory.tags === 'string' ? JSON.parse(memory.tags) : (memory.tags || []);
      for (const img of memory.images) {
        photos.push({
          id: img.id,
          url: img.url,
          content: memory.content,
          authorId: memory.author?.id,
          authorName: memory.author?.nickname || '未知',
          authorAvatar: memory.author?.avatar || '',
          memoryId: memory.id,
          tags,
          createdAt: memory.createdAt,
        });
      }
    }

    return {
      items: photos,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单张照片详情（通过 memoryImage id）
   */
  async getPhotoById(photoId: string) {
    const image = await prisma.memoryImage.findUnique({
      where: { id: photoId },
      include: {
        memory: {
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
          },
        },
      },
    });

    if (!image) {
      throw new AppError('照片不存在', 404);
    }

    const tags = typeof image.memory.tags === 'string'
      ? JSON.parse(image.memory.tags)
      : (image.memory.tags || []);

    return {
      id: image.id,
      url: image.url,
      content: image.memory.content,
      authorId: image.memory.author?.id,
      authorName: image.memory.author?.nickname || '未知',
      authorAvatar: image.memory.author?.avatar || '',
      memoryId: image.memory.id,
      tags,
      createdAt: image.memory.createdAt,
    };
  }

  /**
   * 获取家庭相册中所有使用过的标签
   */
  async getPhotoTags(familyId: string) {
    const memories = await prisma.memory.findMany({
      where: {
        familyId,
        images: { some: {} },
      },
      select: { tags: true },
    });

    const tagSet = new Set<string>();
    for (const memory of memories) {
      const tags = typeof memory.tags === 'string' ? JSON.parse(memory.tags) : memory.tags;
      if (Array.isArray(tags)) {
        for (const tag of tags) {
          tagSet.add(tag);
        }
      }
    }

    return Array.from(tagSet);
  }
}

export const photoService = new PhotoService();
