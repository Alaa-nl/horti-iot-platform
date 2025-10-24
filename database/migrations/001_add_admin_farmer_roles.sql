-- Migration: Add Admin and Farmer roles, and profile fields
-- Date: 2025-09-23

-- 1. Update users table to support admin and farmer roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'researcher', 'grower', 'farmer'));

-- 2. Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 3. Create user_greenhouse_permissions table for managing greenhouse access
CREATE TABLE IF NOT EXISTS user_greenhouse_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('view', 'edit', 'manage')),
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, greenhouse_id)
);

-- 4. Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_greenhouse_permissions_user ON user_greenhouse_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_greenhouse_permissions_greenhouse ON user_greenhouse_permissions(greenhouse_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- 7. Insert a default admin user (password: admin123)
-- Note: Change this password immediately after setup
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
    'admin@hortiiot.com',
    '$2b$12$LQv2QqzDpYJdQ7XxV7zWZuPmx0E4MqD0hqFkT6tPHXhR1I9sYXqz.', -- bcrypt hash of 'admin123'
    'System Administrator',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- 8. Grant admin access to all existing greenhouses
INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type)
SELECT
    u.id,
    g.id,
    'manage'
FROM users u
CROSS JOIN greenhouses g
WHERE u.role = 'admin'
ON CONFLICT (user_id, greenhouse_id) DO NOTHING;