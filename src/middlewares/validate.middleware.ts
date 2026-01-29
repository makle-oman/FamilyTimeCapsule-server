import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ResponseHelper } from '../utils/response';

/**
 * 验证中间件
 * 使用 express-validator 的验证链后，运行此中间件检查结果
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 运行所有验证
    await Promise.all(validations.map((validation) => validation.run(req)));

    // 检查验证结果
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => {
        if ('path' in err) {
          return `${err.path}: ${err.msg}`;
        }
        return err.msg;
      });
      ResponseHelper.error(res, errorMessages.join('; '), 400);
      return;
    }

    next();
  };
}
