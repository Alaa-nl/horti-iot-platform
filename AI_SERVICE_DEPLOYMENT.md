# AI Service Deployment Guide for Horti-IoT Platform

## Overview
This guide explains how to deploy and integrate the YOLO-based tomato detection AI service into your Horti-IoT platform.

## Architecture
The AI integration consists of three main components:

1. **Python AI Microservice** (FastAPI) - Handles image processing and tomato detection
2. **Backend API Integration** (Node.js) - Bridges the AI service with the main platform
3. **Frontend Components** (React) - User interface for uploading images and viewing results

## Prerequisites
- Docker and Docker Compose installed
- Python 3.11+ (for local development)
- Node.js 18+ (for backend)
- PostgreSQL database running
- At least 4GB RAM for AI processing

## Setup Instructions

### Step 1: Prepare Your YOLO Models

1. Copy your trained YOLO models from `/Users/alaadrobe/Downloads/Codes` to the AI service directory:

```bash
# Create models directory
mkdir -p ai-service/models

# Copy your trained models (example paths - adjust as needed)
cp /path/to/your/best.pt ai-service/models/yolov8n_tomato.pt
cp /path/to/your/yolov8s_best.pt ai-service/models/yolov8s_tomato.pt
```

### Step 2: Set Up the AI Service

#### Option A: Using Docker (Recommended for Production)

```bash
# Start all services including AI
docker-compose up -d

# Or start only the AI service
docker-compose up -d ai-service
```

#### Option B: Local Development

```bash
# Navigate to AI service directory
cd ai-service

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app:app --reload --port 8000
```

### Step 3: Configure Backend Integration

1. Add environment variable to backend `.env`:
```env
AI_SERVICE_URL=http://localhost:8000
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Run database migration for AI tables:
```bash
psql -U horti_user -d horti_iot -f database/migrations/008_create_ai_detections.sql
```

### Step 4: Frontend Integration

The AI detection component is already created at `src/components/ai/TomatoDetection.tsx`

To add it to your dashboard:

```typescript
// In ResearcherDashboard.tsx or any page
import TomatoDetection from '../components/ai/TomatoDetection';

// In your component
<TomatoDetection
  greenhouseId={selectedGreenhouse?.id}
  onDetectionComplete={(result) => {
    console.log('Detection completed:', result);
  }}
/>
```

### Step 5: Test the Integration

1. **Test AI Service Health:**
```bash
curl http://localhost:8000/
```

2. **Test Detection via API:**
```bash
# Get auth token first
TOKEN="your-jwt-token"

# Upload and detect
curl -X POST http://localhost:3001/api/ai/detect \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/path/to/tomato-image.jpg" \
  -F "model=yolov8n" \
  -F "confidence_threshold=0.4"
```

3. **Test via UI:**
- Login to the platform
- Navigate to Researcher Dashboard
- Find the AI Tomato Detection card
- Upload an image and click "Detect Tomatoes"

## API Endpoints

### AI Service (Python - Port 8000)
- `GET /` - Health check
- `GET /models` - List available models
- `POST /detect` - Detect tomatoes in single image
- `POST /batch-process` - Process multiple images
- `POST /analyze-growth` - Analyze growth trends
- `GET /results/{id}` - Get detection results
- `DELETE /results/{id}` - Delete results

### Backend Integration (Node.js - Port 3001)
- `GET /api/ai/health` - Check AI service status
- `GET /api/ai/models` - Get available models
- `POST /api/ai/detect` - Upload and detect (with auth)
- `POST /api/ai/batch-detect` - Batch processing
- `POST /api/ai/analyze-growth` - Growth analysis
- `GET /api/ai/results/:id` - Get results
- `DELETE /api/ai/results/:id` - Delete results

## Features

### Tomato Detection
- Upload greenhouse images
- Detect tomato heads using YOLO models
- Get bounding boxes with confidence scores
- Calculate total count and size distribution

### Model Selection
- **YOLOv8n**: Fastest (7ms), 89.4% accuracy
- **YOLOv8s**: Balanced (13ms), 88.9% accuracy
- **YOLOv11n**: Latest architecture, 78% accuracy

### Growth Analysis
- Track tomato count over time
- Analyze size distribution (small/medium/large)
- Calculate growth rates
- Generate health scores
- Provide recommendations

## Customization

### Adding New Models

1. Train your YOLO model on tomato dataset
2. Save the `.pt` file to `ai-service/models/`
3. Update `MODEL_CONFIGS` in `ai-service/app.py`:

```python
MODEL_CONFIGS = {
    "your_model": {
        "path": "models/your_model.pt",
        "description": "Your model description",
        "speed": "fast/medium/slow",
        "accuracy": 0.95
    }
}
```

### Adjusting Detection Parameters

Edit in `ai-service/app.py`:
```python
# Confidence threshold
conf=0.4  # Adjust between 0.1-0.9

# Size categories (in pixels²)
size_distribution = {
    "small": len([s for s in all_sizes if s < 1000]),
    "medium": len([s for s in all_sizes if 1000 <= s < 3000]),
    "large": len([s for s in all_sizes if s >= 3000])
}
```

## Monitoring and Maintenance

### Check Service Logs
```bash
# AI Service logs
docker logs horti-iot-ai -f

# Backend logs
docker logs horti-iot-backend -f
```

### Database Queries
```sql
-- View recent detections
SELECT * FROM ai_detections
ORDER BY created_at DESC
LIMIT 10;

-- Get detection statistics
SELECT * FROM ai_detection_stats
WHERE greenhouse_id = 'your-greenhouse-id';

-- Check batch job status
SELECT * FROM ai_batch_jobs
WHERE status = 'processing';
```

### Performance Optimization

1. **Model Selection**: Use YOLOv8n for real-time, YOLOv8s for accuracy
2. **Batch Processing**: Process multiple images together for efficiency
3. **Caching**: Results are cached for 15 minutes
4. **Image Size**: Resize large images before upload (max 1920x1080 recommended)

## Troubleshooting

### AI Service Not Responding
```bash
# Check if service is running
docker ps | grep ai-service

# Restart service
docker-compose restart ai-service

# Check logs for errors
docker logs horti-iot-ai --tail 100
```

### Detection Not Working
1. Check model files exist in `ai-service/models/`
2. Verify image format (JPG/PNG only)
3. Check confidence threshold (lower if no detections)
4. Ensure adequate lighting in images

### Database Connection Issues
```bash
# Check database is running
docker ps | grep postgres

# Test connection
psql -U horti_user -d horti_iot -c "SELECT 1"
```

### Memory Issues
If experiencing OOM errors:
1. Reduce batch size
2. Use smaller models (YOLOv8n)
3. Increase Docker memory limit

## Security Considerations

1. **File Upload Limits**: Max 10MB per image
2. **Authentication**: All endpoints require JWT token
3. **Rate Limiting**: Implemented on backend
4. **Input Validation**: File type and size checks
5. **Sandboxing**: AI service runs in isolated container

## Future Enhancements

1. **Real-time Detection**: Integration with camera feeds
2. **Disease Detection**: Expand models to detect plant diseases
3. **Yield Prediction**: Use historical data for harvest forecasting
4. **Mobile App**: React Native component for field use
5. **Edge Deployment**: Run models on IoT devices
6. **Multi-crop Support**: Extend beyond tomatoes

## Support

For issues or questions:
1. Check logs in `ai-service/logs/`
2. Review error messages in browser console
3. Ensure all services are running
4. Verify database migrations completed

## License

This AI integration is part of the Horti-IoT platform and follows the same licensing terms.