"""
Quick Baseline Test for Horti-IoT AI Models
A simplified version that tests models on sample images from the greenhouse data
"""

import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

# Try to import required libraries
try:
    from ultralytics import YOLO
    import cv2
    import numpy as np
    FULL_FEATURES = True
except ImportError as e:
    print(f"Warning: Some features unavailable - {e}")
    FULL_FEATURES = False

# Configuration
DATA_DIR = Path("/Users/alaadrobe/Downloads/data")
MODELS_DIR = Path("./models")
RESULTS_DIR = Path("./baseline_results")
RESULTS_DIR.mkdir(exist_ok=True)

# Model configurations
MODEL_CONFIGS = {
    "yolov8n": "models/yolov8n_tomato.pt",
    "yolov8s": "models/yolov8s_tomato.pt",
    "yolov9t": "models/yolov9t_tomato.pt",
    "yolov10n": "models/yolov10n_tomato.pt",
    "yolov11n": "models/yolov11n_tomato.pt"
}

def quick_test_models():
    """Quick test of all models on sample images"""
    print("\n" + "="*60)
    print("QUICK BASELINE TEST - HORTI-IOT AI MODELS")
    print("="*60)

    results = {}
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Check for test images
    test_images = []

    # Try test set first
    test_dir = DATA_DIR / "training_version_2" / "test" / "images"
    if test_dir.exists():
        test_images.extend(list(test_dir.glob("*.jpg"))[:5])
        print(f"✓ Found test images in training_version_2")

    # Add some time-series images
    total_dir = DATA_DIR / "Total"
    if total_dir.exists():
        total_images = sorted(list(total_dir.glob("*.png")))
        # Sample evenly across the dataset
        if len(total_images) > 0:
            step = len(total_images) // 5
            test_images.extend(total_images[::step][:5])
            print(f"✓ Found {len(total_images)} time-series images in Total folder")

    if not test_images:
        print("✗ No test images found!")
        return

    print(f"\n📊 Testing on {len(test_images)} sample images\n")

    # Test each model
    for model_name, model_path in MODEL_CONFIGS.items():
        print(f"\n--- Testing {model_name} ---")

        if not os.path.exists(model_path):
            print(f"  ✗ Model file not found: {model_path}")
            results[model_name] = {"status": "not_found"}
            continue

        if not FULL_FEATURES:
            print(f"  ⚠ Skipping (ultralytics not installed)")
            results[model_name] = {"status": "skipped"}
            continue

        try:
            # Load model
            model = YOLO(model_path)
            print(f"  ✓ Model loaded successfully")

            # Test on sample images
            model_results = {
                "status": "success",
                "detections": [],
                "inference_times": [],
                "total_tomatoes": 0,
                "confidences": []
            }

            for img_path in test_images[:3]:  # Test on first 3 images for speed
                print(f"  • Testing on: {img_path.name}")

                # Run inference
                start_time = time.time()
                result = model(str(img_path), verbose=False)
                inference_time = (time.time() - start_time) * 1000

                model_results["inference_times"].append(inference_time)

                # Count detections
                if len(result) > 0 and result[0].boxes is not None:
                    num_detections = len(result[0].boxes)
                    model_results["total_tomatoes"] += num_detections

                    # Get confidences
                    for box in result[0].boxes:
                        conf = float(box.conf[0])
                        model_results["confidences"].append(conf)

                    model_results["detections"].append({
                        "image": img_path.name,
                        "count": num_detections,
                        "time_ms": inference_time
                    })

                    print(f"    → Found {num_detections} tomatoes in {inference_time:.1f}ms")
                else:
                    model_results["detections"].append({
                        "image": img_path.name,
                        "count": 0,
                        "time_ms": inference_time
                    })
                    print(f"    → No tomatoes detected in {inference_time:.1f}ms")

            # Calculate summary statistics
            if model_results["inference_times"]:
                model_results["avg_inference_time_ms"] = np.mean(model_results["inference_times"])
                model_results["avg_detections"] = model_results["total_tomatoes"] / len(test_images[:3])

                if model_results["confidences"]:
                    model_results["avg_confidence"] = np.mean(model_results["confidences"])
                    model_results["min_confidence"] = np.min(model_results["confidences"])
                    model_results["max_confidence"] = np.max(model_results["confidences"])

            results[model_name] = model_results

            print(f"  📈 Summary:")
            print(f"     Average inference time: {model_results.get('avg_inference_time_ms', 0):.1f}ms")
            print(f"     Average detections: {model_results.get('avg_detections', 0):.1f}")
            if model_results.get('avg_confidence'):
                print(f"     Average confidence: {model_results['avg_confidence']:.3f}")

        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            results[model_name] = {"status": "error", "error": str(e)}

    # Save results
    output_file = RESULTS_DIR / f"quick_test_{timestamp}.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)

    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)

    # Find best performing model
    successful_models = {k: v for k, v in results.items()
                        if v.get("status") == "success" and v.get("avg_detections", 0) > 0}

    if successful_models:
        # Rank by detection count (could also rank by speed or confidence)
        ranked_models = sorted(successful_models.items(),
                             key=lambda x: x[1].get("avg_detections", 0),
                             reverse=True)

        print("\n📊 Model Rankings (by detection count):")
        for i, (model_name, model_data) in enumerate(ranked_models, 1):
            print(f"{i}. {model_name}:")
            print(f"   • Avg Detections: {model_data.get('avg_detections', 0):.1f}")
            print(f"   • Avg Inference: {model_data.get('avg_inference_time_ms', 0):.1f}ms")
            if model_data.get('avg_confidence'):
                print(f"   • Avg Confidence: {model_data['avg_confidence']:.3f}")

        best_model = ranked_models[0][0]
        print(f"\n🏆 Recommended Model: {best_model}")

    print(f"\n✅ Results saved to: {output_file}")
    print("\nFor full evaluation, run: python baseline_test.py")

def test_single_image(image_path: str, model_name: str = "yolov8n"):
    """Test a single image with specified model"""
    print(f"\nTesting {image_path} with {model_name}...")

    model_path = MODEL_CONFIGS.get(model_name)
    if not model_path or not os.path.exists(model_path):
        print(f"Model {model_name} not found")
        return

    if not FULL_FEATURES:
        print("ultralytics library not installed")
        return

    try:
        model = YOLO(model_path)
        results = model(image_path, verbose=False)

        if len(results) > 0 and results[0].boxes is not None:
            print(f"Found {len(results[0].boxes)} tomatoes")
            for i, box in enumerate(results[0].boxes, 1):
                conf = float(box.conf[0])
                print(f"  Tomato {i}: confidence = {conf:.3f}")

            # Save annotated image
            annotated = results[0].plot()
            output_path = Path("annotated_result.jpg")
            cv2.imwrite(str(output_path), annotated)
            print(f"Annotated image saved to: {output_path}")
        else:
            print("No tomatoes detected")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Test specific image
        if len(sys.argv) > 2:
            test_single_image(sys.argv[1], sys.argv[2])
        else:
            test_single_image(sys.argv[1])
    else:
        # Run quick test on all models
        quick_test_models()