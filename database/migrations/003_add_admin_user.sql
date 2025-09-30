-- Migration: Add admin@it.com user
-- Date: 2025-09-30

-- Insert admin user with secure password hash
-- Password: admin123 (hashed with bcrypt, 12 rounds)
INSERT INTO users (
    email,
    password_hash,
    name,
    role,
    is_active,
    created_at,
    updated_at
) VALUES (
    'admin@it.com',
    '$2b$12$LQv2QqzDpYJdQ7XxV7zWZuPmx0E4MqD0hqFkT6tPHXhR1I9sYXqz.',  -- bcrypt hash of 'admin123'
    'IT Administrator',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Grant admin access to all existing greenhouses
INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type, granted_by)
SELECT
    u.id,
    g.id,
    'manage',
    u.id  -- Self-granted
FROM users u
CROSS JOIN greenhouses g
WHERE u.email = 'admin@it.com'
ON CONFLICT (user_id, greenhouse_id) DO NOTHING;

-- Log the creation in audit logs
INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    details,
    created_at
)
SELECT
    u.id,
    'create_admin_user',
    'user',
    u.id,
    '{"email": "admin@it.com", "role": "admin", "created_via": "migration"}'::jsonb,
    CURRENT_TIMESTAMP
FROM users u
WHERE u.email = 'admin@it.com';