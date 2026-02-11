# 🍅 Tomato Detection AI Service

## Overview
This AI service provides real-time tomato detection using state-of-the-art YOLO models trained on greenhouse tomato images.

## Available Models

| Model | Accuracy | Speed | Best For |
|-------|----------|-------|----------|
| **YOLOv8n** | 89.4% mAP50 | ~7ms | Real-time detection, best overall |
| **YOLOv8s** | 88.9% mAP50 | ~13ms | Higher accuracy, still fast |
| **YOLOv9t** | 82.6% mAP50 | ~14ms | Compact model |
| **YOLOv10n** | 75.5% mAP50 | ~12ms | Experimental features |
| **YOLOv11n** | 78.0% mAP50 | ~14ms | Latest architecture |

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Start the Service

```bash
# Development mode with auto-reload
uvicorn app:app --reload --port 8000

# Or simply
python app.py
```

### 3. Test the Service

Visit http://localhost:8000/docs for interactive API documentation.

## Testing Models

### Test All Models
```bash
python test_detection.py
```

### Test Single Image
```bash
python test_detection.py path/to/image.jpg
```

### Test via cURL
```bash
# Upload and detect
curl -X POST "http://localhost:8000/detect" \
  -F "file=@test_images/sample1.jpg" \
  -F "model=yolov8n" \
  -F "confidence_threshold=0.4"
```

## API Endpoints

### Detection Endpoints

- `POST /detect` - Detect tomatoes in a single image
- `POST /batch-process` - Process multiple images
- `POST /analyze-growth` - Analyze growth trends
- `GET /results/{id}` - Get detection results
- `DELETE /results/{id}` - Delete detection results

### Model Management

- `GET /` - Health check
- `GET /models` - List available models

## Directory Structure

```
ai-service/
├── app.py              # Main FastAPI application
├── requirements.txt    # Python dependencies
├── models/            # YOLO model files (.pt)
│   ├── yolov8n_tomato.pt
│   ├── yolov8s_tomato.pt
│   ├── yolov9t_tomato.pt
│   ├── yolov10n_tomato.pt
│   └── yolov11n_tomato.pt
├── uploads/           # Uploaded images
├── results/           # Detection results
├── test_images/       # Sample test images
└── test_results/      # Test output images
```

## Docker Deployment

### Build Image
```bash
docker build -t horti-ai-service .
```

### Run Container
```bash
docker run -d \
  -p 8000:8000 \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/results:/app/results \
  --name ai-service \
  horti-ai-service
```

### Using Docker Compose
```bash
# From project root
docker-compose up ai-service
```

## Configuration

### Environment Variables

- `MODEL_PATH`: Path to model files (default: `/app/models`)
- `UPLOAD_DIR`: Upload directory (default: `/app/uploads`)
- `RESULTS_DIR`: Results directory (default: `/app/results`)

### Detection Parameters

- **Confidence Threshold**: 0.1 - 0.9 (default: 0.4)
  - Lower = more detections but more false positives
  - Higher = fewer but more confident detections

- **Model Selection**:
  - `yolov8n`: Best for real-time applications
  - `yolov8s`: Best for accuracy
  - Others: For comparison/testing

## Performance Tips

1. **Image Size**: Resize large images to max 1920x1080 before upload
2. **Batch Processing**: Use `/batch-process` for multiple images
3. **Model Selection**: Use YOLOv8n for speed, YOLOv8s for accuracy
4. **Caching**: Results are cached for 15 minutes

## Troubleshooting

### No Detections
- Lower confidence threshold (try 0.3 or 0.2)
- Check image quality and lighting
- Ensure tomatoes are clearly visible

### Slow Performance
- Use YOLOv8n model
- Reduce image size
- Check CPU/GPU utilization

### Model Loading Errors
- Verify .pt files exist in models/
- Check file permissions
- Ensure ultralytics is installed

## Sample Code

### Python Client
```python
import requests

# Upload and detect
with open('tomato.jpg', 'rb') as f:
    files = {'file': f}
    data = {'model': 'yolov8n', 'confidence_threshold': 0.4}
    response = requests.post('http://localhost:8000/detect', files=files, data=data)
    result = response.json()
    print(f"Detected {result['total_tomatoes']} tomatoes")
```

### JavaScript/React
```javascript
const formData = new FormData();
formData.append('file', imageFile);
formData.append('model', 'yolov8n');

fetch('http://localhost:8000/detect', {
  method: 'POST',
  body: formData
})
.then(res => res.json())
.then(result => {
  console.log(`Detected ${result.total_tomatoes} tomatoes`);
});
```

## Model Training

The models were trained on a custom dataset of greenhouse tomato images using:
- Training images: 300+
- Validation images: 120
- Test images: 60
- Classes: 1 (tomato head)

## License

Part of the Horti-IoT Platform