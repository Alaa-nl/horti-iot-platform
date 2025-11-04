-- Migration: Add constraints for sap flow measurements
-- Purpose: Ensure data integrity and prevent duplicate sensor readings
-- Date: 2025-11-03

-- Add unique constraint to prevent duplicate measurements
-- Each timestamp + sensor combination should be unique
ALTER TABLE sap_flow_measurements
DROP CONSTRAINT IF EXISTS unique_measurement;

ALTER TABLE sap_flow_measurements
ADD CONSTRAINT unique_measurement
UNIQUE (timestamp, sensor_code);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sap_flow_date_range
ON sap_flow_measurements(timestamp DESC, sensor_code);

-- Create index for plant_id queries
CREATE INDEX IF NOT EXISTS idx_sap_flow_plant_date
ON sap_flow_measurements(plant_id, timestamp DESC)
WHERE plant_id IS NOT NULL;

-- Create index for greenhouse_id queries
CREATE INDEX IF NOT EXISTS idx_sap_flow_greenhouse_date
ON sap_flow_measurements(greenhouse_id, timestamp DESC)
WHERE greenhouse_id IS NOT NULL;

-- Create partial index for recent data (last 30 days)
-- This will speed up queries for recent/live data
CREATE INDEX IF NOT EXISTS idx_sap_flow_recent
ON sap_flow_measurements(sensor_code, timestamp DESC)
WHERE timestamp > NOW() - INTERVAL '30 days';

-- Add check constraint to ensure data quality
ALTER TABLE sap_flow_measurements
DROP CONSTRAINT IF EXISTS check_data_quality;

ALTER TABLE sap_flow_measurements
ADD CONSTRAINT check_data_quality
CHECK (data_quality IN ('good', 'poor', 'interpolated'));

-- Add check constraint for reasonable value ranges
-- Based on observed data: sap flow 0-200 g/h, diameter 5-25 mm
ALTER TABLE sap_flow_measurements
DROP CONSTRAINT IF EXISTS check_reasonable_values;

ALTER TABLE sap_flow_measurements
ADD CONSTRAINT check_reasonable_values
CHECK (
  (sap_flow_rate_gh IS NULL OR (sap_flow_rate_gh >= 0 AND sap_flow_rate_gh <= 500)) AND
  (stem_diameter_mm IS NULL OR (stem_diameter_mm >= 0 AND stem_diameter_mm <= 50))
);

-- Add comment to table
COMMENT ON TABLE sap_flow_measurements IS 'Stores raw sensor data from PhytoSense API at 5-minute intervals';
COMMENT ON COLUMN sap_flow_measurements.timestamp IS 'Exact time of measurement (5-minute intervals)';
COMMENT ON COLUMN sap_flow_measurements.sap_flow_rate_gh IS 'Sap flow rate in grams per hour';
COMMENT ON COLUMN sap_flow_measurements.stem_diameter_mm IS 'Stem diameter in millimeters';
COMMENT ON COLUMN sap_flow_measurements.sensor_code IS 'Device/sensor identifier from PhytoSense';
COMMENT ON COLUMN sap_flow_measurements.data_quality IS 'Quality indicator: good, poor, or interpolated';

-- Create a function to get the latest reading for each sensor
CREATE OR REPLACE FUNCTION get_latest_sensor_readings()
RETURNS TABLE (
  sensor_code VARCHAR,
  latest_timestamp TIMESTAMPTZ,
  sap_flow DECIMAL,
  diameter DECIMAL,
  is_live BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (s.sensor_code)
    s.sensor_code,
    s.timestamp AS latest_timestamp,
    s.sap_flow_rate_gh AS sap_flow,
    s.stem_diameter_mm AS diameter,
    (s.timestamp > NOW() - INTERVAL '10 minutes') AS is_live
  FROM sap_flow_measurements s
  WHERE s.timestamp > NOW() - INTERVAL '24 hours'
  ORDER BY s.sensor_code, s.timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for hourly statistics (optional, for performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_sensor_statistics AS
SELECT
  date_trunc('hour', timestamp) AS hour,
  sensor_code,
  COUNT(*) AS measurement_count,
  AVG(sap_flow_rate_gh) AS avg_sap_flow,
  MIN(sap_flow_rate_gh) AS min_sap_flow,
  MAX(sap_flow_rate_gh) AS max_sap_flow,
  AVG(stem_diameter_mm) AS avg_diameter,
  MIN(stem_diameter_mm) AS min_diameter,
  MAX(stem_diameter_mm) AS max_diameter
FROM sap_flow_measurements
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY date_trunc('hour', timestamp), sensor_code;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_hourly_stats_sensor_hour
ON hourly_sensor_statistics(sensor_code, hour DESC);

-- Add refresh policy for the materialized view (refresh every hour)
-- Note: This requires pg_cron extension or manual refresh
COMMENT ON MATERIALIZED VIEW hourly_sensor_statistics IS 'Hourly aggregated statistics for performance. Refresh with: REFRESH MATERIALIZED VIEW hourly_sensor_statistics;';