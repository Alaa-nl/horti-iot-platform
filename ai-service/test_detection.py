#!/usr/bin/env python3
"""
Test script for YOLO tomato detection models
Tests all available models with sample images
"""

import os
import sys
from pathlib import Path
from ultralytics import YOLO
import cv2
import json
from datetime import datetime

def test_models():
    """Test all YOLO models with sample images"""

    # Setup paths
    models_dir = Path(__file__).parent / "models"
    test_images_dir = Path(__file__).parent / "test_images"
    results_dir = Path(__file__).parent / "test_results"
    results_dir.mkdir(exist_ok=True)

    # Find all model files
    model_files = list(models_dir.glob("*.pt"))

    # Find all test images
    test_images = list(test_images_dir.glob("*.jpg")) + list(test_images_dir.glob("*.png"))

    if not model_files:
        print("❌ No model files found in models directory")
        return False

    if not test_images:
        print("❌ No test images found in test_images directory")
        return False

    print(f"🔍 Found {len(model_files)} models and {len(test_images)} test images")
    print("="*60)

    results_summary = []

    for model_path in model_files:
        model_name = model_path.stem
        print(f"\n📊 Testing model: {model_name}")
        print("-"*40)

        try:
            # Load model
            model = YOLO(str(model_path))
            print(f"✅ Model loaded successfully")

            model_results = {
                "model": model_name,
                "detections": []
            }

            # Test on each image
            for img_path in test_images:
                print(f"  🖼️ Testing on: {img_path.name}")

                # Run inference
                results = model(str(img_path), conf=0.4, save=False)

                if len(results) > 0 and results[0].boxes is not None:
                    num_detections = len(results[0].boxes)
                    avg_confidence = sum([float(box.conf[0]) for box in results[0].boxes]) / num_detections if num_detections > 0 else 0

                    # Save annotated image
                    annotated = results[0].plot()
                    output_path = results_dir / f"{model_name}_{img_path.stem}_result.jpg"
                    cv2.imwrite(str(output_path), annotated)

                    print(f"    ✓ Detected {num_detections} tomatoes")
                    print(f"    ✓ Average confidence: {avg_confidence:.2%}")
                    print(f"    ✓ Saved result to: {output_path.name}")

                    model_results["detections"].append({
                        "image": img_path.name,
                        "count": num_detections,
                        "avg_confidence": avg_confidence
                    })
                else:
                    print(f"    ⚠️ No detections found")
                    model_results["detections"].append({
                        "image": img_path.name,
                        "count": 0,
                        "avg_confidence": 0
                    })

            results_summary.append(model_results)

        except Exception as e:
            print(f"❌ Error testing model {model_name}: {e}")

    # Save summary report
    report_path = results_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, 'w') as f:
        json.dump(results_summary, f, indent=2)

    print("\n" + "="*60)
    print("📈 SUMMARY REPORT")
    print("="*60)

    for model_result in results_summary:
        total_detections = sum([d["count"] for d in model_result["detections"]])
        avg_detections = total_detections / len(model_result["detections"]) if model_result["detections"] else 0

        print(f"\n{model_result['model']}:")
        print(f"  Total tomatoes detected: {total_detections}")
        print(f"  Average per image: {avg_detections:.1f}")

    print(f"\n✅ Test complete! Results saved to: {results_dir}")
    print(f"📄 Report saved to: {report_path.name}")
    return True

def test_single_image(image_path, model_name="yolov8n_tomato"):
    """Quick test with a single image and model"""

    model_path = Path(__file__).parent / "models" / f"{model_name}.pt"

    if not model_path.exists():
        print(f"❌ Model not found: {model_path}")
        return

    if not Path(image_path).exists():
        print(f"❌ Image not found: {image_path}")
        return

    print(f"Testing {image_path} with {model_name}...")

    # Load model and run inference
    model = YOLO(str(model_path))
    results = model(image_path, conf=0.4, save=True)

    if len(results) > 0 and results[0].boxes is not None:
        num_detections = len(results[0].boxes)
        print(f"✅ Detected {num_detections} tomatoes!")

        # Display results
        for i, box in enumerate(results[0].boxes):
            conf = float(box.conf[0])
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            width = x2 - x1
            height = y2 - y1
            print(f"  Tomato #{i+1}: Confidence={conf:.2%}, Size={width:.0f}x{height:.0f}")
    else:
        print("No tomatoes detected")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Test single image if provided as argument
        test_single_image(sys.argv[1])
    else:
        # Run full test suite
        test_models()