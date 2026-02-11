#!/bin/bash

# Script to add more test images from the Images folder

echo "🖼️ Adding raw greenhouse images to test suite..."

# Source and destination directories
SOURCE_DIR="/Users/alaadrobe/Downloads/Images"
DEST_DIR="/Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/test_images"
BATCH_DIR="/Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/batch_test_images"

# Create directories if they don't exist
mkdir -p "$DEST_DIR"
mkdir -p "$BATCH_DIR"

# Copy a selection of images for quick testing (10 images)
echo "📦 Copying sample images for quick testing..."
SAMPLE_IMAGES=(
    "050730_color_image.png"
    "070000_color_image.png"
    "083230_color_image.png"
    "100730_color_image.png"
    "113000_color_image.png"
    "123730_color_image.png"
    "143730_color_image.png"
    "154230_color_image.png"
    "162000_color_image.png"
    "170000_color_image.png"
)

for img in "${SAMPLE_IMAGES[@]}"; do
    if [ -f "$SOURCE_DIR/$img" ]; then
        cp "$SOURCE_DIR/$img" "$DEST_DIR/"
        echo "  ✓ Copied $img"
    fi
done

# Copy all images for batch testing
echo ""
echo "📦 Copying all images for batch testing..."
cp "$SOURCE_DIR"/*.png "$BATCH_DIR/"
TOTAL_COPIED=$(ls "$BATCH_DIR"/*.png | wc -l)
echo "  ✓ Copied $TOTAL_COPIED images to batch_test_images/"

# Count different image sets
OUTPUT_DIAMETER_COUNT=$(ls /Users/alaadrobe/Downloads/output_diameter/*.jpg 2>/dev/null | wc -l)
RAW_IMAGES_COUNT=$(ls "$SOURCE_DIR"/*.png 2>/dev/null | wc -l)

echo ""
echo "📊 Image Summary:"
echo "  • Raw greenhouse images (PNG): $RAW_IMAGES_COUNT"
echo "  • Processed images (JPG): $OUTPUT_DIAMETER_COUNT"
echo "  • Test images ready: $(ls $DEST_DIR/* 2>/dev/null | wc -l)"
echo "  • Batch test images: $TOTAL_COPIED"

echo ""
echo "✅ Images ready for testing!"
echo ""
echo "🎯 Next steps:"
echo "1. Test with single image:"
echo "   python test_detection.py test_images/050730_color_image.png"
echo ""
echo "2. Test all models on all images:"
echo "   python test_detection.py"
echo ""
echo "3. Run batch detection via API:"
echo "   python batch_test.py"