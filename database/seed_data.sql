-- HORTI-IOT Platform Sample Data
-- Based on research paper specifications and World Horti Center lab setup
-- This data represents the actual experimental setup described in the research

-- =====================================================
-- 1. SAMPLE USERS (Demo credentials from frontend)
-- =====================================================

INSERT INTO users (id, email, password_hash, name, role, is_active, created_at, last_login) VALUES 
(
    uuid_generate_v4(),
    'researcher@demo.com',
    '$2b$12$LQv3c1yqBwlVHpPd7sMYMOBSjd7EXGTr09ldHl1bQ8NQYjm6f/o7i', -- 'demo123' hashed
    'Dr. Research Expert',
    'researcher',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    'grower@demo.com',
    '$2b$12$LQv3c1yqBwlVHpPd7sMYMOBSjd7EXGTr09ldHl1bQ8NQYjm6f/o7i', -- 'demo123' hashed
    'Alaa farmer',
    'grower',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. GREENHOUSE SETUP (World Horti Center Lab)
-- =====================================================

-- Main greenhouse facility (exact specs from research paper)
INSERT INTO greenhouses (id, name, location, dimensions, area_m2, crop_type, variety, planting_date, climate_system, lighting_system, growing_system, configuration, created_at) VALUES 
(
    uuid_generate_v4(),
    'World Horti Center Lab Greenhouse',
    'World Horti Center, Naaldwijk, Netherlands',
    '{"length": 12.5, "width": 6.4, "height": 6.0, "unit": "m"}',
    80.00,
    'Tomato',
    'Xandor XR on Maxifort rootstock',
    '2022-09-12',
    'Hoogendoorn/Priva',
    'LED (18 mol/m²/day DLI)',
    'Cocopeat (Forteco Profit Slabs)',
    '{
        "co2_target": 1000,
        "temperature_range": {"min": 18.5, "max": 23.0, "unit": "°C"},
        "light_period": "October-March",
        "irrigation_system": "Van der Knaap Group",
        "substrate_supplier": "Van der Knaap Group",
        "seed_supplier": "Axia Vegetable Seeds",
        "rootstock_supplier": "Rijk Zwaan",
        "propagator": "Noordam plants"
    }',
    CURRENT_TIMESTAMP
);

-- Get the greenhouse ID for foreign key references
-- (In real implementation, this would be handled programmatically)

-- =====================================================
-- 3. SENSOR CONFIGURATION (Based on research setup)
-- =====================================================

-- Climate sensors (Hoogendoorn system)
INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'CLIMATE_001',
    'climate',
    'Temperature Sensor',
    '°C',
    'Center greenhouse',
    'active',
    '{"system": "Hoogendoorn", "accuracy": "±0.1°C", "range": "0-50°C"}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'CLIMATE_002',
    'climate',
    'Humidity Sensor',
    'g/m³',
    'Center greenhouse',
    'active',
    '{"system": "Hoogendoorn", "measurement_type": "absolute_humidity"}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'CLIMATE_003',
    'climate',
    'CO2 Sensor',
    'ppm',
    'Center greenhouse',
    'active',
    '{"system": "Hoogendoorn", "target_value": 1000}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'CLIMATE_004',
    'climate',
    'PAR Light Sensor',
    'µmol/m²/s',
    'Above canopy',
    'active',
    '{"system": "Hoogendoorn", "measurement_type": "photosynthetic_active_radiation"}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

-- Sap flow sensors (2GROW system)
INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'SAPFLOW_001',
    'sap_flow',
    '2GROW Sap Flow Sensor',
    'g/h',
    'Plant stem',
    'active',
    '{"system": "2GROW", "model": "Dynagage SF", "software": "Phythosens", "measurement_interval": "2.5s"}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

-- RGBD Camera (Intel RealSense D435)
INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'CAMERA_001',
    'rgbd_camera',
    'Intel RealSense D435',
    'pixel',
    'Above plant (45° angle)',
    'active',
    '{
        "system": "Intel RealSense", 
        "model": "D435", 
        "capture_interval": "150s",
        "storage": "Raspberry Pi 4",
        "positioning": "suspended, moveable weekly",
        "measurement_target": "head_thickness"
    }'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

-- Irrigation sensors (Priva system)
INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'IRRIGATION_001',
    'irrigation',
    'Water Flow Sensor',
    'l/m²',
    'Irrigation system',
    'active',
    '{"system": "Priva", "measurement_type": "water_given"}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

INSERT INTO sensors (greenhouse_id, sensor_id, sensor_type, sensor_name, unit, location, status, metadata) 
SELECT 
    g.id,
    'IRRIGATION_002',
    'irrigation',
    'EC Sensor',
    'mS/cm',
    'Irrigation system',
    'maintenance',
    '{"system": "Priva", "measurement_type": "electrical_conductivity"}'
FROM greenhouses g WHERE g.name = 'World Horti Center Lab Greenhouse';

-- =====================================================
-- 4. SAMPLE TIME-SERIES DATA (Last 7 days)
-- =====================================================

-- Climate data (5-minute intervals, realistic values)
WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
time_series AS (
    SELECT generate_series(
        CURRENT_TIMESTAMP - INTERVAL '7 days',
        CURRENT_TIMESTAMP,
        INTERVAL '5 minutes'
    ) AS timestamp
)
INSERT INTO climate_data (
    greenhouse_id, 
    timestamp, 
    temperature, 
    absolute_humidity, 
    co2_concentration, 
    radiation, 
    par_light, 
    vpd, 
    radiation_out_pyrgeometer,
    humidity_deficit
)
SELECT 
    g.id,
    t.timestamp,
    -- Realistic temperature variation (18.5-23°C with daily cycle)
    19.5 + 2.5 * SIN(2 * PI() * EXTRACT(HOUR FROM t.timestamp) / 24) + random() * 0.5,
    -- Absolute humidity (14-18 g/m³)
    15.5 + random() * 3,
    -- CO2 concentration (900-1100 ppm, higher during light periods)
    CASE 
        WHEN EXTRACT(HOUR FROM t.timestamp) BETWEEN 6 AND 18 THEN 950 + random() * 100
        ELSE 1000 + random() * 100
    END,
    -- Radiation (varies with time of day)
    CASE 
        WHEN EXTRACT(HOUR FROM t.timestamp) BETWEEN 6 AND 18 THEN 300 + 200 * SIN(PI() * (EXTRACT(HOUR FROM t.timestamp) - 6) / 12)
        ELSE random() * 50
    END,
    -- PAR light (photosynthetic active radiation)
    CASE 
        WHEN EXTRACT(HOUR FROM t.timestamp) BETWEEN 6 AND 18 THEN 250 + 100 * SIN(PI() * (EXTRACT(HOUR FROM t.timestamp) - 6) / 12)
        ELSE random() * 30
    END,
    -- VPD (0.6-1.0 kPa)
    0.7 + random() * 0.3,
    -- Outgoing radiation
    100 + random() * 50,
    -- Humidity deficit
    3 + random() * 2
FROM greenhouse g, time_series t;

-- Growth data (weekly measurements)
WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
weekly_dates AS (
    SELECT generate_series(
        DATE_TRUNC('week', CURRENT_DATE - INTERVAL '8 weeks'),
        CURRENT_DATE,
        INTERVAL '1 week'
    )::TIMESTAMP WITH TIME ZONE AS timestamp
)
INSERT INTO growth_data (
    greenhouse_id,
    timestamp,
    head_thickness,
    length_growth,
    leaf_area_index,
    stem_diameter,
    plant_health_score
)
SELECT 
    g.id,
    w.timestamp,
    -- Head thickness progressing toward optimal 10mm
    9.0 + (random() * 2.0), -- 9-11mm range
    -- Length growth (weekly increase)
    15 + (random() * 10), -- cm
    -- LAI progressing over time
    3.0 + (random() * 0.5), -- 3.0-3.5 m²/m²
    -- Stem diameter growth
    15.0 + (random() * 2.0), -- mm
    -- Plant health score
    85 + (random() * 15)::INTEGER -- 85-100%
FROM greenhouse g, weekly_dates w;

-- Sap flow data (5-minute intervals, last 24 hours for demo)
WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
sensor AS (
    SELECT id FROM sensors WHERE sensor_id = 'SAPFLOW_001'
),
time_series AS (
    SELECT generate_series(
        CURRENT_TIMESTAMP - INTERVAL '24 hours',
        CURRENT_TIMESTAMP,
        INTERVAL '5 minutes'
    ) AS timestamp
)
INSERT INTO sap_flow_data (
    greenhouse_id,
    sensor_id,
    timestamp,
    sap_flow_rate,
    stem_diameter
)
SELECT 
    g.id,
    s.id,
    t.timestamp,
    -- Sap flow varies with light and temperature
    CASE 
        WHEN EXTRACT(HOUR FROM t.timestamp) BETWEEN 6 AND 18 THEN 45 + random() * 15
        ELSE 30 + random() * 10
    END,
    15.5 + random() * 1.0 -- Stem diameter
FROM greenhouse g, sensor s, time_series t;

-- Irrigation data (5-minute intervals, last 24 hours)
WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
time_series AS (
    SELECT generate_series(
        CURRENT_TIMESTAMP - INTERVAL '24 hours',
        CURRENT_TIMESTAMP,
        INTERVAL '5 minutes'
    ) AS timestamp
)
INSERT INTO irrigation_data (
    greenhouse_id,
    timestamp,
    water_given,
    water_given_total,
    ec_given,
    ph_given,
    absorbed_water_amount
)
SELECT 
    g.id,
    t.timestamp,
    -- Water given (irrigation events)
    CASE 
        WHEN random() < 0.1 THEN 1.5 + random() * 1.0 -- 10% chance of irrigation
        ELSE 0
    END,
    CASE 
        WHEN random() < 0.1 THEN (1.5 + random() * 1.0) * 80 -- Total for greenhouse
        ELSE 0
    END,
    -- EC level
    2.3 + random() * 0.7, -- 2.3-3.0 mS/cm
    -- pH level
    5.8 + random() * 0.4, -- 5.8-6.2
    -- Absorbed water (slightly less than given)
    CASE 
        WHEN random() < 0.1 THEN (1.5 + random() * 1.0) * 80 * 0.85 -- 85% absorption rate
        ELSE 0
    END
FROM greenhouse g, time_series t;

-- =====================================================
-- 5. INVESTMENT DATA (Based on professional setup)
-- =====================================================

WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
)
INSERT INTO investments (greenhouse_id, category, subcategory, description, amount, investment_date, expected_roi, expected_payback_months, status) 
SELECT g.id, * FROM greenhouse g, (VALUES
    ('Climate Control Systems', 'Hoogendoorn/Priva', 'Advanced climate control with CO2 management', 65000.00, '2022-08-01', 24.5, 22, 'active'),
    ('LED Lighting System', 'Professional LED', '18 mol/m²/day DLI lighting system', 45000.00, '2022-08-15', 28.2, 18, 'active'),
    ('IoT & ML Systems', 'Sensor Network', 'Complete sensor network and ML platform integration', 25000.00, '2022-09-01', 35.8, 15, 'active'),
    ('Irrigation & Fertigation', 'Precision Delivery', 'Automated irrigation and nutrient delivery system', 20000.00, '2022-07-15', 22.1, 24, 'active'),
    ('Growing System', 'Substrate & Support', 'Cocopeat system, gutters, and plant support', 15000.00, '2022-07-01', 18.5, 30, 'active'),
    ('Seeds & Initial Supplies', 'Premium Genetics', 'Xandor XR seeds, Maxifort rootstock, initial nutrients', 10000.00, '2022-09-12', 45.2, 12, 'active')
) AS i(category, subcategory, description, amount, investment_date, expected_roi, expected_payback_months, status);

-- =====================================================
-- 6. FINANCIAL RECORDS (Monthly performance)
-- =====================================================

WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
)
INSERT INTO financial_records (
    greenhouse_id, 
    period_start, 
    period_end, 
    total_revenue, 
    revenue_per_m2,
    total_yield_kg,
    yield_per_m2,
    average_price_per_kg,
    quality_premium_percentage,
    operating_costs,
    total_operating_costs,
    net_profit,
    profit_margin,
    roi_percentage
)
SELECT 
    g.id,
    generate_series('2024-01-01'::date, '2024-06-01'::date, '1 month'::interval)::date,
    (generate_series('2024-01-01'::date, '2024-06-01'::date, '1 month'::interval) + '1 month'::interval - '1 day'::interval)::date,
    -- Revenue growing from 24,000 to 32,100 over 6 months
    24000 + (generate_series(0, 5) * 1350.0),
    -- Revenue per m² (total revenue / 80 m²)
    (24000 + (generate_series(0, 5) * 1350.0)) / 80.0,
    -- Yield growing from 550kg to 680kg per month
    550 + (generate_series(0, 5) * 21.7),
    -- Yield per m² (total yield / 80 m²)
    (550 + (generate_series(0, 5) * 21.7)) / 80.0,
    -- Average price per kg (€4.15-4.28)
    4.15 + (generate_series(0, 5) * 0.026),
    -- Quality premium
    12.0,
    -- Operating costs breakdown (JSON)
    '{"energy": 8500, "labor": 7200, "materials": 6800, "water": 1200, "maintenance": 4800}',
    -- Total operating costs
    28500.0,
    -- Net profit (revenue - costs)
    (24000 + (generate_series(0, 5) * 1350.0)) - 28500,
    -- Profit margin
    ((24000 + (generate_series(0, 5) * 1350.0)) - 28500) / (24000 + (generate_series(0, 5) * 1350.0)) * 100,
    -- ROI percentage (growing)
    18.5 + (generate_series(0, 5) * 0.72)
FROM greenhouse g;

-- =====================================================
-- 7. EFFICIENCY METRICS
-- =====================================================

WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
)
INSERT INTO efficiency_metrics (
    greenhouse_id,
    date,
    water_usage_l_per_m2_per_day,
    energy_consumption_kwh_per_m2,
    co2_usage_kg_per_m2,
    substrate_utilization_percentage,
    water_efficiency_score,
    energy_efficiency_score,
    co2_efficiency_score,
    overall_efficiency_score,
    potential_water_savings_eur,
    potential_energy_savings_eur,
    potential_co2_savings_eur
)
SELECT 
    g.id,
    generate_series('2024-01-01'::date, CURRENT_DATE, '1 day'::interval)::date,
    -- Water usage improving over time
    1.9 - (random() * 0.3), -- 1.6-1.9 l/m²/day
    -- Energy consumption
    125 + (random() * 20), -- 125-145 kWh/m²/month
    -- CO2 usage
    0.85 + (random() * 0.1), -- kg/m²/month
    -- Substrate utilization
    95.0, -- Nearly perfect
    -- Efficiency scores
    85 + (random() * 10), -- Water efficiency
    87 + (random() * 8),  -- Energy efficiency  
    92 + (random() * 5),  -- CO2 efficiency
    88 + (random() * 7),  -- Overall efficiency
    -- Potential savings
    320.0, -- Water savings potential
    890.0, -- Energy savings potential
    280.0  -- CO2 savings potential
FROM greenhouse g;

-- =====================================================
-- 8. ML PREDICTIONS & RECOMMENDATIONS
-- =====================================================

WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
)
INSERT INTO ml_predictions (
    greenhouse_id,
    timestamp,
    model_version,
    prediction_type,
    input_data,
    predictions,
    confidence_scores,
    expected_yield,
    disease_risk_percentage,
    growth_rate_percentage,
    optimal_harvest_date,
    water_stress_level
)
SELECT 
    g.id,
    CURRENT_TIMESTAMP - (random() * INTERVAL '24 hours'),
    'horti_ml_v2.1',
    'comprehensive_forecast',
    '{"temperature": 21.2, "humidity": 15.8, "co2": 985, "par_light": 285, "sap_flow": 47.3, "head_thickness": 9.8}',
    '{"yield_forecast": 85.2, "disease_probability": 0.15, "growth_acceleration": 12.5, "water_optimization": 8.2}',
    '{"yield_confidence": 92, "disease_confidence": 88, "growth_confidence": 95, "water_confidence": 90}',
    85.2, -- kg/m² expected yield
    15.0, -- 15% disease risk
    12.5, -- 12.5% above normal growth rate
    '2024-02-15'::date, -- Optimal harvest date
    8.0   -- Minimal water stress
FROM greenhouse g;

-- Sample recommendations
WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
prediction AS (
    SELECT id FROM ml_predictions ORDER BY timestamp DESC LIMIT 1
)
INSERT INTO recommendations (
    greenhouse_id,
    prediction_id,
    category,
    priority,
    action_title,
    action_description,
    reasoning,
    expected_impact,
    is_active,
    expires_at
)
SELECT g.id, p.id, * FROM greenhouse g, prediction p, (VALUES
    ('irrigation', 'medium', 'Optimize Morning Irrigation', 'Increase morning irrigation by 10% between 6-8 AM', 'Sap flow analysis shows optimal water uptake during early morning hours', '+3% yield improvement', TRUE, CURRENT_TIMESTAMP + INTERVAL '7 days'),
    ('climate', 'high', 'Adjust CO2 Levels', 'Reduce CO2 to 950 ppm during peak light hours', 'Current CO2 levels are above optimal for current light conditions', '+2% photosynthesis efficiency', TRUE, CURRENT_TIMESTAMP + INTERVAL '3 days'),
    ('harvest', 'low', 'Harvest Planning', 'Plan harvest for February 15th based on growth predictions', 'ML model predicts optimal harvest date with 92% confidence', 'Maximize market price timing', TRUE, CURRENT_TIMESTAMP + INTERVAL '30 days')
) AS r(category, priority, action_title, action_description, reasoning, expected_impact, is_active, expires_at);

-- =====================================================
-- 9. MARKET DATA
-- =====================================================

INSERT INTO market_data (
    date,
    region,
    crop_type,
    average_price_per_kg,
    price_change_percentage,
    demand_index,
    supply_index,
    quality_premium,
    projected_price_change,
    seasonal_factor
)
SELECT 
    generate_series('2024-01-01'::date, CURRENT_DATE, '1 day'::interval)::date,
    'Netherlands',
    'Tomato',
    4.18 + (random() - 0.5) * 0.2, -- Price variation around €4.18/kg
    (random() - 0.5) * 5, -- ±2.5% daily price change
    110 + (random() * 20), -- Demand index (100 = baseline)
    95 + (random() * 10),  -- Supply index 
    12.0 + (random() * 3), -- Quality premium 12-15%
    8.2, -- Projected annual increase
    -- Seasonal factor (higher in winter)
    CASE 
        WHEN EXTRACT(MONTH FROM generate_series('2024-01-01'::date, CURRENT_DATE, '1 day'::interval)) IN (12, 1, 2) THEN 115
        WHEN EXTRACT(MONTH FROM generate_series('2024-01-01'::date, CURRENT_DATE, '1 day'::interval)) IN (6, 7, 8) THEN 85
        ELSE 100
    END;

-- =====================================================
-- 10. SYSTEM ALERTS
-- =====================================================

WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
sensor AS (
    SELECT id FROM sensors WHERE sensor_id = 'IRRIGATION_002' -- EC sensor in maintenance
)
INSERT INTO alerts (
    greenhouse_id,
    alert_type,
    severity,
    title,
    message,
    source,
    related_sensor_id,
    is_acknowledged,
    is_resolved
)
SELECT g.id, * FROM greenhouse g, sensor s, (VALUES
    ('sensor_maintenance', 'warning', 'EC Sensor Maintenance Required', 'Electrical conductivity sensor requires calibration', 'Irrigation System', s.id, FALSE, FALSE),
    ('threshold_exceeded', 'info', 'High Yield Performance', 'Current yield projection exceeds target by 15.2%', 'ML Prediction System', NULL, TRUE, TRUE),
    ('efficiency_opportunity', 'info', 'Water Optimization Available', 'Potential water savings of €320/month identified', 'Efficiency Analysis', NULL, FALSE, FALSE)
) AS a(alert_type, severity, title, message, source, related_sensor_id, is_acknowledged, is_resolved);

-- =====================================================
-- 11. RECENT CAMERA DATA (Sample)
-- =====================================================

WITH greenhouse AS (
    SELECT id FROM greenhouses WHERE name = 'World Horti Center Lab Greenhouse'
),
camera AS (
    SELECT id FROM sensors WHERE sensor_id = 'CAMERA_001'
)
INSERT INTO camera_data (
    greenhouse_id,
    sensor_id,
    timestamp,
    image_path,
    image_type,
    resolution,
    head_thickness_mm,
    plant_health_analysis,
    metadata,
    is_shareable
)
SELECT 
    g.id,
    c.id,
    CURRENT_TIMESTAMP - (generate_series(0, 10) * INTERVAL '150 seconds'),
    '/storage/images/plant_' || generate_series(0, 10) || '_' || to_char(CURRENT_TIMESTAMP, 'YYYYMMDD_HH24MISS') || '.jpg',
    'rgbd',
    '640x480',
    9.5 + (random() * 1.0), -- Head thickness measurements
    '{"health_score": ' || (90 + random() * 10)::INTEGER || ', "pest_detected": false, "disease_indicators": []}',
    '{"camera_angle": "45_degrees", "lighting_conditions": "LED", "plant_position": "center"}',
    TRUE
FROM greenhouse g, camera c;

-- =====================================================
-- ANALYSIS QUERIES FOR VERIFICATION
-- =====================================================

-- Verify data counts
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'greenhouses', COUNT(*) FROM greenhouses  
UNION ALL
SELECT 'sensors', COUNT(*) FROM sensors
UNION ALL  
SELECT 'climate_data', COUNT(*) FROM climate_data
UNION ALL
SELECT 'growth_data', COUNT(*) FROM growth_data
UNION ALL
SELECT 'sap_flow_data', COUNT(*) FROM sap_flow_data
UNION ALL
SELECT 'irrigation_data', COUNT(*) FROM irrigation_data
UNION ALL
SELECT 'camera_data', COUNT(*) FROM camera_data
UNION ALL
SELECT 'investments', COUNT(*) FROM investments
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records
UNION ALL
SELECT 'efficiency_metrics', COUNT(*) FROM efficiency_metrics
UNION ALL
SELECT 'ml_predictions', COUNT(*) FROM ml_predictions
UNION ALL
SELECT 'recommendations', COUNT(*) FROM recommendations
UNION ALL
SELECT 'market_data', COUNT(*) FROM market_data
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts;

-- Show latest readings
SELECT 'Latest Climate Reading' as info, timestamp, temperature, co2_concentration, par_light 
FROM climate_data 
ORDER BY timestamp DESC LIMIT 1;

SELECT 'Latest Financial Performance' as info, period_start, total_revenue, net_profit, profit_margin 
FROM financial_records 
ORDER BY period_start DESC LIMIT 1;

SELECT 'Active Recommendations' as info, COUNT(*) as count 
FROM recommendations 
WHERE is_active = TRUE;