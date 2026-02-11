#!/bin/bash

# Setup script for AI training data
# This script moves or links the greenhouse data to the ai-service directory

echo "=== Setting up AI Training Data ==="

DATA_SOURCE="/Users/alaadrobe/Downloads/data"
DATA_TARGET="/Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/data"

# Check if source data exists
if [ ! -d "$DATA_SOURCE" ]; then
    echo "❌ Source data not found at: $DATA_SOURCE"
    exit 1
fi

echo "📊 Data folder size: $(du -sh $DATA_SOURCE | cut -f1)"

# Option 1: Move the data (recommended)
echo ""
echo "Choose an option:"
echo "1) Move data to project (recommended)"
echo "2) Create symbolic link (keeps data in Downloads)"
echo "3) Copy data (uses double disk space)"
read -p "Enter choice [1-3]: " choice

case $choice in
    1)
        echo "Moving data to ai-service/data..."
        mv "$DATA_SOURCE" "$DATA_TARGET"
        echo "✅ Data moved to: $DATA_TARGET"
        ;;
    2)
        echo "Creating symbolic link..."
        ln -s "$DATA_SOURCE" "$DATA_TARGET"
        echo "✅ Symbolic link created: $DATA_TARGET -> $DATA_SOURCE"
        ;;
    3)
        echo "Copying data (this may take a while)..."
        cp -r "$DATA_SOURCE" "$DATA_TARGET"
        echo "✅ Data copied to: $DATA_TARGET"
        ;;
    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac

# Update .gitignore if needed
GITIGNORE="/Users/alaadrobe/Documents/GitHub/horti-iot-platform/.gitignore"
if ! grep -q "ai-service/data" "$GITIGNORE" 2>/dev/null; then
    echo "" >> "$GITIGNORE"
    echo "# AI Training Data (too large for version control)" >> "$GITIGNORE"
    echo "ai-service/data/" >> "$GITIGNORE"
    echo "ai-service/datasets/" >> "$GITIGNORE"
    echo "*.pt" >> "$GITIGNORE"
    echo "✅ Updated .gitignore to exclude data folder"
fi

# Create a data manifest file for documentation
cat > "$DATA_TARGET.json" << EOF
{
    "description": "Greenhouse tomato detection training data",
    "created": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "contents": {
        "training_version_2": {
            "train_images": 1259,
            "valid_images": 120,
            "test_images": 60,
            "label_format": "YOLO polygon segmentation"
        },
        "Total": {
            "images": 600,
            "description": "Time-series greenhouse monitoring (30-min intervals)"
        }
    },
    "size_mb": $(du -sm $DATA_TARGET | cut -f1),
    "usage": "Fine-tuning and baseline testing for tomato detection models"
}
EOF

echo "✅ Created data manifest: $DATA_TARGET.json"

# Update Python scripts to use new path
echo ""
echo "📝 Updating Python scripts to use new data path..."

# Update baseline_test.py
if [ -f "/Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/baseline_test.py" ]; then
    sed -i '' 's|DATA_DIR = Path("/Users/alaadrobe/Downloads/data")|DATA_DIR = Path("./data")|g' \
        /Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/baseline_test.py
    echo "✅ Updated baseline_test.py"
fi

# Update other test scripts
for script in quick_baseline_test.py api_baseline_test.py model_data_analysis.py; do
    if [ -f "/Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/$script" ]; then
        sed -i '' 's|DATA_DIR = Path("/Users/alaadrobe/Downloads/data")|DATA_DIR = Path("./data")|g' \
            "/Users/alaadrobe/Documents/GitHub/horti-iot-platform/ai-service/$script"
        echo "✅ Updated $script"
    fi
done

echo ""
echo "=== Setup Complete ==="
echo "Data location: $DATA_TARGET"
echo "All scripts have been updated to use the new path."
echo ""
echo "Next steps:"
echo "1. The data is now part of your project structure"
echo "2. It's excluded from Git (check .gitignore)"
echo "3. All test scripts will automatically use the new location"
echo "4. You can now run: cd ai-service && python3 model_data_analysis.py"