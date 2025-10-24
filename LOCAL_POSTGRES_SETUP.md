# Local PostgreSQL Setup (Alternative to Docker)

If you don't want to use Docker, you can set up PostgreSQL locally on your Mac.

## Option 1: Install PostgreSQL with Homebrew

```bash
# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database and user
psql postgres
```

```sql
-- In PostgreSQL prompt
CREATE DATABASE horti_iot;
CREATE USER horti_user WITH PASSWORD 'horti_password';
GRANT ALL PRIVILEGES ON DATABASE horti_iot TO horti_user;
\q
```

```bash
# Run schema and seed files
psql -h localhost -U horti_user -d horti_iot -f database/schema.sql
psql -h localhost -U horti_user -d horti_iot -f database/seed.sql
```

## Option 2: Use Docker (Recommended)

```bash
# Start Docker Desktop first, then:
docker-compose up -d
```

## Testing Database Connection

Once PostgreSQL is running (either locally or with Docker):

```bash
# Test connection
psql -h localhost -U horti_user -d horti_iot -c "SELECT COUNT(*) FROM users;"
```

Should return:
```
 count
-------
     2
(1 row)
```

## Backend Environment Variables

Update `backend/.env` if using local PostgreSQL:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=horti_iot
DB_USER=horti_user
DB_PASSWORD=horti_password
```

## Start Backend

```bash
cd backend
npm run dev
```

## Test Frontend

Open http://localhost:3000 and you should see:
- 🌀 Loading screen
- ✅ Login form (if database connected)
- 🚫 Database error (if database not connected)

## Demo Credentials

```
Email: researcher@horti-iot.com
Password: password123
```