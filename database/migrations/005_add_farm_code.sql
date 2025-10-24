-- Add a simple farm_code column for user-friendly IDs
ALTER TABLE greenhouses
ADD COLUMN IF NOT EXISTS farm_code VARCHAR(20) UNIQUE;

-- Create a sequence for auto-incrementing farm codes
CREATE SEQUENCE IF NOT EXISTS farm_code_seq START WITH 1;

-- Function to generate farm codes like FARM-001, FARM-002, etc.
CREATE OR REPLACE FUNCTION generate_farm_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.farm_code IS NULL THEN
        NEW.farm_code := 'FARM-' || LPAD(nextval('farm_code_seq')::text, 3, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate farm codes for new greenhouses
DROP TRIGGER IF EXISTS set_farm_code ON greenhouses;
CREATE TRIGGER set_farm_code
    BEFORE INSERT ON greenhouses
    FOR EACH ROW
    EXECUTE FUNCTION generate_farm_code();

-- Update existing greenhouses with farm codes
UPDATE greenhouses
SET farm_code = 'FARM-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0')
WHERE farm_code IS NULL;

-- Add index for quick lookups by farm_code
CREATE INDEX IF NOT EXISTS idx_farm_code ON greenhouses(farm_code);