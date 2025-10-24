# HORTI-IOT Backend API

Node.js/Express/TypeScript backend for the HORTI-IOT Platform with PostgreSQL/TimescaleDB integration.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Database

```bash
# From root directory
docker-compose up -d
```

This will start:
- PostgreSQL with TimescaleDB on port 5432
- PgAdmin on port 8080 (optional)

### 3. Start Backend Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Server runs on http://localhost:3001

## 🗄️ Database

### Connection Details
- **Host:** localhost:5432
- **Database:** horti_iot
- **Username:** horti_user
- **Password:** horti_password

### PgAdmin Access
- **URL:** http://localhost:8080
- **Email:** admin@horti-iot.com
- **Password:** admin123

### Schema
The database schema is automatically created from `database/schema.sql` and seeded with sample data from `database/seed.sql`.

## 🔐 Authentication

### Demo Credentials
```
Email: researcher@horti-iot.com
Password: password123
Role: researcher

Email: grower@horti-iot.com
Password: password123
Role: grower
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register new user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user

### Greenhouses
- `GET /api/greenhouses` - Get all greenhouses
- `GET /api/greenhouses/:id` - Get greenhouse by ID
- `GET /api/greenhouses/:id/sensors` - Get greenhouse sensors
- `GET /api/greenhouses/:id/readings` - Get sensor readings
- `GET /api/greenhouses/:id/weather` - Get weather data

### Health Check
- `GET /health` - API health status

## 🛠️ Development

### Environment Variables

Copy `.env` and modify as needed:

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=horti_iot
DB_USER=horti_user
DB_PASSWORD=horti_password
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=http://localhost:3000
```

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build TypeScript
npm start        # Start production server
npm run lint     # Run ESLint
npm test         # Run tests
```

## 🔧 Troubleshooting

### Database Connection Issues
1. Ensure Docker is running
2. Check if ports 5432 and 8080 are available
3. Restart containers: `docker-compose down && docker-compose up -d`

### Permission Errors
```bash
# Reset Docker volumes
docker-compose down -v
docker-compose up -d
```

### API Not Responding
1. Check backend logs for errors
2. Verify environment variables
3. Ensure database is running and accessible

## 📊 Database Structure

Key tables:
- `users` - User authentication and profiles
- `greenhouses` - Greenhouse metadata
- `sensors` - Sensor configuration
- `sensor_readings` - Time-series sensor data (TimescaleDB hypertable)
- `weather_data` - Weather information (TimescaleDB hypertable)
- `environment_zones` - Greenhouse zone definitions
- `plants` - Plant/crop data

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong JWT secret
3. Configure proper CORS origins
4. Set up SSL/TLS
5. Use environment-specific database credentials
6. Configure logging and monitoring

## 📝 API Usage Examples

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"researcher@horti-iot.com","password":"password123"}'
```

### Get Greenhouses
```bash
curl http://localhost:3001/api/greenhouses
```

### Get Authenticated Data
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/api/auth/me
```