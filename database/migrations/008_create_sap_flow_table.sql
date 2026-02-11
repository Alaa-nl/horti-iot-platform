-- Migration: Create sap_flow table for PhytoSense data
-- Purpose: Create the correct table structure that matches the application code
-- Date: 2025-11-03
-- This table stores raw sensor data from PhytoSense API at 5-minute intervals

-- Drop the table if it exists to ensure clean state
DROP TABLE IF EXISTS sap_flow CASCADE;

-- Create the sap_flow table that matches what the code expects
CREATE TABLE sap_flow (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL,  -- Main timestamp column
    time VARCHAR(5),                 -- Time in HH:mm format
    sap_flow_value DECIMAL(12,6),    -- Sap flow in g/h (can be NULL)
    sensor_code VARCHAR(50) NOT NULL, -- Device identifier (e.g., 'Stem051')
    device_id VARCHAR(50),            -- Device ID (legacy, usually '0')
    device_name VARCHAR(100),         -- Short device name
    full_device_name VARCHAR(200),    -- Full name with description
    stem_diameter_value DECIMAL(12,6), -- Diameter in mm (can be NULL)
    is_valid BOOLEAN DEFAULT true,
    is_interpolated BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Add unique constraint to prevent duplicate measurements
-- Each timestamp + sensor combination should be unique
ALTER TABLE sap_flow
ADD CONSTRAINT unique_sap_flow_measurement
UNIQUE (timestamp, sensor_code);

-- Create indexes for better query performance
CREATE INDEX idx_sap_flow_timestamp_desc
ON sap_flow(timestamp DESC);

CREATE INDEX idx_sap_flow_sensor_timestamp
ON sap_flow(sensor_code, timestamp DESC);

-- Index for date range queries
CREATE INDEX idx_sap_flow_date_range
ON sap_flow(timestamp DESC, sensor_code);

-- Partial index for recent data (last 30 days)
-- This speeds up queries for recent/live data
CREATE INDEX idx_sap_flow_recent
ON sap_flow(sensor_code, timestamp DESC)
WHERE timestamp > NOW() - INTERVAL '30 days';

-- Add check constraints for reasonable value ranges
-- Based on observed data: sap flow 0-500 g/h, diameter 0-50 mm
ALTER TABLE sap_flow
ADD CONSTRAINT check_sap_flow_values
CHECK (
    (sap_flow_value IS NULL OR (sap_flow_value >= -10 AND sap_flow_value <= 500)) AND
    (stem_diameter_value IS NULL OR (stem_diameter_value >= 0 AND stem_diameter_value <= 50))
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sap_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on row updates
CREATE TRIGGER update_sap_flow_updated_at_trigger
BEFORE UPDATE ON sap_flow
FOR EACH ROW
EXECUTE FUNCTION update_sap_flow_updated_at();

-- Add comments to document the table
COMMENT ON TABLE sap_flow IS 'Stores raw sensor data from PhytoSense API at 5-minute intervals';
COMMENT ON COLUMN sap_flow.timestamp IS 'Exact time of measurement (5-minute intervals)';
COMMENT ON COLUMN sap_flow.time IS 'Time in HH:mm format for display';
COMMENT ON COLUMN sap_flow.sap_flow_value IS 'Sap flow rate in grams per hour';
COMMENT ON COLUMN sap_flow.stem_diameter_value IS 'Stem diameter in millimeters';
COMMENT ON COLUMN sap_flow.sensor_code IS 'Device/sensor identifier from PhytoSense (e.g., Stem051, Stem136)';
COMMENT ON COLUMN sap_flow.full_device_name IS 'Full device name including location and crop type';
COMMENT ON COLUMN sap_flow.is_valid IS 'Whether the data point is valid';
COMMENT ON COLUMN sap_flow.is_interpolated IS 'Whether the data point was interpolated';

-- Create a view for easy access to latest readings
CREATE OR REPLACE VIEW latest_sensor_readings AS
SELECT DISTINCT ON (sensor_code)
    sensor_code,
    timestamp AS latest_timestamp,
    sap_flow_value AS sap_flow,
    stem_diameter_value AS diameter,
    full_device_name,
    (timestamp > NOW() - INTERVAL '10 minutes') AS is_live
FROM sap_flow
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY sensor_code, timestamp DESC;

-- Grant necessary permissions (adjust based on your database users)
-- Example: GRANT SELECT ON sap_flow TO readonly_user;
-- Example: GRANT ALL ON sap_flow TO app_user;