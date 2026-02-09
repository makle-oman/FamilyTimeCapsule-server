import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { getYearAgoToday, isSameDay } from '../utils/helpers';
import { emitAdminNotification } from '../utils/socket';
import { PaginationParams } from '../types';

export interface CreateMemoryInput {
  type: string;
  content: string;
  tags?: string[];
  images?: string[];
  voiceDuration?: number;
  voiceUrl?: string;
}

export interface CreateParallelViewInput {
  memoryId: string;
  content: string;
  images?: string[];
  tags?: string[];
}

class MemoryService {
  /**
   * 创建记忆
   */
  async createMemory(userId: string, familyId: string, input: CreateMemoryInput) {
    const { type, content, tags = [], images = [], voiceDuration, voiceUrl } = input;

    // 创建记忆
    const memory = await prisma.memory.create({
      data: {
        type,
        content,
        tags: JSON.stringify(tags),
        voiceDuration,
        voiceUrl,
        authorId: userId,
        familyId,
        images: {
          create: images.map((url, index) => ({
            url,
            sort: index,
          })),
        },
      },
      include: {
        author: {
          select: { id: true, nickname: true, avatar: true },
        },
        images: { orderBy: { sort: 'asc' } },
        _count: { select: { resonances: true } },
      },
    });

    // 如果是照片类型，同步到相册
    if (type === 'PHOTO' && images.length > 0) {
      await prisma.photo.createMany({
        data: images.map((url) => ({
          url,
          content: content,
          memoryId: memory.id,
          familyId,
        })),
      });
    }

    // 推送通知到管理后台
    const family = await prisma.family.findUnique({ where: { id: familyId } });
    emitAdminNotification('memory:created', {
      type: 'memory',
      id: memory.id,
      title: `${memory.author.nickname} 创建了新回忆`,
      description: content.length > 50 ? content.slice(0, 50) + '...' : content,
      familyName: family?.name || '未知家庭',
      authorName: memory.author.nickname,
      createdAt: memory.createdAt.toISOString(),
    });

    return this.formatMemory(memory);
  }

  /**
   * 获取时光轴记忆列表
   */
  async getMemories(familyId: string, pagination: PaginationParams) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where: { familyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true },
          },
          images: { orderBy: { sort: 'asc' } },
          parallelViews: {
            include: {
              author: {
                select: { id: true, nickname: true, avatar: true },
              },
              _count: { select: { resonances: true } },
            },
          },
          _count: { select: { resonances: true } },
        },
      }),
      prisma.memory.count({ where: { familyId } }),
    ]);

    return {
      items: memories.map((m) => this.formatMemory(m)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取单个记忆详情
   */
  async getMemoryById(memoryId: string) {
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: {
        author: {
          select: { id: true, nickname: true, avatar: true },
        },
        images: { orderBy: { sort: 'asc' } },
        parallelViews: {
          include: {
            author: {
              select: { id: true, nickname: true, avatar: true },
            },
            _count: { select: { resonances: true } },
          },
        },
        _count: { select: { resonances: true } },
      },
    });

    if (!memory) {
      throw new AppError('记忆不存在', 404);
    }

    return this.formatMemory(memory);
  }

  /**
   * 获取一年前今天的记忆（记忆唤醒）
   */
  async getYearAgoMemories(familyId: string) {
    const yearAgo = getYearAgoToday();
    const nextDay = new Date(yearAgo);
    nextDay.setDate(nextDay.getDate() + 1);

    const memories = await prisma.memory.findMany({
      where: {
        familyId,
        createdAt: {
          gte: yearAgo,
          lt: nextDay,
        },
      },
      include: {
        author: {
          select: { id: true, nickname: true, avatar: true },
        },
        images: { orderBy: { sort: 'asc' } },
        _count: { select: { resonances: true } },
      },
    });

    return memories.map((m) => this.formatMemory(m));
  }

  /**
   * 添加平行视角
   */
  async addParallelView(userId: string, input: CreateParallelViewInput) {
    const { memoryId, content, images = [], tags = [] } = input;

    // 检查记忆是否存在
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
      include: { author: true },
    });

    if (!memory) {
      throw new AppError('记忆不存在', 404);
    }

    // 检查用户是否是同一家庭的成员
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.familyId !== memory.familyId) {
      throw new AppError('您不属于该家庭', 403);
    }

    // 检查是否已经添加过视角
    const existingView = await prisma.parallelView.findUnique({
      where: {
        memoryId_authorId: {
          memoryId,
          authorId: userId,
        },
      },
    });

    if (existingView) {
      throw new AppError('您已经添加过视角了', 400);
    }

    // 不能给自己的记忆添加平行视角
    if (memory.authorId === userId) {
      throw new AppError('不能给自己的记忆添加平行视角', 400);
    }

    const parallelView = await prisma.parallelView.create({
      data: {
        content,
        images: JSON.stringify(images),
        tags: JSON.stringify(tags),
        memoryId,
        authorId: userId,
      },
      include: {
        author: {
          select: { id: true, nickname: true, avatar: true },
        },
        _count: { select: { resonances: true } },
      },
    });

    return {
      ...parallelView,
      images: JSON.parse(parallelView.images),
      tags: JSON.parse(parallelView.tags),
    };
  }

  /**
   * 添加共鸣（同一用户可对不同记忆共鸣，对同一条记忆重复点击则取消共鸣）
   */
  async addResonance(userId: string, memoryId: string, parallelViewId?: string) {
    // 精确匹配：检查用户是否已对这条具体的 memory 或 parallelView 共鸣过
    const whereCondition = parallelViewId
      ? { userId, parallelViewId }
      : { userId, memoryId, parallelViewId: null };

    const existingResonance = await prisma.resonance.findFirst({
      where: whereCondition,
    });

    if (existingResonance) {
      // 已共鸣则取消（toggle 效果）
      await prisma.resonance.delete({
        where: { id: existingResonance.id },
      });
      return { success: true, action: 'removed' };
    }

    await prisma.resonance.create({
      data: {
        userId,
        memoryId: parallelViewId ? null : memoryId,
        parallelViewId,
      },
    });

    return { success: true, action: 'added' };
  }

  /**
   * 取消共鸣
   */
  async removeResonance(userId: string, memoryId: string, parallelViewId?: string) {
    await prisma.resonance.deleteMany({
      where: {
        userId,
        memoryId: parallelViewId ? null : memoryId,
        parallelViewId,
      },
    });

    return { success: true };
  }

  /**
   * 检查用户是否已共鸣
   */
  async hasResonance(userId: string, memoryId: string): Promise<boolean> {
    const resonance = await prisma.resonance.findFirst({
      where: {
        userId,
        OR: [{ memoryId }, { memory: { id: memoryId } }],
      },
    });
    return !!resonance;
  }

  /**
   * 格式化记忆数据
   */
  private formatMemory(memory: any) {
    const yearAgo = getYearAgoToday();
    const isOldMemory = isSameDay(new Date(memory.createdAt), yearAgo);

    // 解析 JSON 字符串
    const tags = typeof memory.tags === 'string' ? JSON.parse(memory.tags) : memory.tags;

    return {
      id: memory.id,
      type: memory.type,
      content: memory.content,
      tags,
      voiceDuration: memory.voiceDuration,
      voiceUrl: memory.voiceUrl,
      createdAt: memory.createdAt,
      isOldMemory,
      author: memory.author,
      images: memory.images?.map((img: any) => img.url) || [],
      resonanceCount: memory._count?.resonances || 0,
      parallelViews: memory.parallelViews?.map((view: any) => ({
        id: view.id,
        content: view.content,
        images: typeof view.images === 'string' ? JSON.parse(view.images) : view.images,
        tags: typeof view.tags === 'string' ? JSON.parse(view.tags) : view.tags,
        createdAt: view.createdAt,
        author: view.author,
        resonanceCount: view._count?.resonances || 0,
      })),
    };
  }
}

export const memoryService = new MemoryService();
