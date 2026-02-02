// ============================================================
// 通用类型定义
// ============================================================

// 响应码枚举
export enum ResponseCode {
  SUCCESS = 200,         // 成功
  BAD_REQUEST = 400,     // 请求参数错误
  UNAUTHORIZED = 401,    // 未授权
  FORBIDDEN = 403,       // 禁止访问
  NOT_FOUND = 404,       // 资源不存在
  SERVER_ERROR = 500,    // 服务器错误
}

// API响应格式
export interface ApiResponse<T = unknown> {
  code: number;
  data: T | null;
  message: string;
}

// 分页请求参数
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// JWT 载荷
export interface JwtPayload {
  userId: string;
  phone: string;
}

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
