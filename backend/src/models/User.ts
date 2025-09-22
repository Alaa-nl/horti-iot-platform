export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'researcher' | 'grower';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role: 'researcher' | 'grower';
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'researcher' | 'grower';
  is_active: boolean;
  created_at: Date;
  last_login?: Date;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}