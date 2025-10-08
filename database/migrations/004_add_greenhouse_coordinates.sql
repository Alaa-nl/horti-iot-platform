-- Add coordinate columns to greenhouses table
ALTER TABLE greenhouses
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) DEFAULT 52.0607,
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) DEFAULT 4.3517,
ADD COLUMN IF NOT EXISTS city VARCHAR(255) DEFAULT 'Unknown',
ADD COLUMN IF NOT EXISTS region VARCHAR(255) DEFAULT 'Netherlands';

-- Create index for spatial queries (useful for finding nearby greenhouses)
CREATE INDEX IF NOT EXISTS idx_greenhouse_coordinates ON greenhouses(latitude, longitude);

-- Update existing greenhouses with default Netherlands coordinates
-- These will be updated with real coordinates when greenhouses are edited
UPDATE greenhouses
SET latitude = 52.0607,
    longitude = 4.3517,
    city = 'Westland',
    region = 'South Holland'
WHERE latitude IS NULL;