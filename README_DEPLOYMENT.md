# HORTI-IOT Platform Deployment Guide

## Port Configuration

The application uses the following ports:

- **Frontend (React)**: Port 3000
- **Backend API**: Port 3001
- **PostgreSQL Database**: Port 5432
- **ML Service** (if applicable): Port 8000

## Environment Configuration

### Development Setup

1. **Frontend** (`.env.development`):
   - Runs on port 3000
   - Connects to backend on `http://localhost:3001/api`

2. **Backend** (`backend/.env.development`):
   - Runs on port 3001
   - CORS configured for `http://localhost:3000`

### Production Setup

1. Update `.env.production` with your production values
2. Update `backend/.env.production` with production database and domain

## Quick Commands

### Development

```bash
# Kill any processes on required ports
npm run kill-ports

# Start frontend only (port 3000)
npm run start:dev

# Start backend only (port 3001)
cd backend && npm run dev

# Start both frontend and backend
npm run dev:all
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

## Troubleshooting Port Conflicts

If you encounter port conflicts:

1. **Check what's running**:
   ```bash
   lsof -i :3000 -i :3001 -i :5432
   ```

2. **Kill specific port**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9

   # Or use the npm script
   npm run kill-ports
   ```

3. **Change ports in environment files**:
   - Frontend: Update `PORT` in `.env.development`
   - Backend: Update `PORT` in `backend/.env`
   - Update `REACT_APP_API_URL` and `CORS_ORIGIN` accordingly

## Production Deployment Checklist

- [ ] Update all production environment files
- [ ] Change JWT_SECRET to a secure value
- [ ] Configure proper database credentials
- [ ] Set up SSL certificates
- [ ] Configure domain names in CORS_ORIGIN
- [ ] Update API URLs in frontend configuration
- [ ] Set up proper logging
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Configure backup strategy for database

Environment-specific configs for development/production
  2. Docker setup with docker-compose.yml for deployment
  3. Helpful npm scripts:
    - npm run kill-ports - Clear port conflicts
    - npm run dev:all - Start both services together
    - npm run start:dev - Start frontend with explicit port
  4. Production-ready Dockerfiles with:
    - Multi-stage builds for optimization
    - Health checks
    - Security best practices
    - Nginx for frontend serving

    To start your project, you now have several options:

  Recommended: Start Both Frontend & Backend Together

  npm run dev:all
  This starts both services in parallel (frontend on port 3000, backend on port 3001).

  Alternative: Start Separately in Two Terminals

  Terminal 1 - Backend:
  cd backend && npm run dev

  Terminal 2 - Frontend:
  npm start

  If You Get Port Conflicts

  npm run kill-ports
  Then start normally.

  Using Docker (All Services)

  docker-compose up -d

  The easiest way is npm run dev:all - it handles everything for you!