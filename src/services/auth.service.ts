import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { generateInviteCode } from '../utils/helpers';
import { JwtPayload } from '../types';

export interface RegisterInput {
  phone: string;
  password: string;
  nickname: string;
  familyCode?: string;
}

export interface LoginInput {
  phone: string;
  password: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    phone: string;
    nickname: string;
    avatar: string | null;
    familyId: string | null;
  };
}

class AuthService {
  /**
   * 用户注册
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    const { phone, password, nickname, familyCode } = input;

    // 检查手机号是否已注册
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      throw new AppError('该手机号已被注册', 400);
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    let familyId: string | undefined;

    // 如果有家庭邀请码，验证并加入家庭
    if (familyCode) {
      const family = await prisma.family.findUnique({
        where: { inviteCode: familyCode },
      });
      if (!family) {
        throw new AppError('无效的家庭邀请码', 400);
      }
      familyId = family.id;
    }

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        nickname,
        familyId,
      },
    });

    // 生成 JWT
    const token = this.generateToken({ userId: user.id, phone: user.phone });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        familyId: user.familyId,
      },
    };
  }

  /**
   * 用户登录
   */
  async login(input: LoginInput): Promise<AuthResult> {
    const { phone, password } = input;

    // 查找用户
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      throw new AppError('手机号或密码错误', 500);
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('手机号或密码错误', 500);
    }

    // 生成 JWT
    const token = this.generateToken({ userId: user.id, phone: user.phone });

    return {
      token,
      user: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        familyId: user.familyId,
      },
    };
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        family: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
            establishedYear: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      family: user.family,
    };
  }

  /**
   * 生成 JWT Token
   */
  private generateToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string,
    } as jwt.SignOptions);
  }
}

export const authService = new AuthService();
