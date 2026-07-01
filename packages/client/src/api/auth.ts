import api from './request';
import type { AuthResponse } from '@/types';

export async function register(username: string, password: string) {
  const res = await api.post<{ message: string; data: AuthResponse }>('/auth/register', {
    username,
    password,
  });
  return res.data;
}

export async function login(username: string, password: string) {
  const res = await api.post<{ message: string; data: AuthResponse }>('/auth/login', {
    username,
    password,
  });
  return res.data;
}
