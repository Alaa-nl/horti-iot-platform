# Greenhouse CRUD API Documentation

## Overview
The HORTI-IOT platform provides comprehensive greenhouse management capabilities with role-based access control. This document outlines all available greenhouse endpoints and their permissions.

## Base URL
```
http://localhost:3001/api/greenhouses
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. List All Greenhouses
```http
GET /api/greenhouses
```

**Access:** Public (with optional authentication for personalized data)
**Description:** Retrieve all greenhouses in the system

**Response:**
```json
{
  "success": true,
  "data": {
    "greenhouses": [
      {
        "id": "uuid",
        "name": "Greenhouse A",
        "location": "Farm Location",
        "area_m2": 500,
        "crop_type": "tomato",
        "variety": "Cherry",
        "configuration": {},
        "created_at": "2025-09-30T...",
        "updated_at": "2025-09-30T..."
      }
    ],
    "count": 1
  }
}
```

### 2. Get Specific Greenhouse
```http
GET /api/greenhouses/:id
```

**Access:** Public (with optional authentication)
**Description:** Retrieve a specific greenhouse by ID

**Parameters:**
- `id` (path) - Greenhouse UUID

### 3. Create New Greenhouse
```http
POST /api/greenhouses
```

**Access:** Admin, Researcher
**Description:** Create a new greenhouse

**Request Body:**
```json
{
  "name": "New Greenhouse",
  "location": "Farm Location",
  "area_m2": 500,
  "crop_type": "tomato",
  "variety": "Cherry Tomatoes",
  "rootstock": "Maxifort",
  "planting_date": "2025-01-15",
  "supplier": "Seeds Co.",
  "substrate_info": "Rockwool",
  "climate_system": "Automated HVAC",
  "lighting_system": "LED Full Spectrum",
  "growing_system": "Hydroponic",
  "co2_target_ppm": 800,
  "temperature_range_c": "20-25°C",
  "configuration": {
    "automated": true,
    "sensors": ["temperature", "humidity", "co2"]
  }
}
```

**Required Fields:**
- `name` (string, 2-255 chars)
- `location` (string, 2-255 chars)

**Optional Fields:**
- `dimensions` (object)
- `area_m2` (positive number)
- `crop_type` (string, max 100 chars)
- `variety` (string, max 100 chars)
- `rootstock` (string, max 100 chars)
- `planting_date` (date)
- `supplier` (string, max 255 chars)
- `substrate_info` (string, max 500 chars)
- `climate_system` (string, max 255 chars)
- `lighting_system` (string, max 255 chars)
- `growing_system` (string, max 255 chars)
- `co2_target_ppm` (positive number)
- `temperature_range_c` (string, max 50 chars)
- `configuration` (object)

### 4. Update Greenhouse
```http
PUT /api/greenhouses/:id
```

**Access:** Admin, Researcher (with permission)
**Description:** Update an existing greenhouse

**Parameters:**
- `id` (path) - Greenhouse UUID

**Request Body:** Same as create, but all fields are optional

**Permissions:**
- **Admin:** Can update any greenhouse
- **Researcher:** Can only update greenhouses they have "manage" permission for

### 5. Delete Greenhouse
```http
DELETE /api/greenhouses/:id
```

**Access:** Admin only
**Description:** Delete a greenhouse permanently

**Parameters:**
- `id` (path) - Greenhouse UUID

### 6. Get Greenhouse Sensors
```http
GET /api/greenhouses/:id/sensors
```

**Access:** Admin, Researcher, Grower (with access)
**Description:** Get all sensors for a specific greenhouse

### 7. Get Sensor Readings
```http
GET /api/greenhouses/:id/readings
```

**Access:** Admin, Researcher, Grower (with access)
**Description:** Get latest sensor readings for a greenhouse

**Query Parameters:**
- `hours` (optional) - Number of hours to look back (default: 24)

### 8. Get Weather Data
```http
GET /api/greenhouses/:id/weather
```

**Access:** Public (with optional authentication)
**Description:** Get weather data for a greenhouse location

**Query Parameters:**
- `days` (optional) - Number of days to look back (default: 7)

## Role-Based Permissions

### Admin
- ✅ Create new greenhouses
- ✅ Update any greenhouse
- ✅ Delete any greenhouse
- ✅ View all greenhouses and data
- ✅ Manage greenhouse permissions

### Researcher
- ✅ Create new greenhouses
- ✅ Update greenhouses they have permission for
- ❌ Delete greenhouses
- ✅ View greenhouses they have access to
- ✅ Access sensor data and readings

### Grower/Investor
- ❌ Create greenhouses
- ❌ Update greenhouses
- ❌ Delete greenhouses
- ✅ View assigned greenhouses
- ✅ View sensor data and readings for assigned greenhouses

## Error Responses

### Authentication Required (401)
```json
{
  "success": false,
  "message": "Access token required"
}
```

### Insufficient Permissions (403)
```json
{
  "success": false,
  "message": "Access denied. Admin or researcher privileges required."
}
```

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Greenhouse not found"
}
```

## Testing the API

### 1. Login to get access token
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@it.com",
    "password": "admin123"
  }'
```

### 2. Create a greenhouse
```bash
curl -X POST http://localhost:3001/api/greenhouses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Greenhouse",
    "location": "Test Farm, Netherlands",
    "area_m2": 500,
    "crop_type": "tomato"
  }'
```

### 3. List all greenhouses
```bash
curl -X GET http://localhost:3001/api/greenhouses \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Update a greenhouse
```bash
curl -X PUT http://localhost:3001/api/greenhouses/GREENHOUSE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Greenhouse Name",
    "area_m2": 600
  }'
```

### 5. Delete a greenhouse (Admin only)
```bash
curl -X DELETE http://localhost:3001/api/greenhouses/GREENHOUSE_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Security Features

- **Input Validation:** All inputs are validated using Joi schemas
- **Rate Limiting:** API calls are rate-limited to prevent abuse
- **Audit Logging:** All CRUD operations are logged for compliance
- **Permission Checking:** Granular permissions based on user roles
- **SQL Injection Prevention:** All queries use parameterized statements

## Notes

1. **Greenhouse Permissions:** When a researcher creates a greenhouse, they automatically get "manage" permission for it
2. **Admin Override:** Admins can manage any greenhouse regardless of specific permissions
3. **Audit Trail:** All create, update, and delete operations are logged in the audit_logs table
4. **Data Validation:** Comprehensive validation ensures data integrity
5. **Error Handling:** Detailed error messages help with debugging and user experience