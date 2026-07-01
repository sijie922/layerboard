import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({
          message: '请求数据验证失败',
          errors: result.error.errors,
        });
        return;
      }
      req.body = result.data;
      next();
    } catch {
      res.status(400).json({ message: '请求数据格式错误' });
    }
  };
}

// Validation schemas
export const registerSchema = z.object({
  username: z.string().min(3, '用户名至少3个字符').max(30, '用户名最多30个字符'),
  password: z.string().min(6, '密码至少6个字符').max(100),
});

export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export const createBoardSchema = z.object({
  name: z.string().min(1, '请输入画板名称').max(100),
});

export const createGroupSchema = z.object({
  name: z.string().min(1, '请输入小组名称').max(50),
  color: z.string().default('#1890ff'),
});

export const createAreaSchema = z.object({
  name: z.string().min(1, '请输入区域名称').max(50),
  groupId: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
});
