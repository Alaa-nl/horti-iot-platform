# HORTI-IOT Security & Authentication Documentation

## Overview
This document outlines the secure role-based authentication system implemented for the HORTI-IOT platform backend. The system follows OWASP guidelines and industry best practices for production-ready security.

## Features

### 1. Authentication Flow
- **Single Login Endpoint**: `/api/auth/login` automatically determines user role from database
- **JWT + Refresh Tokens**: Dual-token system for enhanced security
- **Password Hashing**: BCrypt with configurable salt rounds (default: 12)
- **Account Lockout**: Automatic lockout after 5 failed attempts for 30 minutes

### 2. User Roles & Permissions

#### Admin
- Full system access
- User CRUD operations
- Password reset for any user
- Greenhouse management
- Access to all features
- Audit log access

#### Researcher
- Greenhouse management (add/remove/edit)
- Data analysis features
- Report generation
- Limited user management

#### Grower/Investor
- View-only access to assigned greenhouses
- Access to financial/ROI metrics
- Simplified dashboard view
- No management capabilities

## API Endpoints

### Authentication Endpoints
```
POST   /api/auth/login           - User login
POST   /api/auth/register        - User registration
POST   /api/auth/refresh         - Refresh access token
POST   /api/auth/logout          - Logout (invalidate tokens)
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password with token
GET    /api/auth/me              - Get current user profile
GET    /api/auth/verify          - Verify token validity
```

### Admin Endpoints (Admin Only)
```
POST   /api/admin/users                         - Create new user
GET    /api/admin/users                         - Get all users
POST   /api/admin/users/reset-password          - Reset user password
PATCH  /api/admin/users/:user_id/toggle-status  - Activate/deactivate user
DELETE /api/admin/users/:user_id                - Delete user
POST   /api/admin/greenhouse-access             - Manage greenhouse permissions
```

## Security Features

### 1. Rate Limiting
- **Login Attempts**: Max 5 attempts per IP/email
- **API Requests**: Configurable limit (default: 100 requests per 15 minutes)
- **Automatic Blocking**: Temporary IP/account blocking on excessive failures

### 2. Input Validation
- **Joi Schema Validation**: All inputs validated before processing
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Input sanitization and output encoding
- **Password Requirements**:
  - Minimum 8 characters
  - At least 1 uppercase, 1 lowercase, 1 number, 1 special character

### 3. Token Security
- **Access Token**: Short-lived (15 minutes default)
- **Refresh Token**: Long-lived (7 days default)
- **Token Blacklisting**: Invalidated tokens are blacklisted
- **Secure Storage**: Tokens hashed in database

### 4. Session Management
- **Automatic Cleanup**: Expired tokens cleaned hourly
- **Device Tracking**: IP and user agent logged
- **Concurrent Session Control**: Optional limitation on simultaneous sessions

### 5. Audit Logging
- **Admin Actions**: All admin operations logged
- **Security Events**: Login attempts, password changes, permission changes
- **Compliance Ready**: Structured logs for compliance requirements

## Database Schema

### Core Tables
- `users` - User accounts and profiles
- `refresh_tokens` - Active refresh tokens
- `blacklisted_tokens` - Invalidated JWT tokens
- `password_reset_tokens` - Password reset requests
- `login_attempts` - Failed/successful login tracking
- `audit_logs` - Comprehensive audit trail
- `user_greenhouse_permissions` - Greenhouse access control
- `user_sessions` - Active user sessions

## Environment Configuration

Required environment variables in `.env`:

```bash
# JWT Configuration (MUST CHANGE IN PRODUCTION)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-token-secret-32-chars
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Security Configuration
BCRYPT_ROUNDS=12
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=1800

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Setup Instructions

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run Database Migrations**
```bash
psql -U your_user -d horti_iot -f database/migrations/001_add_admin_farmer_roles.sql
psql -U your_user -d horti_iot -f database/migrations/002_add_refresh_tokens.sql
```

4. **Build and Start**
```bash
npm run build
npm start
```

## Testing Authentication

### 1. Login Request
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@horti-iot.com",
    "password": "admin123"
  }'
```

### 2. Using Access Token
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 3. Refresh Token
```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## Security Checklist

✅ **Authentication**
- [x] BCrypt password hashing
- [x] JWT with expiration
- [x] Refresh token rotation
- [x] Token blacklisting

✅ **Authorization**
- [x] Role-based access control
- [x] Resource-level permissions
- [x] Middleware protection

✅ **Input Security**
- [x] Schema validation
- [x] SQL injection prevention
- [x] XSS protection
- [x] CSRF protection

✅ **Rate Limiting**
- [x] Login attempt limiting
- [x] API rate limiting
- [x] Account lockout

✅ **Monitoring**
- [x] Audit logging
- [x] Security event tracking
- [x] Failed login monitoring

✅ **Headers & Configuration**
- [x] Security headers (Helmet)
- [x] CORS configuration
- [x] HTTPS enforcement (production)
- [x] Environment variables

## Production Deployment

### Critical Steps
1. **Change ALL default passwords and secrets**
2. **Enable HTTPS with valid SSL certificates**
3. **Configure production database with SSL**
4. **Set up monitoring and alerting**
5. **Regular security updates**
6. **Implement backup strategy**

### Recommended Additional Security
- Implement 2FA for admin accounts
- Use Redis for distributed rate limiting
- Set up WAF (Web Application Firewall)
- Regular security audits
- Penetration testing

## API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "errors": [
    // Validation errors if applicable
  ]
}
```

## Troubleshooting

### Common Issues

1. **Token Expired Error**
   - Use refresh token to get new access token
   - Check JWT_EXPIRE configuration

2. **Account Locked**
   - Wait for lockout duration
   - Admin can unlock via admin panel

3. **CORS Errors**
   - Check CORS_ORIGIN configuration
   - Ensure frontend URL is whitelisted

4. **Database Connection Failed**
   - Verify database credentials
   - Check database service status

## Support & Maintenance

For security issues or questions:
- Create an issue in the repository
- Contact the security team
- Check logs in `backend/logs/`

## License

This security implementation is part of the HORTI-IOT platform.
All rights reserved.