import { Response } from 'express';
import { ApiResponse, PaginatedResponse, ResponseCode } from '../types';

/**
 * 统一的响应工具类
 * 响应格式: { code: number, data: any, message: string }
 */
export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T>(res: Response, data?: T, message = '操作成功'): Response {
    const response: ApiResponse<T> = {
      code: ResponseCode.SUCCESS,
      data: data ?? null,
      message,
    };
    return res.status(200).json(response);
  }

  /**
   * 创建成功响应
   */
  static created<T>(res: Response, data: T, message = '创建成功'): Response {
    return ResponseHelper.success(res, data, message);
  }

  /**
   * 分页响应
   */
  static paginated<T>(
    res: Response,
    items: T[],
    total: number,
    page: number,
    limit: number,
    message = '获取成功'
  ): Response {
    const paginatedData: PaginatedResponse<T> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    return ResponseHelper.success(res, paginatedData, message);
  }

  /**
   * 错误响应
   */
  static error(res: Response, message: string, code = ResponseCode.BAD_REQUEST): Response {
    const response: ApiResponse = {
      code,
      data: null,
      message,
    };
    // HTTP 状态码统一用 200，错误通过 code 区分
    return res.status(200).json(response);
  }

  /**
   * 未授权响应
   */
  static unauthorized(res: Response, message = '未授权访问'): Response {
    return ResponseHelper.error(res, message, ResponseCode.UNAUTHORIZED);
  }

  /**
   * 禁止访问响应
   */
  static forbidden(res: Response, message = '禁止访问'): Response {
    return ResponseHelper.error(res, message, ResponseCode.FORBIDDEN);
  }

  /**
   * 未找到响应
   */
  static notFound(res: Response, message = '资源不存在'): Response {
    return ResponseHelper.error(res, message, ResponseCode.NOT_FOUND);
  }

  /**
   * 服务器错误响应
   */
  static serverError(res: Response, message = '服务器内部错误'): Response {
    return ResponseHelper.error(res, message, ResponseCode.SERVER_ERROR);
  }
}
