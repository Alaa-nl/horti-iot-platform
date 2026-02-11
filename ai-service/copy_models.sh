#!/bin/bash

# Script to copy YOLO models from Downloads to AI service

echo "🚀 Copying YOLO models to AI service..."

# Create models directory if it doesn't exist
mkdir -p /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models
mkdir -p /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/test_images

# Copy YOLO models
echo "📦 Copying YOLOv8n model..."
cp /Users/alaadrobe/Downloads/best.pts/YOLOv8n/best.pt \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models/yolov8n_tomato.pt

echo "📦 Copying YOLOv8s model..."
cp /Users/alaadrobe/Downloads/best.pts/YOLOv8s/best.pt \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models/yolov8s_tomato.pt

echo "📦 Copying YOLOv9t model..."
cp /Users/alaadrobe/Downloads/best.pts/YOLOv9t/best.pt \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models/yolov9t_tomato.pt

echo "📦 Copying YOLOv10n model..."
cp /Users/alaadrobe/Downloads/best.pts/YOLOv10n/best.pt \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models/yolov10n_tomato.pt

echo "📦 Copying YOLOv11n model..."
cp /Users/alaadrobe/Downloads/best.pts/YOLOv11n/best.pt \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models/yolov11n_tomato.pt

# Copy some sample test images
echo "🖼️ Copying sample test images..."
cp /Users/alaadrobe/Downloads/output_diameter/050730_color_image_png.jpg \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/test_images/sample1.jpg

cp /Users/alaadrobe/Downloads/output_diameter/070000_color_image_png.jpg \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/test_images/sample2.jpg

cp /Users/alaadrobe/Downloads/output_diameter/100730_color_image_png.jpg \
   /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/test_images/sample3.jpg

echo "✅ All models and test images copied successfully!"
echo ""
echo "📊 Model sizes:"
ls -lh /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/models/*.pt

echo ""
echo "🎯 Next steps:"
echo "1. Start the AI service: cd ai-service && python app.py"
echo "2. Or use Docker: docker-compose up ai-service"
echo "3. Test detection at: http://localhost:8000/docs"