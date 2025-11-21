# Horti-IoT Platform Setup Guide

## Quick Start

### 1. Backend Setup
```bash
cd backend
npm install
npm run build
npm run dev
```
The backend runs on port **3001**

### 2. Frontend Setup
```bash
# From project root
npm install
npm start
```
The frontend runs on port **5173**

## Important Configuration

### Backend Configuration (backend/.env)
- **PORT**: 3001
- **CORS_ORIGIN**: http://localhost:5173

### Frontend Configuration (.env)
- **PORT**: 5173
- **VITE_API_URL**: http://localhost:3001/api
- **REACT_APP_API_URL**: http://localhost:3001/api

## Branch Information

### Active Branches:
- **Researcher-Dashboard**: Main development branch for researcher features
- **Researcher-2**: Alternative branch with same configuration

Both branches are configured identically and should work with the same setup.

## Common Issues & Solutions

### Port Already in Use
If you get "EADDRINUSE" error:
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### TypeScript Build Issues
If backend fails to start:
```bash
cd backend
npm run build
```

## Default Login Credentials
- Email: admin@it.com
- Password: admin123

## Database
PostgreSQL database should be running locally with:
- Database: horti_iot
- User: horti_user
- Password: horti_password
- Port: 5432

---
Last updated: 2025-11-21