# 🍅 AI Tomato Detection - Testing Guide

## Overview
You now have a complete testing suite with:
- **5 YOLO Models** (v8n, v8s, v9t, v10n, v11n)
- **50 Raw Greenhouse Images** (PNG format with timestamps)
- **50 Processed Images** (JPG format with detected tomatoes)
- **Automated Testing Scripts**

## Available Test Data

### Image Sets

| Dataset | Format | Count | Location |
|---------|--------|-------|----------|
| Raw Greenhouse Images | PNG | 50 | `/Users/alaadrobe/Downloads/Images/` |
| Processed Detection Results | JPG | 50 | `/Users/alaadrobe/Downloads/output_diameter/` |
| Quick Test Images | Mixed | 5 | `ai-service/test_images/` |
| Batch Test Images | PNG | 50 | `ai-service/batch_test_images/` |

### Model Performance (from training)

| Model | mAP50 | mAP50-95 | Size | Speed |
|-------|-------|----------|------|-------|
| YOLOv8n | 89.4% | 39.7% | 5.9 MB | Fast (~7ms) |
| YOLOv8s | 88.9% | 39.2% | 21 MB | Medium (~13ms) |
| YOLOv9t | 82.6% | 31.5% | 4.4 MB | Fast (~14ms) |
| YOLOv10n | 75.5% | 30.9% | 5.5 MB | Fast (~12ms) |
| YOLOv11n | 78.0% | 34.4% | 5.2 MB | Fast (~14ms) |

## Quick Start Testing

### 1. Start the AI Service

```bash
cd ai-service
./start.sh
```

The service will be available at:
- API Docs: http://localhost:8000/docs
- Health: http://localhost:8000/

### 2. Test Single Image

```bash
# Test with Python script
python test_detection.py test_images/050730_color_image.png

# Or via cURL
curl -X POST "http://localhost:8000/detect" \
  -F "file=@test_images/050730_color_image.png" \
  -F "model=yolov8n" \
  -F "confidence_threshold=0.4"
```

### 3. Test All Models

```bash
# This will test all 5 models on all test images
python test_detection.py
```

### 4. Batch Testing (50 images)

```bash
# Test all models on all 50 greenhouse images
python batch_test.py
```

## Testing Scenarios

### Scenario 1: Quick Accuracy Check

Test best model (YOLOv8n) on sample images:

```bash
cd ai-service
python3 << EOF
from ultralytics import YOLO
model = YOLO('models/yolov8n_tomato.pt')
results = model('test_images/sample1.jpg', conf=0.4)
print(f"Detected {len(results[0].boxes)} tomatoes")
EOF
```

### Scenario 2: Model Comparison

Compare all models on the same image:

```bash
for model in yolov8n yolov8s yolov9t yolov10n yolov11n; do
  echo "Testing $model..."
  curl -s -X POST "http://localhost:8000/detect" \
    -F "file=@test_images/sample1.jpg" \
    -F "model=$model" | jq '.total_tomatoes'
done
```

### Scenario 3: Confidence Threshold Testing

Test different confidence levels:

```bash
for conf in 0.2 0.3 0.4 0.5 0.6 0.7; do
  echo "Confidence: $conf"
  curl -s -X POST "http://localhost:8000/detect" \
    -F "file=@test_images/sample1.jpg" \
    -F "model=yolov8n" \
    -F "confidence_threshold=$conf" | jq '.total_tomatoes'
done
```

### Scenario 4: Performance Testing

```python
# Save as performance_test.py
import time
import requests

models = ['yolov8n', 'yolov8s', 'yolov9t', 'yolov10n', 'yolov11n']

for model in models:
    times = []
    for _ in range(10):
        start = time.time()
        with open('test_images/sample1.jpg', 'rb') as f:
            response = requests.post(
                'http://localhost:8000/detect',
                files={'file': f},
                data={'model': model}
            )
        times.append((time.time() - start) * 1000)

    avg_time = sum(times) / len(times)
    print(f"{model}: {avg_time:.1f}ms average")
```

## API Testing Examples

### Using Python

```python
import requests

# Single image detection
with open('test_images/050730_color_image.png', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/detect',
        files={'file': f},
        data={'model': 'yolov8n', 'confidence_threshold': 0.4}
    )
    result = response.json()
    print(f"Detected {result['total_tomatoes']} tomatoes")
    print(f"Average confidence: {result['average_confidence']:.2%}")
```

### Using JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const form = new FormData();
form.append('file', fs.createReadStream('test_images/sample1.jpg'));
form.append('model', 'yolov8n');
form.append('confidence_threshold', '0.4');

axios.post('http://localhost:8000/detect', form, {
    headers: form.getHeaders()
})
.then(response => {
    console.log(`Detected ${response.data.total_tomatoes} tomatoes`);
})
.catch(error => console.error(error));
```

## Analyzing Results

### View Detection Results

After running tests, check the results:

```bash
# View annotated images
ls ai-service/test_results/

# View JSON reports
cat ai-service/test_results/test_report_*.json | jq '.'

# View batch test results
cat ai-service/batch_test_results_*.json | jq '.'
```

### Understanding Metrics

- **Total Detections**: Number of tomato heads found
- **Average Confidence**: Mean confidence score (0-1)
- **Processing Time**: Time taken for detection (ms)
- **mAP50**: Mean Average Precision at 50% IoU threshold
- **Size Distribution**: Classification of detected tomatoes by size

## Troubleshooting

### No Detections Found

1. **Lower confidence threshold**:
   ```bash
   # Try 0.3 or even 0.2
   confidence_threshold=0.3
   ```

2. **Check image quality**:
   - Ensure good lighting
   - Clear tomato visibility
   - Proper focus

3. **Try different model**:
   ```bash
   # YOLOv8n usually works best
   model=yolov8n
   ```

### Slow Performance

1. **Use faster model**: YOLOv8n or YOLOv9t
2. **Reduce image size**: Resize to max 1280px
3. **Enable GPU**: Install CUDA if available

### API Connection Error

1. **Check service status**:
   ```bash
   curl http://localhost:8000/
   ```

2. **Restart service**:
   ```bash
   cd ai-service
   ./start.sh
   ```

## Expected Results

Based on your trained models, you should expect:

| Image Type | Expected Detections | Confidence Range |
|------------|-------------------|------------------|
| Clear daylight | 1-3 tomatoes | 0.7-0.95 |
| Morning/Evening | 1-2 tomatoes | 0.5-0.8 |
| Dense foliage | 0-2 tomatoes | 0.4-0.7 |

## Integration Testing

### Test with Frontend Component

1. Start backend:
   ```bash
   cd backend
   npm start
   ```

2. Start frontend:
   ```bash
   cd ..
   npm start
   ```

3. Navigate to dashboard and use the AI Detection component

### Test via Backend API

```bash
# Requires authentication token
TOKEN="your-jwt-token"

curl -X POST "http://localhost:3001/api/ai/detect" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test_images/sample1.jpg" \
  -F "model=yolov8n" \
  -F "confidence_threshold=0.4"
```

## Performance Benchmarks

Expected performance on your test images:

| Metric | YOLOv8n | YOLOv8s | YOLOv9t | YOLOv10n | YOLOv11n |
|--------|---------|---------|---------|----------|----------|
| Avg Detections/Image | 1.5 | 1.4 | 1.2 | 1.0 | 1.1 |
| Processing Time | 7-10ms | 12-15ms | 12-15ms | 10-13ms | 12-15ms |
| Memory Usage | ~200MB | ~400MB | ~180MB | ~220MB | ~210MB |

## Next Steps

1. **Fine-tune confidence**: Find optimal threshold for your greenhouse
2. **Schedule batch processing**: Process images at regular intervals
3. **Implement alerts**: Notify when growth anomalies detected
4. **Export data**: Use results for growth analysis
5. **Train custom models**: Improve accuracy with more labeled data

## Support

- Check `ai-service/README.md` for API documentation
- View logs: `tail -f ai-service/logs/*.log`
- Test images location: `ai-service/test_images/`
- Model files: `ai-service/models/`