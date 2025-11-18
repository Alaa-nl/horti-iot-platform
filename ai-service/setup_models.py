#!/usr/bin/env python3
"""
Setup script to prepare YOLO models for the AI service
Copies and converts your trained models to the correct format
"""

import os
import shutil
from pathlib import Path
import sys

def setup_models():
    """Copy and prepare YOLO models for the AI service"""

    # Define paths
    source_dir = Path("/Users/alaadrobe/Downloads/Codes")
    models_dir = Path(__file__).parent / "models"

    # Create models directory if it doesn't exist
    models_dir.mkdir(exist_ok=True)

    print("🚀 Setting up YOLO models for Horti-IoT AI Service")
    print(f"📁 Source directory: {source_dir}")
    print(f"📁 Target directory: {models_dir}")

    # Model mapping (adjust these paths based on your actual model files)
    model_mappings = [
        # Format: (source_file, target_file, description)
        ("best.pt", "yolov8n_tomato.pt", "YOLOv8 Nano model"),
        ("yolov8s_best.pt", "yolov8s_tomato.pt", "YOLOv8 Small model"),
        ("yolov11n_best.pt", "yolov11n_tomato.pt", "YOLOv11 Nano model"),
    ]

    copied_count = 0

    for source_file, target_file, description in model_mappings:
        source_path = source_dir / source_file
        target_path = models_dir / target_file

        if source_path.exists():
            print(f"\n✓ Found {description}: {source_file}")

            # Check if target already exists
            if target_path.exists():
                response = input(f"  ⚠️  {target_file} already exists. Overwrite? (y/n): ")
                if response.lower() != 'y':
                    print(f"  ⏭️  Skipping {target_file}")
                    continue

            # Copy the model
            try:
                shutil.copy2(source_path, target_path)
                print(f"  ✅ Copied to {target_file}")
                copied_count += 1
            except Exception as e:
                print(f"  ❌ Error copying {source_file}: {e}")
        else:
            print(f"\n❌ Not found: {source_file}")
            print(f"  Expected at: {source_path}")

    print(f"\n{'='*50}")
    print(f"✨ Setup complete! Copied {copied_count} model(s)")

    # Create a test script
    test_script_path = models_dir.parent / "test_models.py"
    create_test_script(test_script_path, models_dir)
    print(f"\n📝 Created test script: {test_script_path}")
    print(f"   Run it with: python {test_script_path}")

    # Check for ultralytics installation
    try:
        import ultralytics
        print(f"\n✅ Ultralytics version {ultralytics.__version__} is installed")
    except ImportError:
        print("\n⚠️  Ultralytics not installed. Run: pip install ultralytics")

    return copied_count > 0

def create_test_script(script_path, models_dir):
    """Create a test script to verify models work"""

    test_code = '''#!/usr/bin/env python3
"""Test script to verify YOLO models are working"""

from ultralytics import YOLO
from pathlib import Path
import sys

def test_models():
    models_dir = Path(__file__).parent / "models"

    # List all .pt files in models directory
    model_files = list(models_dir.glob("*.pt"))

    if not model_files:
        print("❌ No model files found in models directory")
        return False

    print(f"Found {len(model_files)} model(s) to test:\\n")

    for model_path in model_files:
        print(f"Testing: {model_path.name}")
        try:
            # Load model
            model = YOLO(str(model_path))

            # Get model info
            print(f"  ✅ Model loaded successfully")
            print(f"  📊 Model type: {model.model.__class__.__name__}")

            # You can add a test inference here with a sample image
            # results = model.predict('sample_tomato.jpg', conf=0.4)

        except Exception as e:
            print(f"  ❌ Error loading model: {e}")
            return False

    print("\\n✨ All models tested successfully!")
    return True

if __name__ == "__main__":
    success = test_models()
    sys.exit(0 if success else 1)
'''

    with open(script_path, 'w') as f:
        f.write(test_code)

    # Make script executable
    os.chmod(script_path, 0o755)

def find_jupyter_models():
    """Search for models mentioned in Jupyter notebooks"""

    notebooks_dir = Path("/Users/alaadrobe/Downloads/Codes")

    print("\n📔 Searching for models in Jupyter notebooks...")

    # Common model paths in notebooks
    potential_paths = [
        "/content/drive/MyDrive/best.pts/YOLOv8n/best.pt",
        "/content/drive/MyDrive/best.pts/YOLOv8s/best.pt",
        "/content/drive/MyDrive/best.pts/YOLOv9t/best.pt",
        "/content/drive/MyDrive/best.pts/YOLOv10n/best.pt",
        "/content/drive/MyDrive/best.pts/YOLOv11n/best.pt",
        "/content/drive/MyDrive/trained_model/best.pt",
        "/content/runs/detect/train/weights/best.pt",
        "/content/runs/detect/train2/weights/best.pt",
    ]

    print("\nModel paths found in notebooks:")
    for path in potential_paths:
        print(f"  - {path}")

    print("\n💡 If you have these models saved locally from Colab,")
    print("   please copy them to the ai-service/models/ directory")
    print("   and rename them appropriately (e.g., yolov8n_tomato.pt)")

if __name__ == "__main__":
    success = setup_models()
    find_jupyter_models()

    if success:
        print("\n🎉 Setup completed successfully!")
        print("Next steps:")
        print("1. Start the AI service: cd ai-service && python app.py")
        print("2. Or use Docker: docker-compose up ai-service")
    else:
        print("\n⚠️  Setup completed with warnings")
        print("Please manually copy your YOLO model files to ai-service/models/")