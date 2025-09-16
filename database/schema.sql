-- HORTI-IOT Platform Database Schema
-- Based on real data analysis and internship requirements
-- PostgreSQL with TimescaleDB for time-series optimization
-- Updated to match actual sensor data structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- =====================================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- =====================================================

-- Users table for researchers and growers
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('researcher', 'grower')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 2. GREENHOUSE METADATA & CONFIGURATION
-- =====================================================

-- Greenhouse facilities (World Horti Centre lab configuration)
CREATE TABLE greenhouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL, -- e.g., "World Horti Center, Naaldwijk, Netherlands"
    dimensions JSONB NOT NULL, -- {length: 12.5, width: 6.4, height: 6.0, unit: "m"}
    area_m2 DECIMAL(8,2) NOT NULL,
    crop_type VARCHAR(100) DEFAULT 'tomato',
    variety VARCHAR(100), -- e.g., "Xandor XR"
    rootstock VARCHAR(100), -- e.g., "Maxifort"
    planting_date DATE,
    supplier VARCHAR(100), -- e.g., "Axia Vegetable Seeds"
    substrate_info VARCHAR(200), -- e.g., "Cocopeat, Forteco Profit, Slabs - Van der Knaap Group"
    climate_system VARCHAR(100) DEFAULT 'Hoogendoorn and Priva',
    lighting_system VARCHAR(100) DEFAULT 'LED - DLI 18 mol/m2 per day',
    growing_system VARCHAR(100),
    co2_target_ppm INTEGER DEFAULT 1000, -- Applied during light periods
    temperature_range_c VARCHAR(50) DEFAULT '18.5-23°C', -- RTR based temperature
    configuration JSONB, -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Plant tracking for individual plant measurements
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    plant_code VARCHAR(20) UNIQUE NOT NULL, -- 'stem051', 'stem136' etc.
    variety VARCHAR(100),
    planting_date DATE,
    row_number INTEGER,
    position_in_row INTEGER,
    is_monitored BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sensor definitions and metadata (based on real sensor codes)
CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL, -- For plant-specific sensors
    sensor_code VARCHAR(20) NOT NULL, -- 'stem051', 'stem136', 'ttyACM0'
    device_identifier VARCHAR(50), -- Physical device ID
    sensor_type VARCHAR(50) NOT NULL, -- 'sap_flow', 'stem_diameter', 'lai', 'climate', 'rgbd_camera'
    sensor_name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100), -- e.g., '2GROW', 'Intel RealSense', 'Hoogendoorn'
    model VARCHAR(100), -- e.g., 'Dynagage SF', 'D435', 'Priva'
    unit VARCHAR(20), -- 'g/h', 'mm', 'LAI units', '°C'
    location_in_greenhouse VARCHAR(100),
    installation_date DATE,
    calibration_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
    metadata JSONB, -- Additional sensor configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TIME-SERIES SENSOR DATA (Core requirement)
-- =====================================================

-- Climate data (5-minute intervals as per research paper)
-- Based on actual Excel structure: Climate January 2024-May 2024.xlsx
CREATE TABLE climate_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,

    -- Core climate measurements (following HORTI-IOT data principles)
    temperature_c DECIMAL(5,2), -- °C - greenhouse temperature
    absolute_humidity_gm3 DECIMAL(6,2), -- g/m³ - absolute moisture content
    co2_concentration_ppm INTEGER, -- ppm - CO2 levels (typically 1000 during light periods)
    radiation_wm2 DECIMAL(8,2), -- W/m² - solar radiation
    par_umol_m2_s DECIMAL(8,2), -- µmol/m²/s - Photosynthetic Active Radiation
    vpd_kpa DECIMAL(6,3), -- kPa - Vapor Pressure Deficit (plant vs air)
    radiation_out_pyrgeometer_wm2 DECIMAL(8,2), -- W/m² - outgoing radiation
    humidity_deficit_gm3 DECIMAL(6,2), -- g/m³ - saturated AH minus AH

    -- External conditions
    outside_temperature_c DECIMAL(5,2), -- °C
    outside_humidity_percent DECIMAL(5,2), -- %
    wind_speed_ms DECIMAL(5,2), -- m/s

    -- Metadata and quality indicators
    data_quality VARCHAR(20) DEFAULT 'good' CHECK (data_quality IN ('good', 'poor', 'interpolated')),
    source_system VARCHAR(50) DEFAULT 'Hoogendoorn/Priva', -- Data source
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('climate_measurements', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- Growth data (weekly intervals as specified in research paper)
CREATE TABLE growth_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Growth measurements (Table 3 specifications)
    head_thickness DECIMAL(5,2), -- mm - Critical metric (target 10mm)
    length_growth DECIMAL(6,2), -- cm
    leaf_area_index DECIMAL(5,3), -- m²/m² - LAI
    stem_diameter DECIMAL(5,2), -- mm
    
    -- Plant health indicators
    plant_health_score INTEGER CHECK (plant_health_score BETWEEN 0 AND 100),
    notes TEXT,
    measured_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sap flow & stem diameter measurements (5-minute intervals, 2GROW system)
-- Based on actual data: DateTime, Diameter051, Sapflow051, Diameter136, Sapflow136
CREATE TABLE sap_flow_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    sensor_code VARCHAR(20) NOT NULL, -- 'stem051', 'stem136'

    -- Measurements (matching real data precision)
    sap_flow_rate_gh DECIMAL(12,6), -- g/h, can be NULL/NA
    stem_diameter_mm DECIMAL(12,6) NOT NULL, -- mm, high precision

    -- Data quality and metadata
    data_quality VARCHAR(20) DEFAULT 'good' CHECK (data_quality IN ('good', 'poor', 'interpolated')),
    is_interpolated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to TimescaleDB hypertable for optimal time-series performance
SELECT create_hypertable('sap_flow_measurements', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- LAI measurements (10-second intervals based on real data)
-- Based on: 20230920-091810+0200 1 1.577766 0 25.40088
CREATE TABLE lai_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    sensor_id INTEGER NOT NULL, -- Sensor ID from data (1, 2, etc.)
    device_code VARCHAR(20) NOT NULL, -- 'ttyACM0' etc.

    -- LAI measurements
    lai_value DECIMAL(8,6) NOT NULL, -- Leaf Area Index
    status_code INTEGER DEFAULT 0, -- Status from sensor
    temperature_c DECIMAL(6,3) NOT NULL, -- Temperature reading

    -- Data quality
    data_quality VARCHAR(20) DEFAULT 'good',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('lai_measurements', 'timestamp', chunk_time_interval => INTERVAL '1 hour');

-- Irrigation data (5-minute intervals) - Based on real data structure
CREATE TABLE irrigation_measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,

    -- Water delivery (following HORTI-IOT data principles)
    water_given_lm2 DECIMAL(8,3), -- l/m² - amount of water supplied to plants
    water_given_total_l DECIMAL(10,2), -- l - total water amount
    water_ec_mscm DECIMAL(6,3), -- mS/cm - Electrical Conductivity of supplied water
    water_ph DECIMAL(4,2), -- pH level of supplied water

    -- Drainage and uptake monitoring
    drained_water_amount_l DECIMAL(8,2), -- l - amount of water drained
    drained_water_ec_mscm DECIMAL(5,2), -- mS/cm - EC of drained water
    absorbed_water_amount_l DECIMAL(8,2), -- l - water uptake by plants

    -- System information
    irrigation_cycle_id INTEGER, -- Irrigation event identifier
    data_quality VARCHAR(20) DEFAULT 'good',
    source_system VARCHAR(50) DEFAULT 'Priva',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('irrigation_measurements', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- RGBD camera image data and analysis (Intel RealSense D435)
-- Based on head thickness monitoring - Scenario 2 from research paper
CREATE TABLE camera_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL,
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    plant_id UUID REFERENCES plants(id) ON DELETE CASCADE, -- Plant being monitored
    camera_sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,

    -- Image storage (150-second intervals)
    image_path VARCHAR(500) NOT NULL, -- Path to stored image (Raspberry Pi 4)
    s3_bucket VARCHAR(100), -- S3 bucket for cloud storage
    s3_key VARCHAR(500), -- S3 object key
    image_type VARCHAR(20) DEFAULT 'rgbd' CHECK (image_type IN ('rgb', 'depth', 'rgbd')),
    resolution VARCHAR(20) DEFAULT '1920x1080', -- Intel RealSense D435 resolution
    file_size_bytes BIGINT,
    angle_degrees INTEGER DEFAULT 45, -- Camera angle (45 degrees as per research)

    -- ML Analysis Results (YOLO model predictions)
    head_thickness_pixels DECIMAL(8,2), -- Measured in pixels by YOLO
    head_thickness_mm DECIMAL(5,2), -- Converted to mm (target: ~10mm)
    yolo_model_version VARCHAR(50), -- YOLOv8, YOLOv10, YOLOv11 etc.
    detection_confidence DECIMAL(5,4), -- Model confidence score
    bounding_box_coordinates JSONB, -- {x1, y1, x2, y2} for detected head
    plant_health_score DECIMAL(5,2), -- Overall health assessment

    -- Plant condition detection
    is_weak_growth BOOLEAN DEFAULT FALSE, -- thickness < 10mm
    is_excessive_growth BOOLEAN DEFAULT FALSE, -- thickness > 10mm
    pest_detection_results JSONB, -- Pest detection from YOLO
    disease_indicators JSONB, -- Disease detection results

    -- Camera metadata (GDPR sensitive as per research paper)
    camera_metadata JSONB, -- Location, date, time, photographer info
    is_gdpr_sensitive BOOLEAN DEFAULT TRUE, -- Contains metadata
    is_shareable BOOLEAN DEFAULT FALSE, -- GDPR compliance - metadata sensitive
    anonymized_version_path VARCHAR(500), -- Path to anonymized version

    -- Processing status
    is_processed BOOLEAN DEFAULT FALSE,
    processing_error TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to TimescaleDB hypertable
SELECT create_hypertable('camera_images', 'timestamp', chunk_time_interval => INTERVAL '1 day');

-- =====================================================
-- 4. MACHINE LEARNING & PREDICTIONS
-- =====================================================

-- ML model predictions and results
CREATE TABLE ml_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    
    -- Prediction categories
    prediction_type VARCHAR(50) NOT NULL, -- 'yield_forecast', 'disease_risk', 'growth_rate', etc.
    
    -- Input data snapshot
    input_data JSONB NOT NULL, -- Sensor data used for prediction
    
    -- Prediction results
    predictions JSONB NOT NULL, -- Model outputs
    confidence_scores JSONB, -- Confidence for each prediction
    
    -- Business impact
    expected_yield DECIMAL(8,2), -- kg/m²
    disease_risk_percentage DECIMAL(5,2),
    growth_rate_percentage DECIMAL(5,2),
    optimal_harvest_date DATE,
    water_stress_level DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI-generated recommendations and alerts
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    prediction_id UUID REFERENCES ml_predictions(id) ON DELETE CASCADE,
    
    -- Recommendation details
    category VARCHAR(50) NOT NULL, -- 'irrigation', 'climate', 'nutrition', 'harvest'
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    action_title VARCHAR(255) NOT NULL,
    action_description TEXT NOT NULL,
    reasoning TEXT,
    expected_impact VARCHAR(255), -- "+2% yield", "€300/month savings"
    
    -- Implementation tracking
    is_implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMP WITH TIME ZONE,
    implemented_by UUID REFERENCES users(id),
    implementation_notes TEXT,
    
    -- Lifecycle
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. FINANCIAL & INVESTMENT DATA (Grower dashboard)
-- =====================================================

-- Investment tracking
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    
    -- Investment details
    category VARCHAR(100) NOT NULL, -- 'Climate Control', 'LED Lighting', 'IoT Systems'
    subcategory VARCHAR(100),
    description TEXT,
    
    -- Financial data
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    investment_date DATE NOT NULL,
    
    -- ROI tracking
    expected_roi DECIMAL(5,2), -- Percentage
    expected_payback_months INTEGER,
    actual_roi DECIMAL(5,2),
    actual_payback_months INTEGER,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Revenue and financial performance (monthly aggregation)
CREATE TABLE financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Revenue data
    total_revenue DECIMAL(12,2) NOT NULL,
    revenue_per_m2 DECIMAL(8,2) NOT NULL,
    
    -- Production metrics
    total_yield_kg DECIMAL(10,2),
    yield_per_m2 DECIMAL(8,2),
    average_price_per_kg DECIMAL(6,2),
    quality_premium_percentage DECIMAL(5,2),
    
    -- Operating costs breakdown (as per research requirements)
    operating_costs JSONB NOT NULL, -- {energy: 8500, labor: 7200, materials: 6800, water: 1200, maintenance: 4800}
    total_operating_costs DECIMAL(12,2) NOT NULL,
    
    -- Calculated metrics
    net_profit DECIMAL(12,2) NOT NULL,
    profit_margin DECIMAL(5,2) NOT NULL,
    roi_percentage DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resource efficiency tracking
CREATE TABLE efficiency_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    
    -- Resource usage (units from research paper Table 2)
    water_usage_l_per_m2_per_day DECIMAL(6,3), -- l/m²/day
    energy_consumption_kwh_per_m2 DECIMAL(8,2), -- kWh/m²/month
    co2_usage_kg_per_m2 DECIMAL(6,3), -- kg/m²/month
    substrate_utilization_percentage DECIMAL(5,2), -- % utilization
    
    -- Efficiency scores and targets
    water_efficiency_score DECIMAL(5,2), -- Percentage vs optimal
    energy_efficiency_score DECIMAL(5,2),
    co2_efficiency_score DECIMAL(5,2),
    overall_efficiency_score DECIMAL(5,2),
    
    -- Potential savings calculations
    potential_water_savings_eur DECIMAL(8,2),
    potential_energy_savings_eur DECIMAL(8,2),
    potential_co2_savings_eur DECIMAL(8,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market data and pricing intelligence
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    date DATE NOT NULL,
    region VARCHAR(100) DEFAULT 'Netherlands',
    
    -- Market pricing
    crop_type VARCHAR(50) NOT NULL,
    average_price_per_kg DECIMAL(6,2) NOT NULL,
    price_change_percentage DECIMAL(5,2),
    
    -- Market conditions
    demand_index DECIMAL(5,2), -- Market demand indicator
    supply_index DECIMAL(5,2), -- Market supply indicator
    quality_premium DECIMAL(5,2), -- Premium for high-quality produce
    
    -- Forecasting data
    projected_price_change DECIMAL(5,2), -- Next month projection
    seasonal_factor DECIMAL(5,2), -- Seasonal price adjustment
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. SYSTEM MONITORING & ALERTS
-- =====================================================

-- System alerts and notifications
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID NOT NULL REFERENCES greenhouses(id) ON DELETE CASCADE,
    
    -- Alert classification
    alert_type VARCHAR(50) NOT NULL, -- 'sensor_failure', 'threshold_exceeded', 'prediction_alert'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    
    -- Alert content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100), -- Which system/sensor generated the alert
    
    -- Related data
    related_sensor_id UUID REFERENCES sensors(id),
    related_data JSONB, -- Additional context data
    
    -- Lifecycle
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API integration logs and external system monitoring
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- API call details
    external_system VARCHAR(100) NOT NULL, -- 'climate_computer', 'lets_grow', '2grow', 'ml_service'
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    
    -- Request/Response
    request_payload JSONB,
    response_payload JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,
    
    -- Success/Error tracking
    is_successful BOOLEAN NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 7. INDEXES FOR PERFORMANCE (Time-series optimization)
-- =====================================================

-- Time-series data indexes (critical for performance) - Updated for new table names
CREATE INDEX idx_climate_measurements_timestamp ON climate_measurements(greenhouse_id, timestamp DESC);
CREATE INDEX idx_climate_measurements_temp ON climate_measurements(timestamp, temperature_c) WHERE temperature_c IS NOT NULL;
CREATE INDEX idx_sap_flow_measurements_timestamp ON sap_flow_measurements(greenhouse_id, timestamp DESC);
CREATE INDEX idx_sap_flow_measurements_plant ON sap_flow_measurements(plant_id, timestamp DESC);
CREATE INDEX idx_sap_flow_measurements_sensor ON sap_flow_measurements(sensor_code, timestamp DESC);
CREATE INDEX idx_irrigation_measurements_timestamp ON irrigation_measurements(greenhouse_id, timestamp DESC);
CREATE INDEX idx_lai_measurements_timestamp ON lai_measurements(greenhouse_id, timestamp DESC);
CREATE INDEX idx_lai_measurements_device ON lai_measurements(device_code, timestamp DESC);
CREATE INDEX idx_growth_data_timestamp ON growth_data(greenhouse_id, timestamp DESC);
CREATE INDEX idx_camera_images_timestamp ON camera_images(greenhouse_id, timestamp DESC);
CREATE INDEX idx_camera_images_plant ON camera_images(plant_id, timestamp DESC);
CREATE INDEX idx_camera_images_processed ON camera_images(is_processed, timestamp DESC) WHERE is_processed = FALSE;

-- Plant and sensor relationship indexes
CREATE INDEX idx_plants_greenhouse ON plants(greenhouse_id);
CREATE INDEX idx_plants_code ON plants(plant_code);
CREATE INDEX idx_sensors_code ON sensors(sensor_code);
CREATE INDEX idx_sensors_type ON sensors(sensor_type, greenhouse_id);
CREATE INDEX idx_sensors_plant ON sensors(plant_id) WHERE plant_id IS NOT NULL;

-- User and session indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = TRUE;

-- Sensor and monitoring indexes
CREATE INDEX idx_sensors_greenhouse ON sensors(greenhouse_id);
CREATE INDEX idx_sensors_type_status ON sensors(sensor_type, status);
CREATE INDEX idx_alerts_greenhouse_unresolved ON alerts(greenhouse_id) WHERE is_resolved = FALSE;

-- Financial and ML indexes
CREATE INDEX idx_financial_records_greenhouse ON financial_records(greenhouse_id, period_start DESC);
CREATE INDEX idx_ml_predictions_greenhouse ON ml_predictions(greenhouse_id, timestamp DESC);
CREATE INDEX idx_recommendations_active ON recommendations(greenhouse_id) WHERE is_active = TRUE;

-- Market data index
CREATE INDEX idx_market_data_date ON market_data(date DESC, crop_type);

-- =====================================================
-- 8. PARTITIONING FOR LARGE TIME-SERIES DATA
-- =====================================================

-- Partition climate_data by month for better performance
-- This would be implemented in production for large datasets
-- ALTER TABLE climate_data PARTITION BY RANGE (timestamp);

-- =====================================================
-- 9. VIEWS FOR COMMON QUERIES
-- =====================================================

-- Latest sensor readings view (updated for new table structure)
CREATE VIEW latest_climate_readings AS
SELECT DISTINCT ON (greenhouse_id)
    greenhouse_id,
    timestamp,
    temperature_c,
    absolute_humidity_gm3,
    co2_concentration_ppm,
    radiation_wm2,
    par_umol_m2_s,
    vpd_kpa,
    outside_temperature_c,
    data_quality
FROM climate_measurements
ORDER BY greenhouse_id, timestamp DESC;

-- Latest sap flow and diameter measurements per plant
CREATE VIEW latest_sap_flow_readings AS
SELECT DISTINCT ON (plant_id)
    sf.plant_id,
    sf.sensor_code,
    sf.timestamp,
    sf.sap_flow_rate_gh,
    sf.stem_diameter_mm,
    p.plant_code,
    sf.data_quality
FROM sap_flow_measurements sf
JOIN plants p ON sf.plant_id = p.id
ORDER BY plant_id, timestamp DESC;

-- Real-time LAI measurements view
CREATE VIEW latest_lai_readings AS
SELECT DISTINCT ON (device_code)
    device_code,
    timestamp,
    lai_value,
    temperature_c,
    greenhouse_id,
    data_quality
FROM lai_measurements
ORDER BY device_code, timestamp DESC;

-- Current month financial summary
CREATE VIEW current_month_financial_summary AS
SELECT 
    greenhouse_id,
    total_revenue,
    revenue_per_m2,
    total_yield_kg,
    yield_per_m2,
    net_profit,
    profit_margin,
    roi_percentage
FROM financial_records 
WHERE period_start >= date_trunc('month', CURRENT_DATE);

-- Active recommendations view
CREATE VIEW active_recommendations AS
SELECT 
    r.*,
    g.name as greenhouse_name
FROM recommendations r
JOIN greenhouses g ON r.greenhouse_id = g.id
WHERE r.is_active = TRUE 
    AND (r.expires_at IS NULL OR r.expires_at > CURRENT_TIMESTAMP);

-- =====================================================
-- 10. TRIGGERS FOR DATA INTEGRITY
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_greenhouses_updated_at BEFORE UPDATE ON greenhouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sensors_updated_at BEFORE UPDATE ON sensors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Data quality validation triggers based on real data analysis

-- Climate data validation (based on observed ranges)
CREATE OR REPLACE FUNCTION validate_climate_measurements()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate temperature range (observed: 18.5-23°C in greenhouse, -10 to 50°C reasonable range)
    IF NEW.temperature_c IS NOT NULL AND (NEW.temperature_c < -10 OR NEW.temperature_c > 50) THEN
        NEW.data_quality = 'poor';
    END IF;

    -- Validate CO2 range (200-2000 ppm, target 1000 ppm during light periods)
    IF NEW.co2_concentration_ppm IS NOT NULL AND (NEW.co2_concentration_ppm < 200 OR NEW.co2_concentration_ppm > 2000) THEN
        NEW.data_quality = 'poor';
    END IF;

    -- Validate radiation (non-negative)
    IF NEW.radiation_wm2 IS NOT NULL AND NEW.radiation_wm2 < 0 THEN
        NEW.data_quality = 'poor';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Sap flow data validation (based on observed ranges: 40-71 g/h)
CREATE OR REPLACE FUNCTION validate_sap_flow_measurements()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate sap flow rate (should be positive if not NULL)
    IF NEW.sap_flow_rate_gh IS NOT NULL AND NEW.sap_flow_rate_gh < 0 THEN
        NEW.data_quality = 'poor';
    END IF;

    -- Validate stem diameter (observed range: 10-14mm)
    IF NEW.stem_diameter_mm IS NOT NULL AND (NEW.stem_diameter_mm < 5 OR NEW.stem_diameter_mm > 25) THEN
        NEW.data_quality = 'poor';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- LAI measurements validation (observed range: 1.4-1.7)
CREATE OR REPLACE FUNCTION validate_lai_measurements()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate LAI value (typically 0-10 range)
    IF NEW.lai_value IS NOT NULL AND (NEW.lai_value < 0 OR NEW.lai_value > 10) THEN
        NEW.data_quality = 'poor';
    END IF;

    -- Validate temperature (observed ~25-27°C)
    IF NEW.temperature_c IS NOT NULL AND (NEW.temperature_c < -10 OR NEW.temperature_c > 50) THEN
        NEW.data_quality = 'poor';
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply validation triggers
CREATE TRIGGER validate_climate_measurements_trigger BEFORE INSERT OR UPDATE ON climate_measurements FOR EACH ROW EXECUTE FUNCTION validate_climate_measurements();
CREATE TRIGGER validate_sap_flow_measurements_trigger BEFORE INSERT OR UPDATE ON sap_flow_measurements FOR EACH ROW EXECUTE FUNCTION validate_sap_flow_measurements();
CREATE TRIGGER validate_lai_measurements_trigger BEFORE INSERT OR UPDATE ON lai_measurements FOR EACH ROW EXECUTE FUNCTION validate_lai_measurements();

-- =====================================================
-- 11. SECURITY & ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_policy ON users FOR ALL TO authenticated_user USING (id = current_user_id());

-- Function to get current user ID (would be implemented based on JWT)
-- CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
-- BEGIN
--     RETURN (current_setting('app.current_user_id'))::UUID;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;