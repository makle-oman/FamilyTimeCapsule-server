import { prisma } from '../config/database';
import { PaginationParams } from '../types';

class AdminService {
  /**
   * 获取仪表盘统计数据
   */
  async getDashboardStats() {
    const [
      userCount,
      familyCount,
      memoryCount,
      photoCount,
      letterCount,
      todayUserCount,
      todayMemoryCount,
      activeUsers
    ] = await Promise.all([
      prisma.user.count(),
      prisma.family.count(),
      prisma.memory.count(),
      prisma.photo.count(),
      prisma.letter.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.memory.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      // 7天内有活动的用户数（创建记忆的用户）
      prisma.memory.groupBy({
        by: ['authorId'],
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }).then(result => result.length)
    ]);

    return {
      userCount,
      familyCount,
      memoryCount,
      photoCount,
      letterCount,
      todayUserCount,
      todayMemoryCount,
      activeUsers
    };
  }

  /**
   * 获取近7天的趋势数据
   */
  async getTrendData() {
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const [memories, users] = await Promise.all([
        prisma.memory.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        })
      ]);

      data.push({
        date: date.toISOString().split('T')[0],
        memories,
        users
      });
    }

    return data;
  }

  /**
   * 获取用户列表（管理后台）
   */
  async getUsers(pagination: PaginationParams, keyword?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = keyword
      ? {
          OR: [
            { nickname: { contains: keyword } },
            { phone: { contains: keyword } }
          ]
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          phone: true,
          nickname: true,
          avatar: true,
          createdAt: true,
          family: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              memories: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      items: users.map(u => ({
        id: u.id,
        phone: u.phone,
        nickname: u.nickname,
        avatar: u.avatar,
        createdAt: u.createdAt,
        familyId: u.family?.id || null,
        familyName: u.family?.name || null,
        memoriesCount: u._count.memories
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 获取家庭列表（管理后台）
   */
  async getFamilies(pagination: PaginationParams, keyword?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = keyword
      ? { name: { contains: keyword } }
      : {};

    const [families, total] = await Promise.all([
      prisma.family.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slogan: true,
          inviteCode: true,
          establishedYear: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
              memories: true,
              photos: true,
              letters: true
            }
          }
        }
      }),
      prisma.family.count({ where })
    ]);

    return {
      items: families.map(f => ({
        id: f.id,
        name: f.name,
        slogan: f.slogan,
        inviteCode: f.inviteCode,
        establishedYear: f.establishedYear,
        createdAt: f.createdAt,
        membersCount: f._count.members,
        memoriesCount: f._count.memories,
        photosCount: f._count.photos,
        lettersCount: f._count.letters
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 获取记忆列表（管理后台）
   */
  async getMemories(pagination: PaginationParams, type?: string, keyword?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (keyword) {
      where.OR = [
        { content: { contains: keyword } },
        { author: { nickname: { contains: keyword } } }
      ];
    }

    const [memories, total] = await Promise.all([
      prisma.memory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, nickname: true, avatar: true }
          },
          family: {
            select: { id: true, name: true }
          },
          images: { orderBy: { sort: 'asc' } },
          _count: {
            select: { resonances: true }
          }
        }
      }),
      prisma.memory.count({ where })
    ]);

    return {
      items: memories.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content,
        createdAt: m.createdAt,
        authorId: m.author.id,
        authorName: m.author.nickname,
        authorAvatar: m.author.avatar,
        familyId: m.family.id,
        familyName: m.family.name,
        imagesCount: m.images.length,
        resonanceCount: m._count.resonances
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 删除记忆（管理后台）
   */
  async deleteMemory(memoryId: string) {
    await prisma.memory.delete({
      where: { id: memoryId }
    });
    return { success: true };
  }

  /**
   * 获取照片列表（管理后台）
   */
  async getPhotos(pagination: PaginationParams) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [photos, total] = await Promise.all([
      prisma.photo.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          family: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.photo.count()
    ]);

    // 获取照片对应的记忆作者信息
    const memoryIds = photos.map(p => p.memoryId).filter(Boolean) as string[];
    const memories = memoryIds.length > 0
      ? await prisma.memory.findMany({
          where: { id: { in: memoryIds } },
          select: {
            id: true,
            author: {
              select: { id: true, nickname: true }
            }
          }
        })
      : [];

    const memoryAuthorMap = new Map(
      memories.map(m => [m.id, m.author])
    );

    return {
      items: photos.map(p => ({
        id: p.id,
        url: p.url,
        content: p.content,
        createdAt: p.createdAt,
        familyId: p.family.id,
        familyName: p.family.name,
        authorName: p.memoryId ? memoryAuthorMap.get(p.memoryId)?.nickname : null
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 获取信件列表（管理后台）
   */
  async getLetters(pagination: PaginationParams, status?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [letters, total] = await Promise.all([
      prisma.letter.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, nickname: true }
          },
          receiver: {
            select: { id: true, nickname: true }
          },
          family: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.letter.count({ where })
    ]);

    return {
      items: letters.map(l => ({
        id: l.id,
        content: l.content.length > 100 ? l.content.substring(0, 100) + '...' : l.content,
        status: l.status,
        createdAt: l.createdAt,
        unlockTime: l.unlockTime,
        openedAt: l.openedAt,
        senderId: l.sender.id,
        senderName: l.sender.nickname,
        receiverId: l.receiver.id,
        receiverName: l.receiver.nickname,
        familyId: l.family.id,
        familyName: l.family.name
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  // ============================================================
  // 问答管理
  // ============================================================

  /**
   * 获取问题库列表（管理后台）
   */
  async getQuestions(pagination: PaginationParams, keyword?: string) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // 获取问题库（从 question.service.ts 导出的 questionPool）
    const { questionPool } = await import('./question.service');

    // 筛选
    let filteredPool = [...questionPool];
    if (keyword) {
      filteredPool = filteredPool.filter(q => q.includes(keyword));
    }

    // 分页
    const total = filteredPool.length;
    const pagedPool = filteredPool.slice(skip, skip + limit);

    // 查询每个问题被哪些家庭使用过
    const usedQuestions = await prisma.question.findMany({
      where: {
        content: { in: pagedPool }
      },
      select: {
        content: true,
        family: {
          select: { id: true, name: true }
        },
        activeDate: true,
        _count: {
          select: { answers: true }
        }
      }
    });

    // 构建问题使用情况映射
    const usageMap = new Map<string, { families: { id: string; name: string; activeDate: Date }[]; totalAnswers: number }>();
    for (const q of usedQuestions) {
      if (!usageMap.has(q.content)) {
        usageMap.set(q.content, { families: [], totalAnswers: 0 });
      }
      const usage = usageMap.get(q.content)!;
      usage.families.push({
        id: q.family.id,
        name: q.family.name,
        activeDate: q.activeDate
      });
      usage.totalAnswers += q._count.answers;
    }

    return {
      items: pagedPool.map((content, index) => {
        const usage = usageMap.get(content);
        return {
          id: `pool-${skip + index}`, // 虚拟ID
          content,
          usedByFamilies: usage?.families || [],
          usedCount: usage?.families.length || 0,
          totalAnswers: usage?.totalAnswers || 0
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * 添加问题到问题库（管理后台）
   * 注意：这会添加到内存中的问题库，重启后会丢失
   * 如果需要持久化，应该存到数据库的单独表中
   */
  async createQuestion(data: { content: string }) {
    // 动态导入并添加到问题库
    const questionService = await import('./question.service');

    // 检查是否已存在
    if (questionService.questionPool.includes(data.content)) {
      throw new Error('该问题已存在于问题库中');
    }

    // 添加到问题库
    questionService.questionPool.push(data.content);

    return {
      id: `pool-${questionService.questionPool.length - 1}`,
      content: data.content,
      usedByFamilies: [],
      usedCount: 0,
      totalAnswers: 0
    };
  }

  /**
   * 更新问题库中的问题（管理后台）
   */
  async updateQuestion(id: string, data: { content?: string }) {
    if (!data.content) {
      throw new Error('问题内容不能为空');
    }

    // 解析索引
    const index = parseInt(id.replace('pool-', ''), 10);
    const questionService = await import('./question.service');

    if (index < 0 || index >= questionService.questionPool.length) {
      throw new Error('问题不存在');
    }

    const oldContent = questionService.questionPool[index];

    // 更新问题库
    questionService.questionPool[index] = data.content;

    // 同时更新数据库中已使用该问题的记录
    await prisma.question.updateMany({
      where: { content: oldContent },
      data: { content: data.content }
    });

    return {
      id,
      content: data.content,
      usedByFamilies: [],
      usedCount: 0,
      totalAnswers: 0
    };
  }

  /**
   * 从问题库删除问题（管理后台）
   */
  async deleteQuestion(id: string) {
    // 解析索引
    const index = parseInt(id.replace('pool-', ''), 10);
    const questionService = await import('./question.service');

    if (index < 0 || index >= questionService.questionPool.length) {
      throw new Error('问题不存在');
    }

    // 从问题库移除
    questionService.questionPool.splice(index, 1);

    return { success: true };
  }

  /**
   * 获取所有家庭列表（用于下拉选择）
   */
  async getAllFamilies() {
    const families = await prisma.family.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true
      }
    });
    return families;
  }
}

export const adminService = new AdminService();
