import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/auth.service.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    const { user, token } = await registerUser(username, password);

    res.status(201).json({
      message: '注册成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '注册失败';
    res.status(400).json({ message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body;
    const { user, token } = await loginUser(username, password);

    res.json({
      message: '登录成功',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          avatar: user.avatar,
        },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(401).json({ message });
  }
}
