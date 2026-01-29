import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ResponseHelper } from '../utils/response';
import { config } from '../config';

/**
 * 自定义错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 全局错误处理中间件
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error(`[${req.method}] ${req.path} - ${err.message}`, {
    stack: err.stack,
    body: req.body,
    query: req.query,
  });

  if (err instanceof AppError) {
    ResponseHelper.error(res, err.message, err.statusCode);
    return;
  }

  // 开发环境返回详细错误
  if (config.env === 'development') {
    ResponseHelper.error(res, err.message || '服务器内部错误', 500);
    return;
  }

  // 生产环境返回通用错误
  ResponseHelper.serverError(res, '服务器内部错误');
}

/**
 * 404 处理中间件
 */
export function notFoundHandler(req: Request, res: Response): void {
  ResponseHelper.notFound(res, `路径 ${req.originalUrl} 不存在`);
}

/**
 * 异步错误包装器
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
