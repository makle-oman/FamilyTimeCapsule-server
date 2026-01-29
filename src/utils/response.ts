import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '../types';

/**
 * 统一的响应工具类
 */
export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(res: Response, data?: T, message?: string, statusCode = 200): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * 创建成功响应
   */
  static created<T>(res: Response, data: T, message = '创建成功'): Response {
    return ResponseHelper.success(res, data, message, 201);
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number
  ): Response {
    const paginatedData: PaginatedResponse<T> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    return ResponseHelper.success(res, paginatedData);
  }

  /**
   * 错误响应
   */
  static error(res: Response, message: string, statusCode = 400): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
    };
    return res.status(statusCode).json(response);
  }

  /**
   * 未授权响应
   */
  static unauthorized(res: Response, message = '未授权访问'): Response {
    return ResponseHelper.error(res, message, 401);
  }

  /**
   * 禁止访问响应
   */
  static forbidden(res: Response, message = '禁止访问'): Response {
    return ResponseHelper.error(res, message, 403);
  }

  /**
   * 未找到响应
   */
  static notFound(res: Response, message = '资源不存在'): Response {
    return ResponseHelper.error(res, message, 404);
  }

  /**
   * 服务器错误响应
   */
  static serverError(res: Response, message = '服务器内部错误'): Response {
    return ResponseHelper.error(res, message, 500);
  }
}
