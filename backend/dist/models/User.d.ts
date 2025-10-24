export interface User {
    id: string;
    email: string;
    password_hash: string;
    name: string;
    role: 'admin' | 'researcher' | 'grower' | 'farmer';
    is_active: boolean;
    profile_photo?: string;
    bio?: string;
    phone_number?: string;
    department?: string;
    location?: string;
    created_by?: string;
    created_at: Date;
    updated_at: Date;
    last_login?: Date;
    failed_login_attempts?: number;
    locked_until?: Date;
    two_factor_enabled?: boolean;
    two_factor_secret?: string;
    password_changed_at?: Date;
}
export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'researcher' | 'grower' | 'farmer';
    phone_number?: string;
    department?: string;
    location?: string;
    created_by?: string;
}
export interface LoginInput {
    email: string;
    password: string;
}
export interface UserResponse {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'researcher' | 'grower' | 'farmer';
    is_active: boolean;
    profile_photo?: string;
    bio?: string;
    phone_number?: string;
    department?: string;
    location?: string;
    created_at: Date;
    last_login?: Date;
}
export interface UpdateUserInput {
    name?: string;
    phone_number?: string;
    department?: string;
    location?: string;
    bio?: string;
}
export interface ResetPasswordInput {
    user_id: string;
    new_password: string;
}
export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}
//# sourceMappingURL=User.d.ts.map