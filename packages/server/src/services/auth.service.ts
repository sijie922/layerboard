import bcrypt from 'bcrypt';
import { User, IUser } from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const SALT_ROUNDS = 10;

export async function registerUser(
  username: string,
  password: string
): Promise<{ user: IUser; token: string }> {
  // Check if username already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('用户名已存在');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await User.create({ username, passwordHash });

  // Generate token
  const token = generateToken(user);

  return { user, token };
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ user: IUser; token: string }> {
  // Find user
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('用户名或密码错误');
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('用户名或密码错误');
  }

  // Generate token
  const token = generateToken(user);

  return { user, token };
}
