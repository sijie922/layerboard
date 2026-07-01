import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { Types } from 'mongoose';

export interface JwtPayload {
  userId: string;
  username: string;
}

export function generateToken(user: { _id: Types.ObjectId; username: string }): string {
  const payload = {
    userId: user._id.toString(),
    username: user.username,
  };

  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: '7d',
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
