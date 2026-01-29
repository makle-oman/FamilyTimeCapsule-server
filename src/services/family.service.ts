import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { generateInviteCode } from '../utils/helpers';

export interface CreateFamilyInput {
  name: string;
  slogan?: string;
  establishedYear?: number;
}

export interface UpdateFamilyInput {
  name?: string;
  slogan?: string;
  coverImage?: string;
}

class FamilyService {
  /**
   * 创建家庭
   */
  async createFamily(userId: string, input: CreateFamilyInput) {
    const { name, slogan, establishedYear } = input;

    // 检查用户是否已有家庭
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.familyId) {
      throw new AppError('您已经有一个家庭了', 400);
    }

    // 生成唯一邀请码
    let inviteCode = generateInviteCode();
    while (await prisma.family.findUnique({ where: { inviteCode } })) {
      inviteCode = generateInviteCode();
    }

    // 创建家庭并将用户加入
    const family = await prisma.family.create({
      data: {
        name,
        slogan,
        inviteCode,
        establishedYear: establishedYear || new Date().getFullYear(),
        members: {
          connect: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return family;
  }

  /**
   * 加入家庭
   */
  async joinFamily(userId: string, inviteCode: string) {
    // 检查用户是否已有家庭
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.familyId) {
      throw new AppError('您已经有一个家庭了', 400);
    }

    // 查找家庭
    const family = await prisma.family.findUnique({
      where: { inviteCode },
    });
    if (!family) {
      throw new AppError('无效的邀请码', 400);
    }

    // 加入家庭
    await prisma.user.update({
      where: { id: userId },
      data: { familyId: family.id },
    });

    return this.getFamilyById(family.id);
  }

  /**
   * 获取家庭详情
   */
  async getFamilyById(familyId: string) {
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      include: {
        members: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            memories: true,
            letters: true,
          },
        },
      },
    });

    if (!family) {
      throw new AppError('家庭不存在', 404);
    }

    return family;
  }

  /**
   * 获取用户的家庭
   */
  async getUserFamily(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { family: true },
    });

    if (!user?.familyId) {
      return null;
    }

    return this.getFamilyById(user.familyId);
  }

  /**
   * 更新家庭信息
   */
  async updateFamily(familyId: string, userId: string, input: UpdateFamilyInput) {
    // 验证用户是否属于该家庭
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.familyId !== familyId) {
      throw new AppError('您不属于该家庭', 403);
    }

    const family = await prisma.family.update({
      where: { id: familyId },
      data: input,
      include: {
        members: {
          select: {
            id: true,
            nickname: true,
            avatar: true,
          },
        },
      },
    });

    return family;
  }

  /**
   * 获取家庭成员
   */
  async getFamilyMembers(familyId: string) {
    const members = await prisma.user.findMany({
      where: { familyId },
      select: {
        id: true,
        nickname: true,
        avatar: true,
      },
    });

    return members;
  }

  /**
   * 获取家庭统计数据
   */
  async getFamilyStats(familyId: string) {
    const [memoriesCount, lettersCount, resonanceCount] = await Promise.all([
      prisma.memory.count({ where: { familyId } }),
      prisma.letter.count({ where: { familyId } }),
      prisma.resonance.count({
        where: {
          memory: { familyId },
        },
      }),
    ]);

    // 获取平行视角数量（多人记录同一件事）
    const parallelViewsCount = await prisma.parallelView.count({
      where: {
        memory: { familyId },
      },
    });

    return {
      memoriesCount,
      lettersCount,
      resonanceCount,
      parallelMoments: parallelViewsCount,
    };
  }
}

export const familyService = new FamilyService();
