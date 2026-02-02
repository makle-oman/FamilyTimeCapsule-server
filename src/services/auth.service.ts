import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { generateInviteCode } from '../utils/helpers';
import { JwtPayload, ResponseCode } from '../types';

// 默认头像列表（8个可爱的emoji头像）
const DEFAULT_AVATARS = [
  'default:1', // 😊 黄色
  'default:2', // 😎 绿色
  'default:3', // 🥰 红色
  'default:4', // 😸 蓝色
  'default:5', // 🐻 紫色
  'default:6', // 🌸 粉色
  'default:7', // ⭐ 金色
  'default:8', // 🎀 玫红
];

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

export interface UpdateProfileInput {
  nickname?: string;
  avatar?: string;
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
      throw new AppError('该手机号已被注册', ResponseCode.BAD_REQUEST);
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
        throw new AppError('无效的家庭邀请码', ResponseCode.BAD_REQUEST);
      }
      familyId = family.id;
    }

    // 随机选择一个默认头像
    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

    // 创建用户
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        nickname,
        avatar: randomAvatar,
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
      throw new AppError('手机号或密码错误', ResponseCode.BAD_REQUEST);
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
   * 更新用户资料
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { nickname, avatar } = input;

    // 构建更新数据
    const updateData: { nickname?: string; avatar?: string } = {};
    if (nickname !== undefined) {
      updateData.nickname = nickname;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // 更新用户
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar,
      familyId: user.familyId,
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
