"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GreenhouseController = void 0;
const database_1 = __importDefault(require("../utils/database"));
const geocoding_1 = require("../utils/geocoding");
class GreenhouseController {
    async getAllGreenhouses(req, res) {
        try {
            const query = `
        SELECT
          id,
          farm_code,
          name,
          location,
          latitude,
          longitude,
          city,
          region,
          dimensions,
          area_m2,
          crop_type,
          variety,
          rootstock,
          planting_date,
          supplier,
          substrate_info,
          climate_system,
          lighting_system,
          growing_system,
          co2_target_ppm,
          temperature_range_c,
          configuration,
          created_at,
          updated_at
        FROM greenhouses
        ORDER BY name ASC
      `;
            const result = await database_1.default.query(query);
            const greenhouses = result.rows.map(this.formatGreenhouseResponse);
            res.status(200).json({
                success: true,
                data: {
                    greenhouses,
                    count: greenhouses.length
                }
            });
        }
        catch (error) {
            console.error('Get greenhouses error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getGreenhouseById(req, res) {
        try {
            const { id } = req.params;
            const query = `
        SELECT
          id,
          farm_code,
          name,
          location,
          latitude,
          longitude,
          city,
          region,
          dimensions,
          area_m2,
          crop_type,
          variety,
          rootstock,
          planting_date,
          supplier,
          substrate_info,
          climate_system,
          lighting_system,
          growing_system,
          co2_target_ppm,
          temperature_range_c,
          configuration,
          created_at,
          updated_at
        FROM greenhouses
        WHERE id = $1
      `;
            const result = await database_1.default.query(query, [id]);
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Greenhouse not found'
                });
                return;
            }
            const greenhouse = this.formatGreenhouseResponse(result.rows[0]);
            res.status(200).json({
                success: true,
                data: { greenhouse }
            });
        }
        catch (error) {
            console.error('Get greenhouse by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getGreenhouseSensors(req, res) {
        try {
            const { id } = req.params;
            const query = `
        SELECT
          s.id,
          s.sensor_type,
          s.manufacturer,
          s.model,
          s.location,
          s.status,
          ez.zone_name,
          ez.zone_type
        FROM sensors s
        LEFT JOIN environment_zones ez ON s.zone_id = ez.id
        WHERE s.greenhouse_id = $1 AND s.status = 'active'
        ORDER BY ez.zone_name, s.sensor_type
      `;
            const result = await database_1.default.query(query, [id]);
            res.status(200).json({
                success: true,
                data: {
                    sensors: result.rows,
                    count: result.rows.length
                }
            });
        }
        catch (error) {
            console.error('Get greenhouse sensors error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getLatestSensorReadings(req, res) {
        try {
            const { id } = req.params;
            const { hours = '24' } = req.query;
            const query = `
        SELECT
          sr.sensor_id,
          sr.timestamp,
          sr.value,
          sr.unit,
          sr.quality_score,
          s.sensor_type,
          s.manufacturer,
          s.model,
          ez.zone_name
        FROM sensor_readings sr
        JOIN sensors s ON sr.sensor_id = s.id
        JOIN environment_zones ez ON s.zone_id = ez.id
        WHERE s.greenhouse_id = $1
          AND sr.timestamp >= NOW() - INTERVAL '${hours} hours'
        ORDER BY sr.timestamp DESC
        LIMIT 1000
      `;
            const result = await database_1.default.query(query, [id]);
            const groupedReadings = result.rows.reduce((acc, reading) => {
                const key = reading.sensor_type;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(reading);
                return acc;
            }, {});
            res.status(200).json({
                success: true,
                data: {
                    readings: groupedReadings,
                    total_count: result.rows.length,
                    time_range: `${hours} hours`
                }
            });
        }
        catch (error) {
            console.error('Get sensor readings error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async getWeatherData(req, res) {
        try {
            const { id } = req.params;
            const { days = '7' } = req.query;
            const query = `
        SELECT
          timestamp,
          temperature,
          humidity,
          wind_speed,
          solar_radiation,
          rainfall,
          pressure
        FROM weather_data
        WHERE greenhouse_id = $1
          AND timestamp >= NOW() - INTERVAL '${days} days'
        ORDER BY timestamp DESC
        LIMIT 500
      `;
            const result = await database_1.default.query(query, [id]);
            res.status(200).json({
                success: true,
                data: {
                    weather: result.rows,
                    count: result.rows.length,
                    time_range: `${days} days`
                }
            });
        }
        catch (error) {
            console.error('Get weather data error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    formatGreenhouseResponse(greenhouse) {
        const locationParts = greenhouse.location.split(', ');
        const city = greenhouse.city || locationParts[locationParts.length - 2] || 'Unknown';
        const region = greenhouse.region || locationParts[locationParts.length - 1] || 'Unknown';
        return {
            id: greenhouse.id,
            farmCode: greenhouse.farm_code || 'FARM-XXX',
            name: greenhouse.name,
            location: {
                address: greenhouse.location,
                city: city,
                region: region,
                coordinates: {
                    lat: parseFloat(greenhouse.latitude) || 52.0607,
                    lon: parseFloat(greenhouse.longitude) || 4.3517
                }
            },
            details: {
                landArea: greenhouse.area_m2,
                type: 'Commercial Greenhouse',
                dimensions: {
                    length: greenhouse.dimensions?.length || 100,
                    width: greenhouse.dimensions?.width || 50,
                    height: greenhouse.dimensions?.height || 5
                }
            },
            crops: {
                type: greenhouse.crop_type || 'tomato',
                variety: greenhouse.variety || 'Unknown',
                plantingDate: greenhouse.planting_date,
                supplier: greenhouse.supplier
            },
            equipment: {
                climate: {
                    name: 'Climate System',
                    type: greenhouse.climate_system || 'Unknown',
                    status: 'active'
                },
                lighting: {
                    name: 'Lighting System',
                    type: greenhouse.lighting_system || 'Unknown',
                    status: 'active'
                }
            },
            performance: {
                previousYield: Math.round(Math.random() * 50 + 20)
            }
        };
    }
    async createGreenhouse(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { name, location, dimensions, area_m2, crop_type, variety, rootstock, planting_date, supplier, substrate_info, climate_system, lighting_system, growing_system, co2_target_ppm, temperature_range_c, configuration } = req.body;
            const geocodedLocation = await (0, geocoding_1.geocodeLocation)(location);
            let latitude = 52.0607;
            let longitude = 4.3517;
            let city = 'Unknown';
            let region = 'Netherlands';
            if (geocodedLocation) {
                latitude = geocodedLocation.lat;
                longitude = geocodedLocation.lon;
                city = geocodedLocation.city || 'Unknown';
                region = geocodedLocation.region || geocodedLocation.country || 'Netherlands';
            }
            else {
                const parsed = (0, geocoding_1.parseLocationString)(location);
                city = parsed.city;
                region = parsed.region;
            }
            const createQuery = `
        INSERT INTO greenhouses (
          name, location, latitude, longitude, city, region, dimensions, area_m2, crop_type, variety, rootstock,
          planting_date, supplier, substrate_info, climate_system, lighting_system,
          growing_system, co2_target_ppm, temperature_range_c, configuration
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `;
            const values = [
                name,
                location,
                latitude,
                longitude,
                city,
                region,
                JSON.stringify(dimensions),
                area_m2,
                crop_type || 'tomato',
                variety,
                rootstock,
                planting_date,
                supplier,
                substrate_info,
                climate_system,
                lighting_system,
                growing_system,
                co2_target_ppm || 1000,
                temperature_range_c || '18.5-23°C',
                JSON.stringify(configuration || {})
            ];
            const result = await database_1.default.query(createQuery, values);
            const greenhouse = this.formatGreenhouseResponse(result.rows[0]);
            await database_1.default.query(`INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type, granted_by)
         VALUES ($1, $2, $3, $4)`, [req.user.userId, result.rows[0].id, 'manage', req.user.userId]);
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, 'create_greenhouse', 'greenhouse', result.rows[0].id, { name, location }]);
            res.status(201).json({
                success: true,
                message: 'Greenhouse created successfully',
                data: { greenhouse }
            });
        }
        catch (error) {
            console.error('Create greenhouse error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async updateGreenhouse(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
                return;
            }
            const { id } = req.params;
            const hasPermission = await this.checkGreenhousePermission(req.user.userId, id, 'manage');
            if (!hasPermission && req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'You do not have permission to manage this greenhouse'
                });
                return;
            }
            const updates = [];
            const values = [];
            let valueIndex = 1;
            if (req.body.location) {
                const geocodedLocation = await (0, geocoding_1.geocodeLocation)(req.body.location);
                if (geocodedLocation) {
                    updates.push(`location = $${valueIndex++}`);
                    values.push(req.body.location);
                    updates.push(`latitude = $${valueIndex++}`);
                    values.push(geocodedLocation.lat);
                    updates.push(`longitude = $${valueIndex++}`);
                    values.push(geocodedLocation.lon);
                    updates.push(`city = $${valueIndex++}`);
                    values.push(geocodedLocation.city || 'Unknown');
                    updates.push(`region = $${valueIndex++}`);
                    values.push(geocodedLocation.region || geocodedLocation.country || 'Netherlands');
                }
                else {
                    const parsed = (0, geocoding_1.parseLocationString)(req.body.location);
                    updates.push(`location = $${valueIndex++}`);
                    values.push(req.body.location);
                    updates.push(`city = $${valueIndex++}`);
                    values.push(parsed.city);
                    updates.push(`region = $${valueIndex++}`);
                    values.push(parsed.region);
                }
            }
            const allowedFields = [
                'name', 'dimensions', 'area_m2', 'crop_type', 'variety',
                'rootstock', 'planting_date', 'supplier', 'substrate_info', 'climate_system',
                'lighting_system', 'growing_system', 'co2_target_ppm', 'temperature_range_c', 'configuration'
            ];
            for (const field of allowedFields) {
                if (req.body[field] !== undefined) {
                    updates.push(`${field} = $${valueIndex++}`);
                    if (field === 'dimensions' || field === 'configuration') {
                        values.push(JSON.stringify(req.body[field]));
                    }
                    else {
                        values.push(req.body[field]);
                    }
                }
            }
            if (updates.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'No fields to update'
                });
                return;
            }
            updates.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            const updateQuery = `
        UPDATE greenhouses
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;
            const result = await database_1.default.query(updateQuery, values);
            if (result.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Greenhouse not found'
                });
                return;
            }
            const greenhouse = this.formatGreenhouseResponse(result.rows[0]);
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, 'update_greenhouse', 'greenhouse', id, req.body]);
            res.status(200).json({
                success: true,
                message: 'Greenhouse updated successfully',
                data: { greenhouse }
            });
        }
        catch (error) {
            console.error('Update greenhouse error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async deleteGreenhouse(req, res) {
        try {
            if (!req.user || req.user.role !== 'admin') {
                res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
                return;
            }
            const { id } = req.params;
            const greenhouseQuery = 'SELECT name, location FROM greenhouses WHERE id = $1';
            const greenhouseResult = await database_1.default.query(greenhouseQuery, [id]);
            if (greenhouseResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: 'Greenhouse not found'
                });
                return;
            }
            const greenhouse = greenhouseResult.rows[0];
            await database_1.default.query(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`, [req.user.userId, 'delete_greenhouse', 'greenhouse', id, greenhouse]);
            await database_1.default.query('DELETE FROM greenhouses WHERE id = $1', [id]);
            res.status(200).json({
                success: true,
                message: 'Greenhouse deleted successfully'
            });
        }
        catch (error) {
            console.error('Delete greenhouse error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
    async checkGreenhousePermission(userId, greenhouseId, permissionType) {
        const query = `
      SELECT id FROM user_greenhouse_permissions
      WHERE user_id = $1 AND greenhouse_id = $2
        AND (permission_type = $3 OR permission_type = 'manage')
    `;
        const result = await database_1.default.query(query, [userId, greenhouseId, permissionType]);
        return result.rows.length > 0;
    }
}
exports.GreenhouseController = GreenhouseController;
//# sourceMappingURL=greenhouseController.js.map