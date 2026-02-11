#!/usr/bin/env python3
"""
Batch testing script for AI tomato detection
Tests multiple images and compares model performance
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from datetime import datetime
import statistics

def test_batch_api(images_dir="batch_test_images", api_url="http://localhost:8000"):
    """Test batch detection through the API"""

    # Check if API is running
    try:
        health = requests.get(f"{api_url}/")
        if health.status_code != 200:
            print("❌ API service is not running. Start it with: ./start.sh")
            return False
    except:
        print("❌ Cannot connect to API. Start the service with: ./start.sh")
        return False

    print(f"✅ Connected to API at {api_url}")

    # Get available models
    models_response = requests.get(f"{api_url}/models")
    available_models = models_response.json() if models_response.status_code == 200 else {}

    # Find all images
    images_path = Path(images_dir)
    image_files = list(images_path.glob("*.png")) + list(images_path.glob("*.jpg"))

    if not image_files:
        print(f"❌ No images found in {images_dir}")
        return False

    print(f"📸 Found {len(image_files)} images to test")
    print(f"🤖 Testing with {len(available_models)} models")
    print("="*60)

    # Results storage
    all_results = {}

    # Test each model
    for model_name in available_models.keys():
        print(f"\n📊 Testing model: {model_name}")
        print("-"*40)

        model_results = {
            "model": model_name,
            "total_images": len(image_files),
            "total_detections": 0,
            "images_with_detections": 0,
            "processing_times": [],
            "confidence_scores": [],
            "detection_counts": []
        }

        # Test on each image
        for idx, img_path in enumerate(image_files, 1):
            print(f"  [{idx}/{len(image_files)}] Processing {img_path.name}...", end=" ")

            try:
                # Upload and detect
                with open(img_path, 'rb') as f:
                    files = {'file': f}
                    data = {
                        'model': model_name,
                        'confidence_threshold': 0.4
                    }

                    start_time = time.time()
                    response = requests.post(
                        f"{api_url}/detect",
                        files=files,
                        data=data
                    )
                    processing_time = (time.time() - start_time) * 1000  # ms

                    if response.status_code == 200:
                        result = response.json()
                        num_detections = result['total_tomatoes']
                        avg_confidence = result['average_confidence']

                        model_results["total_detections"] += num_detections
                        model_results["processing_times"].append(processing_time)

                        if num_detections > 0:
                            model_results["images_with_detections"] += 1
                            model_results["confidence_scores"].append(avg_confidence)
                            model_results["detection_counts"].append(num_detections)

                        print(f"✓ {num_detections} tomatoes")
                    else:
                        print(f"✗ Error: {response.status_code}")

            except Exception as e:
                print(f"✗ Failed: {str(e)}")

        # Calculate statistics
        if model_results["processing_times"]:
            model_results["avg_processing_time"] = statistics.mean(model_results["processing_times"])
            model_results["median_processing_time"] = statistics.median(model_results["processing_times"])

        if model_results["confidence_scores"]:
            model_results["avg_confidence"] = statistics.mean(model_results["confidence_scores"])

        if model_results["detection_counts"]:
            model_results["avg_detections_per_image"] = statistics.mean(model_results["detection_counts"])

        all_results[model_name] = model_results

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"batch_test_results_{timestamp}.json"

    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2)

    # Print summary
    print("\n" + "="*60)
    print("📈 PERFORMANCE SUMMARY")
    print("="*60)

    # Create comparison table
    print(f"\n{'Model':<12} {'Detected':<10} {'Avg/Image':<12} {'Avg Conf':<10} {'Speed (ms)':<12}")
    print("-"*60)

    for model_name, results in all_results.items():
        detected = results.get("images_with_detections", 0)
        avg_per_img = results.get("avg_detections_per_image", 0)
        avg_conf = results.get("avg_confidence", 0)
        avg_speed = results.get("avg_processing_time", 0)

        print(f"{model_name:<12} {detected:<10} {avg_per_img:<12.1f} {avg_conf:<10.2%} {avg_speed:<12.1f}")

    # Find best model
    best_detection = max(all_results.items(),
                        key=lambda x: x[1].get("total_detections", 0))
    fastest = min(all_results.items(),
                 key=lambda x: x[1].get("avg_processing_time", float('inf')))

    print("\n🏆 Best Models:")
    print(f"  • Most Detections: {best_detection[0]} ({best_detection[1]['total_detections']} total)")
    print(f"  • Fastest: {fastest[0]} ({fastest[1].get('avg_processing_time', 0):.1f}ms avg)")

    print(f"\n💾 Results saved to: {results_file}")

    return True

def test_single_batch(image_folder, model="yolov8n", api_url="http://localhost:8000"):
    """Quick batch test with a single model"""

    images_path = Path(image_folder)
    image_files = list(images_path.glob("*.png")) + list(images_path.glob("*.jpg"))

    if not image_files:
        print(f"❌ No images found in {image_folder}")
        return

    # Prepare batch request
    files = []
    for img_path in image_files[:10]:  # Limit to 10 images for quick test
        files.append(('files', (img_path.name, open(img_path, 'rb'), 'image/jpeg')))

    data = {'model': model}

    print(f"📤 Sending {len(files)} images for batch detection...")

    try:
        response = requests.post(
            f"{api_url}/batch-process",
            files=files,
            data=data
        )

        # Close file handles
        for _, (_, f, _) in files:
            f.close()

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Batch processing complete!")
            print(f"  • Processed: {result.get('processed', 0)}")
            print(f"  • Successful: {result.get('successful', 0)}")

            # Show individual results
            if 'results' in result:
                for idx, img_result in enumerate(result['results'], 1):
                    if 'error' not in img_result:
                        print(f"  Image {idx}: {img_result.get('total_tomatoes', 0)} tomatoes detected")
        else:
            print(f"❌ Batch processing failed: {response.status_code}")

    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Test specific folder
        test_batch_api(sys.argv[1])
    else:
        # Test with default batch folder
        print("🍅 Tomato Detection Batch Testing")
        print("="*60)
        print("")

        # Check for test images
        if not Path("batch_test_images").exists():
            print("📁 Creating batch test folder...")
            print("   Run: ./add_test_images.sh")
            sys.exit(1)

        # Run comprehensive test
        test_batch_api()