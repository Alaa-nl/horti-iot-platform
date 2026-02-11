-- HORTI-IOT Platform Seed Data
-- Insert initial data for development and testing

-- Insert sample users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, name, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'researcher@horti-iot.com', '$2b$10$K3R4Z9M1F7QzGzJhX2Y3JO.NmQ7X8K2L5P9R1T6V3W4E8G7H9I0J1', 'Dr. Sarah Johnson', 'researcher'),
('550e8400-e29b-41d4-a716-446655440002', 'grower@horti-iot.com', '$2b$10$K3R4Z9M1F7QzGzJhX2Y3JO.NmQ7X8K2L5P9R1T6V3W4E8G7H9I0J1', 'Jan van der Berg', 'grower');

-- Insert sample greenhouse (World Horti Center setup)
INSERT INTO greenhouses (id, name, location, dimensions, area_m2, climate_zones, crops, equipment, coordinates) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'World Horti Center Lab', 'World Horti Center, Naaldwijk, Netherlands',
'{"length": 12.5, "width": 6.4, "height": 6.0, "unit": "m"}', 80,
'["main_greenhouse", "climate_room_1", "climate_room_2"]',
'["lettuce", "tomato", "cucumber", "herbs"]',
'["climate_control", "irrigation_system", "led_lighting", "co2_injection", "sensors"]',
'{"latitude": 52.0069, "longitude": 4.2150}');

-- Insert sample environment zones
INSERT INTO environment_zones (id, greenhouse_id, zone_name, zone_type, target_conditions) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'Main Growing Area', 'growing',
'{"temperature": {"min": 18, "max": 24, "unit": "celsius"}, "humidity": {"min": 60, "max": 80, "unit": "percent"}, "co2": {"target": 800, "unit": "ppm"}}'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Seedling Area', 'propagation',
'{"temperature": {"min": 20, "max": 26, "unit": "celsius"}, "humidity": {"min": 70, "max": 90, "unit": "percent"}, "co2": {"target": 600, "unit": "ppm"}}');

-- Insert sample sensors
INSERT INTO sensors (id, greenhouse_id, zone_id, sensor_type, manufacturer, model, location, calibration_data, status) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'temperature_humidity', 'Vaisala', 'HMP60',
'{"position": "center", "height": 2.0, "coordinates": [6.25, 3.2]}',
'{"last_calibration": "2024-01-15", "next_calibration": "2024-07-15", "accuracy": "±0.1°C, ±1%RH"}', 'active'),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'co2', 'Vaisala', 'GMP252',
'{"position": "north_wall", "height": 1.5, "coordinates": [6.25, 1.0]}',
'{"last_calibration": "2024-01-20", "next_calibration": "2024-07-20", "accuracy": "±3%"}', 'active');

-- Insert sample plant data
INSERT INTO plants (id, greenhouse_id, zone_id, species, variety, planting_date, growth_stage, plant_count, row_spacing, plant_spacing) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Lactuca sativa', 'Butterhead Lettuce', '2024-09-01', 'mature', 200, 0.3, 0.25),
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Solanum lycopersicum', 'Cherry Tomato', '2024-08-15', 'flowering', 50, 0.8, 0.5);

-- Insert sample sensor readings (recent data for demo)
INSERT INTO sensor_readings (sensor_id, timestamp, value, unit, quality_score)
SELECT
    '880e8400-e29b-41d4-a716-446655440001',
    generate_series(
        NOW() - INTERVAL '7 days',
        NOW(),
        INTERVAL '5 minutes'
    ),
    20 + (random() * 8), -- Temperature between 20-28°C
    'celsius',
    0.95 + (random() * 0.05) -- Quality score 0.95-1.0
FROM generate_series(1, 1);

INSERT INTO sensor_readings (sensor_id, timestamp, value, unit, quality_score)
SELECT
    '880e8400-e29b-41d4-a716-446655440002',
    generate_series(
        NOW() - INTERVAL '7 days',
        NOW(),
        INTERVAL '10 minutes'
    ),
    400 + (random() * 800), -- CO2 between 400-1200 ppm
    'ppm',
    0.90 + (random() * 0.10) -- Quality score 0.90-1.0
FROM generate_series(1, 1);

-- Convert sensor_readings to hypertable for time-series optimization
SELECT create_hypertable('sensor_readings', 'timestamp', if_not_exists => TRUE);

-- Insert sample weather data
INSERT INTO weather_data (greenhouse_id, timestamp, temperature, humidity, wind_speed, solar_radiation, rainfall, pressure)
SELECT
    '660e8400-e29b-41d4-a716-446655440001',
    generate_series(
        NOW() - INTERVAL '30 days',
        NOW(),
        INTERVAL '1 hour'
    ),
    15 + (random() * 10), -- Temperature 15-25°C
    60 + (random() * 30), -- Humidity 60-90%
    0 + (random() * 15), -- Wind speed 0-15 m/s
    0 + (random() * 1000), -- Solar radiation 0-1000 W/m²
    0 + (random() * 5), -- Rainfall 0-5 mm
    1000 + (random() * 50) -- Pressure 1000-1050 hPa
FROM generate_series(1, 1);

-- Convert weather_data to hypertable
SELECT create_hypertable('weather_data', 'timestamp', if_not_exists => TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_time ON sensor_readings (sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_weather_data_greenhouse_time ON weather_data (greenhouse_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_sensors_greenhouse_zone ON sensors (greenhouse_id, zone_id);

COMMIT;