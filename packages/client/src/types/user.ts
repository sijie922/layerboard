export interface User {
  id: string;
  username: string;
  avatar: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
