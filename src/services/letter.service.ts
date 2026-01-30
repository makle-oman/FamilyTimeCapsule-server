import { prisma } from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { PaginationParams } from '../types';

export interface CreateLetterInput {
  content: string;
  receiverId: string;
  unlockTime: Date;
}

class LetterService {
  /**
   * 创建信件（封存）
   */
  async createLetter(userId: string, familyId: string, input: CreateLetterInput) {
    const { content, receiverId, unlockTime } = input;

    // 验证收件人是否是家庭成员
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver || receiver.familyId !== familyId) {
      throw new AppError('收件人不是您的家庭成员', 400);
    }

    // 解锁时间必须是未来
    if (new Date(unlockTime) <= new Date()) {
      throw new AppError('送达时间必须是未来', 400);
    }

    const letter = await prisma.letter.create({
      data: {
        content,
        unlockTime: new Date(unlockTime),
        senderId: userId,
        receiverId,
        familyId,
      },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
        receiver: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return letter;
  }

  /**
   * 获取待开启的信件
   */
  async getPendingLetters(userId: string) {
    const now = new Date();

    // 首先更新状态为可解锁的信件
    await prisma.letter.updateMany({
      where: {
        receiverId: userId,
        status: 'SEALED',
        unlockTime: { lte: now },
      },
      data: { status: 'UNLOCKABLE' },
    });

    // 获取未开启的信件
    const letters = await prisma.letter.findMany({
      where: {
        receiverId: userId,
        status: { in: ['SEALED', 'UNLOCKABLE'] },
      },
      orderBy: { unlockTime: 'asc' },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return letters.map((letter) => ({
      ...letter,
      daysUntilUnlock: Math.max(
        0,
        Math.ceil((letter.unlockTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      ),
      canOpen: letter.status === 'UNLOCKABLE',
    }));
  }

  /**
   * 打开信件
   */
  async openLetter(userId: string, letterId: string) {
    const letter = await prisma.letter.findUnique({
      where: { id: letterId },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    if (!letter) {
      throw new AppError('信件不存在', 404);
    }

    if (letter.receiverId !== userId) {
      throw new AppError('这不是写给您的信', 403);
    }

    if (letter.status === 'SEALED' && letter.unlockTime > new Date()) {
      throw new AppError('还没到开启时间', 400);
    }

    if (letter.status === 'OPENED') {
      return letter;
    }

    const updatedLetter = await prisma.letter.update({
      where: { id: letterId },
      data: {
        status: 'OPENED',
        openedAt: new Date(),
      },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return updatedLetter;
  }

  /**
   * 获取已发送的信件
   */
  async getSentLetters(userId: string, pagination: PaginationParams) {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [letters, total] = await Promise.all([
      prisma.letter.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          receiver: { select: { id: true, nickname: true, avatar: true } },
        },
      }),
      prisma.letter.count({ where: { senderId: userId } }),
    ]);

    return {
      items: letters,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取已收到并打开的信件（书架）
   */
  async getOpenedLetters(userId: string, year?: number) {
    const where: any = {
      receiverId: userId,
      status: 'OPENED',
    };

    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year + 1, 0, 1);
      where.openedAt = {
        gte: startOfYear,
        lt: endOfYear,
      };
    }

    const letters = await prisma.letter.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: {
        sender: { select: { id: true, nickname: true, avatar: true } },
      },
    });

    return letters;
  }

  /**
   * 获取信件年份列表（用于书架展示）
   */
  async getLetterYears(userId: string): Promise<number[]> {
    const letters = await prisma.letter.findMany({
      where: {
        receiverId: userId,
        status: 'OPENED',
        openedAt: { not: null },
      },
      select: { openedAt: true },
    });

    const years = new Set<number>();
    for (const letter of letters) {
      if (letter.openedAt) {
        years.add(letter.openedAt.getFullYear());
      }
    }

    return Array.from(years).sort((a, b) => b - a);
  }
}

export const letterService = new LetterService();
