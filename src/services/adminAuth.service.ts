import jwt from 'jsonwebtoken';
import svgCaptcha from 'svg-captcha';
import { config } from '../config';
import { AppError } from '../middlewares/error.middleware';
import { ResponseCode } from '../types';

// 管理员账号配置
const ADMIN_ACCOUNT = {
  username: '17878537074',
  password: 'xiaoyi1314.',
  nickname: '管理员',
  avatar: '',
  roles: ['admin'],
  permissions: ['*:*:*']
};

// 验证码存储（简单内存存储，生产环境应使用Redis）
const captchaStore = new Map<string, { text: string; expires: number }>();

// 定期清理过期验证码
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of captchaStore.entries()) {
    if (value.expires < now) {
      captchaStore.delete(key);
    }
  }
}, 60000); // 每分钟清理一次

class AdminAuthService {
  /**
   * 生成图形验证码
   */
  generateCaptcha() {
    const captcha = svgCaptcha.create({
      size: 4,               // 验证码长度
      ignoreChars: '0o1ilI', // 排除容易混淆的字符
      noise: 2,              // 干扰线条数
      color: true,           // 彩色
      background: '#f0f0f0', // 背景色
      width: 120,
      height: 40
    });

    // 生成唯一ID
    const captchaId = `captcha_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 存储验证码，5分钟过期
    captchaStore.set(captchaId, {
      text: captcha.text.toLowerCase(),
      expires: Date.now() + 5 * 60 * 1000
    });

    return {
      captchaId,
      captchaImg: captcha.data  // SVG格式的验证码图片
    };
  }

  /**
   * 验证验证码
   */
  verifyCaptcha(captchaId: string, captchaCode: string): boolean {
    const stored = captchaStore.get(captchaId);

    if (!stored) {
      return false;
    }

    // 检查是否过期
    if (stored.expires < Date.now()) {
      captchaStore.delete(captchaId);
      return false;
    }

    // 验证成功后删除验证码（一次性使用）
    const isValid = stored.text === captchaCode.toLowerCase();
    if (isValid) {
      captchaStore.delete(captchaId);
    }

    return isValid;
  }

  /**
   * 管理员登录
   */
  async login(username: string, password: string, captchaId: string, captchaCode: string) {
    // 验证验证码
    if (!this.verifyCaptcha(captchaId, captchaCode)) {
      throw new AppError('验证码错误或已过期', ResponseCode.BAD_REQUEST);
    }

    // 验证账号密码
    if (username !== ADMIN_ACCOUNT.username || password !== ADMIN_ACCOUNT.password) {
      throw new AppError('账号或密码错误', ResponseCode.SERVER_ERROR);
    }

    // 生成JWT token
    const accessToken = jwt.sign(
      { userId: 'admin', username: ADMIN_ACCOUNT.username, role: 'admin' },
      config.jwt.secret,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: 'admin', username: ADMIN_ACCOUNT.username, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '7d' }
    );

    // 计算过期时间
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return {
      avatar: ADMIN_ACCOUNT.avatar,
      username: ADMIN_ACCOUNT.username,
      nickname: ADMIN_ACCOUNT.nickname,
      roles: ADMIN_ACCOUNT.roles,
      permissions: ADMIN_ACCOUNT.permissions,
      accessToken,
      refreshToken,
      expires: expires.toISOString().replace('T', ' ').substring(0, 19)
    };
  }

  /**
   * 刷新Token
   */
  async refreshToken(refreshTokenStr: string) {
    try {
      const decoded = jwt.verify(refreshTokenStr, config.jwt.secret) as any;

      if (decoded.type !== 'refresh') {
        throw new AppError('无效的刷新令牌', ResponseCode.UNAUTHORIZED);
      }

      // 生成新的token
      const accessToken = jwt.sign(
        { userId: 'admin', username: decoded.username, role: 'admin' },
        config.jwt.secret,
        { expiresIn: '24h' }
      );

      const newRefreshToken = jwt.sign(
        { userId: 'admin', username: decoded.username, type: 'refresh' },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expires: expires.toISOString().replace('T', ' ').substring(0, 19)
      };
    } catch (error) {
      throw new AppError('刷新令牌无效或已过期', ResponseCode.UNAUTHORIZED);
    }
  }
}

export const adminAuthService = new AdminAuthService();
