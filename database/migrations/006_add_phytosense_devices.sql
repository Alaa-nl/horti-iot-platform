-- Migration: Add PhytoSense Device Configurations
-- Purpose: Store PhytoSense device configurations in database instead of hardcoded values
-- Date: 2025-10-23

-- Create phytosense_devices table
CREATE TABLE IF NOT EXISTS phytosense_devices (
    id SERIAL PRIMARY KEY,
    setup_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    from_date TIMESTAMP NOT NULL,
    to_date TIMESTAMP,
    diameter_tdid INTEGER NOT NULL,
    diameter_channel_id INTEGER NOT NULL DEFAULT 0,
    sapflow_tdid INTEGER NOT NULL,
    sapflow_channel_id INTEGER NOT NULL DEFAULT 0,
    crop_type VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_phytosense_devices_setup_id ON phytosense_devices(setup_id);
CREATE INDEX idx_phytosense_devices_is_active ON phytosense_devices(is_active);
CREATE INDEX idx_phytosense_devices_crop_type ON phytosense_devices(crop_type);
CREATE INDEX idx_phytosense_devices_dates ON phytosense_devices(from_date, to_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_phytosense_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_phytosense_devices_updated_at
    BEFORE UPDATE ON phytosense_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_phytosense_devices_updated_at();

-- Insert existing device configurations
INSERT INTO phytosense_devices (
    setup_id, name, from_date, to_date,
    diameter_tdid, diameter_channel_id,
    sapflow_tdid, sapflow_channel_id,
    crop_type, is_active
) VALUES
    (1324, 'Stem051 - NL 2022 MKB Raak', '2022-10-19T00:00:00', '2023-06-01T09:42:23',
     33385, 0, 33387, 0, 'General', FALSE),
    (1324, 'Stem127 - NL 2022 MKB Raak', '2022-10-19T00:00:00', '2023-06-01T09:42:23',
     33386, 0, 33388, 0, 'General', FALSE),
    (1445, 'Stem051 - NL 2023 Tomato', '2023-06-23T00:00:00', '2023-08-25T13:30:00',
     38210, 0, 39916, 0, 'Tomato', FALSE),
    (1445, 'Stem136 - NL 2023 Tomato', '2023-06-23T00:00:00', '2023-08-25T13:30:00',
     38211, 0, 39915, 0, 'Tomato', FALSE),
    (1445, 'Stem051 - NL 2023 Cucumber', '2023-08-25T13:30:00', '2023-10-20T00:00:00',
     38210, 0, 39916, 0, 'Cucumber', FALSE),
    (1445, 'Stem136 - NL 2023 Cucumber', '2023-08-25T13:30:00', '2023-10-20T00:00:00',
     38211, 0, 39915, 0, 'Cucumber', FALSE),
    (1508, 'Stem051 - NL 2023-2024 MKB Raak', '2023-11-01T00:00:00', '2024-10-15T12:00:00',
     39999, 0, 39987, 0, 'General', TRUE),
    (1508, 'Stem136 - NL 2023-2024 MKB Raak', '2023-11-01T00:00:00', '2024-10-15T12:00:00',
     40007, 0, 39981, 0, 'General', TRUE)
ON CONFLICT DO NOTHING;

-- Add comment to table
COMMENT ON TABLE phytosense_devices IS 'Stores PhytoSense device configurations for sap-flow and stem-diameter sensors';
COMMENT ON COLUMN phytosense_devices.setup_id IS 'PhytoSense setup identifier';
COMMENT ON COLUMN phytosense_devices.diameter_tdid IS 'Device Transformation ID for stem diameter measurements';
COMMENT ON COLUMN phytosense_devices.sapflow_tdid IS 'Device Transformation ID for sap flow measurements';
COMMENT ON COLUMN phytosense_devices.is_active IS 'Whether the device is currently active and collecting data';
