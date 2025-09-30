import { Request, Response } from 'express';
import database from '../utils/database';
import { GreenhouseResponse } from '../models/Greenhouse';

export class GreenhouseController {

  public async getAllGreenhouses(req: Request, res: Response): Promise<void> {
    try {
      const query = `
        SELECT
          id,
          name,
          location,
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

      const result = await database.query(query);
      const greenhouses = result.rows.map(this.formatGreenhouseResponse);

      res.status(200).json({
        success: true,
        data: {
          greenhouses,
          count: greenhouses.length
        }
      });

    } catch (error) {
      console.error('Get greenhouses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getGreenhouseById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const query = `
        SELECT
          id,
          name,
          location,
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

      const result = await database.query(query, [id]);

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

    } catch (error) {
      console.error('Get greenhouse by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getGreenhouseSensors(req: Request, res: Response): Promise<void> {
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

      const result = await database.query(query, [id]);

      res.status(200).json({
        success: true,
        data: {
          sensors: result.rows,
          count: result.rows.length
        }
      });

    } catch (error) {
      console.error('Get greenhouse sensors error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getLatestSensorReadings(req: Request, res: Response): Promise<void> {
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

      const result = await database.query(query, [id]);

      // Group readings by sensor type
      const groupedReadings = result.rows.reduce((acc: Record<string, any[]>, reading: any) => {
        const key = reading.sensor_type;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(reading);
        return acc;
      }, {} as Record<string, any[]>);

      res.status(200).json({
        success: true,
        data: {
          readings: groupedReadings,
          total_count: result.rows.length,
          time_range: `${hours} hours`
        }
      });

    } catch (error) {
      console.error('Get sensor readings error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async getWeatherData(req: Request, res: Response): Promise<void> {
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

      const result = await database.query(query, [id]);

      res.status(200).json({
        success: true,
        data: {
          weather: result.rows,
          count: result.rows.length,
          time_range: `${days} days`
        }
      });

    } catch (error) {
      console.error('Get weather data error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  private formatGreenhouseResponse(greenhouse: any): GreenhouseResponse {
    // Parse the location string to extract city and region
    const locationParts = greenhouse.location.split(', ');
    const city = locationParts[locationParts.length - 2] || 'Unknown';
    const region = locationParts[locationParts.length - 1] || 'Unknown';

    return {
      id: greenhouse.id,
      name: greenhouse.name,
      location: {
        address: greenhouse.location,
        city: city,
        region: region,
        coordinates: {
          lat: 52.0607, // Default coordinates for Netherlands greenhouse region
          lon: 4.3517
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
        previousYield: Math.round(Math.random() * 50 + 20) // Mock data for now
      }
    };
  }

  public async createGreenhouse(req: Request, res: Response): Promise<void> {
    try {
      // Authorization is handled by middleware
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const {
        name,
        location,
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
        configuration
      } = req.body;

      const createQuery = `
        INSERT INTO greenhouses (
          name, location, dimensions, area_m2, crop_type, variety, rootstock,
          planting_date, supplier, substrate_info, climate_system, lighting_system,
          growing_system, co2_target_ppm, temperature_range_c, configuration
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const values = [
        name,
        location,
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

      const result = await database.query(createQuery, values);
      const greenhouse = this.formatGreenhouseResponse(result.rows[0]);

      await database.query(
        `INSERT INTO user_greenhouse_permissions (user_id, greenhouse_id, permission_type, granted_by)
         VALUES ($1, $2, $3, $4)`,
        [req.user.userId, result.rows[0].id, 'manage', req.user.userId]
      );

      await database.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.userId, 'create_greenhouse', 'greenhouse', result.rows[0].id, { name, location }]
      );

      res.status(201).json({
        success: true,
        message: 'Greenhouse created successfully',
        data: { greenhouse }
      });

    } catch (error) {
      console.error('Create greenhouse error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async updateGreenhouse(req: Request, res: Response): Promise<void> {
    try {
      // Authorization is handled by middleware
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

      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      const allowedFields = [
        'name', 'location', 'dimensions', 'area_m2', 'crop_type', 'variety',
        'rootstock', 'planting_date', 'supplier', 'substrate_info', 'climate_system',
        'lighting_system', 'growing_system', 'co2_target_ppm', 'temperature_range_c', 'configuration'
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = $${valueIndex++}`);
          if (field === 'dimensions' || field === 'configuration') {
            values.push(JSON.stringify(req.body[field]));
          } else {
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

      const result = await database.query(updateQuery, values);

      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Greenhouse not found'
        });
        return;
      }

      const greenhouse = this.formatGreenhouseResponse(result.rows[0]);

      await database.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.userId, 'update_greenhouse', 'greenhouse', id, req.body]
      );

      res.status(200).json({
        success: true,
        message: 'Greenhouse updated successfully',
        data: { greenhouse }
      });

    } catch (error) {
      console.error('Update greenhouse error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  public async deleteGreenhouse(req: Request, res: Response): Promise<void> {
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
      const greenhouseResult = await database.query(greenhouseQuery, [id]);

      if (greenhouseResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Greenhouse not found'
        });
        return;
      }

      const greenhouse = greenhouseResult.rows[0];

      await database.query(
        `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.userId, 'delete_greenhouse', 'greenhouse', id, greenhouse]
      );

      await database.query('DELETE FROM greenhouses WHERE id = $1', [id]);

      res.status(200).json({
        success: true,
        message: 'Greenhouse deleted successfully'
      });

    } catch (error) {
      console.error('Delete greenhouse error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  private async checkGreenhousePermission(userId: string, greenhouseId: string, permissionType: string): Promise<boolean> {
    const query = `
      SELECT id FROM user_greenhouse_permissions
      WHERE user_id = $1 AND greenhouse_id = $2
        AND (permission_type = $3 OR permission_type = 'manage')
    `;
    const result = await database.query(query, [userId, greenhouseId, permissionType]);
    return result.rows.length > 0;
  }
}