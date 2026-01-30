import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';

export interface CreateTagInput {
  name: string;
}

class TagService {
  /**
   * 获取用户的所有标签
   */
  async getTags(userId: string) {
    const tags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
      },
    });

    return tags;
  }

  /**
   * 创建标签
   */
  async createTag(userId: string, input: CreateTagInput) {
    const { name } = input;

    // 检查是否已存在同名标签
    const existingTag = await prisma.tag.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existingTag) {
      throw new AppError('标签已存在', 400);
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    return tag;
  }

  /**
   * 删除标签
   */
  async deleteTag(userId: string, tagId: string) {
    // 检查标签是否存在且属于该用户
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      throw new AppError('标签不存在', 404);
    }

    if (tag.userId !== userId) {
      throw new AppError('无权删除此标签', 403);
    }

    await prisma.tag.delete({
      where: { id: tagId },
    });

    return { success: true };
  }
}

export const tagService = new TagService();
