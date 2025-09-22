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
      const groupedReadings = result.rows.reduce((acc, reading) => {
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
      crops: [
        {
          type: greenhouse.crop_type || 'tomato',
          variety: greenhouse.variety || 'Unknown',
          plantingDate: greenhouse.planting_date,
          supplier: greenhouse.supplier
        }
      ],
      equipment: [
        {
          name: 'Climate System',
          type: greenhouse.climate_system || 'Unknown',
          status: 'active'
        },
        {
          name: 'Lighting System',
          type: greenhouse.lighting_system || 'Unknown',
          status: 'active'
        }
      ],
      performance: {
        previousYield: Math.round(Math.random() * 50 + 20) // Mock data for now
      }
    };
  }
}