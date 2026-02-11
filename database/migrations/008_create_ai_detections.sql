-- =====================================================
-- Migration: Create AI Detections Tables
-- Description: Store AI tomato detection results and analysis
-- Date: 2025-11-18
-- =====================================================

-- Create table for storing AI detection results
CREATE TABLE IF NOT EXISTS ai_detections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_id VARCHAR(255) UNIQUE NOT NULL,
    greenhouse_id UUID REFERENCES greenhouses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    model_used VARCHAR(50) NOT NULL,
    total_detections INTEGER NOT NULL DEFAULT 0,
    average_confidence DECIMAL(5,4) NOT NULL DEFAULT 0,
    detections_data JSONB NOT NULL, -- Store individual detection details
    image_dimensions JSONB, -- {width: x, height: y}
    processing_time_ms DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for performance
    INDEX idx_ai_detections_greenhouse (greenhouse_id),
    INDEX idx_ai_detections_user (user_id),
    INDEX idx_ai_detections_timestamp (timestamp DESC),
    INDEX idx_ai_detections_created_at (created_at DESC)
);

-- Create table for AI growth analysis results
CREATE TABLE IF NOT EXISTS ai_growth_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    greenhouse_id UUID REFERENCES greenhouses(id) ON DELETE CASCADE,
    analysis_date TIMESTAMP WITH TIME ZONE NOT NULL,
    total_heads_detected INTEGER NOT NULL DEFAULT 0,
    average_size DECIMAL(10,2),
    size_distribution JSONB, -- {small: x, medium: y, large: z}
    growth_rate DECIMAL(10,2),
    health_score DECIMAL(5,2) CHECK (health_score >= 0 AND health_score <= 100),
    recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_ai_growth_greenhouse (greenhouse_id),
    INDEX idx_ai_growth_date (analysis_date DESC)
);

-- Create table for AI model configurations
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) UNIQUE NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- 'yolov8', 'yolov9', etc.
    version VARCHAR(20),
    description TEXT,
    accuracy_score DECIMAL(5,4),
    speed_rating VARCHAR(20), -- 'fast', 'medium', 'slow'
    file_path VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create table for batch processing jobs
CREATE TABLE IF NOT EXISTS ai_batch_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    greenhouse_id UUID REFERENCES greenhouses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
    total_images INTEGER NOT NULL DEFAULT 0,
    processed_images INTEGER NOT NULL DEFAULT 0,
    successful_detections INTEGER NOT NULL DEFAULT 0,
    failed_detections INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_ai_batch_status (status),
    INDEX idx_ai_batch_user (user_id),
    INDEX idx_ai_batch_created (created_at DESC)
);

-- Create view for AI detection statistics
CREATE OR REPLACE VIEW ai_detection_stats AS
SELECT
    greenhouse_id,
    DATE(timestamp) as detection_date,
    COUNT(*) as detection_count,
    AVG(total_detections) as avg_tomatoes_per_image,
    AVG(average_confidence) as avg_confidence,
    AVG(processing_time_ms) as avg_processing_time,
    COUNT(DISTINCT user_id) as unique_users
FROM ai_detections
GROUP BY greenhouse_id, DATE(timestamp);

-- Create function to update growth analysis
CREATE OR REPLACE FUNCTION update_growth_analysis()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating growth analysis
CREATE TRIGGER update_growth_analysis_timestamp
    BEFORE UPDATE ON ai_growth_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_growth_analysis();

-- Insert default AI models
INSERT INTO ai_models (model_name, model_type, version, description, accuracy_score, speed_rating, file_path) VALUES
    ('yolov8n_tomato', 'yolov8', 'nano', 'YOLOv8 Nano - Fastest inference, suitable for real-time detection', 0.894, 'fast', 'models/yolov8n_tomato.pt'),
    ('yolov8s_tomato', 'yolov8', 'small', 'YOLOv8 Small - Balanced speed and accuracy', 0.889, 'medium', 'models/yolov8s_tomato.pt'),
    ('yolov11n_tomato', 'yolov11', 'nano', 'YOLOv11 Nano - Latest architecture with improved detection', 0.780, 'fast', 'models/yolov11n_tomato.pt')
ON CONFLICT (model_name) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ai_detections TO horti_user;
GRANT SELECT, INSERT, UPDATE ON ai_growth_analysis TO horti_user;
GRANT SELECT ON ai_models TO horti_user;
GRANT SELECT, INSERT, UPDATE ON ai_batch_jobs TO horti_user;
GRANT SELECT ON ai_detection_stats TO horti_user;