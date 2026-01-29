import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ResponseHelper } from '../utils/response';
import { JwtPayload } from '../types';
import { prisma } from '../config/database';

/**
 * JWT 认证中间件
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseHelper.unauthorized(res, '请先登录');
      return;
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // 验证用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      ResponseHelper.unauthorized(res, '用户不存在');
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      ResponseHelper.unauthorized(res, '登录已过期，请重新登录');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      ResponseHelper.unauthorized(res, '无效的登录凭证');
      return;
    }
    ResponseHelper.serverError(res, '认证失败');
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.user = decoded;
    }

    next();
  } catch {
    // 可选认证，忽略错误
    next();
  }
}
