#!/usr/bin/env python3
"""
API-based Baseline Testing for Horti-IoT AI Models
Tests the AI service through its API endpoints using greenhouse data
"""

import os
import sys
import time
import json
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any
import random

# Configuration
DATA_DIR = Path("/Users/alaadrobe/Downloads/data")
RESULTS_DIR = Path("./baseline_results")
RESULTS_DIR.mkdir(exist_ok=True)
API_BASE_URL = "http://localhost:8000"

# Available models
MODELS = ["yolov8n", "yolov8s", "yolov9t", "yolov10n", "yolov11n"]

class APIBaselineTester:
    def __init__(self):
        self.results = {}
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def check_service_health(self) -> bool:
        """Check if the AI service is running"""
        try:
            response = requests.get(f"{API_BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                print(f"✓ AI Service is running")
                print(f"  Current model: {data.get('current_model')}")
                print(f"  Available models: {data.get('available_models', [])}")
                return True
        except Exception as e:
            print(f"✗ AI Service is not accessible: {e}")
            print("\nTo start the AI service, run:")
            print("  cd ai-service")
            print("  python app.py")
        return False

    def test_image_detection(self, image_path: Path, model: str, confidence: float = 0.4) -> Dict:
        """Test detection on a single image"""
        try:
            with open(image_path, 'rb') as f:
                files = {'file': (image_path.name, f, 'image/jpeg')}
                params = {
                    'model': model,
                    'confidence_threshold': confidence
                }

                start_time = time.time()
                response = requests.post(
                    f"{API_BASE_URL}/detect",
                    files=files,
                    params=params
                )
                inference_time = (time.time() - start_time) * 1000  # ms

                if response.status_code == 200:
                    data = response.json()
                    return {
                        'success': True,
                        'detections': data.get('detections', []),
                        'total_tomatoes': data.get('total_tomatoes', 0),
                        'average_confidence': data.get('average_confidence', 0),
                        'inference_time_ms': inference_time,
                        'processing_time_ms': data.get('processing_time_ms', inference_time)
                    }
                else:
                    return {
                        'success': False,
                        'error': f"HTTP {response.status_code}: {response.text}"
                    }

        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def test_on_labeled_dataset(self):
        """Test models on the labeled test dataset"""
        print("\n=== Testing on Labeled Dataset ===")

        test_dir = DATA_DIR / "training_version_2" / "test" / "images"
        if not test_dir.exists():
            print("Test dataset not found")
            return

        test_images = list(test_dir.glob("*.jpg"))[:10]  # Test on 10 images
        print(f"Testing on {len(test_images)} images from test set\n")

        for model in MODELS:
            print(f"\n📊 Testing model: {model}")
            model_results = {
                'total_detections': 0,
                'avg_confidence': [],
                'inference_times': [],
                'successful_tests': 0,
                'failed_tests': 0
            }

            for img_path in test_images:
                result = self.test_image_detection(img_path, model)

                if result['success']:
                    model_results['successful_tests'] += 1
                    model_results['total_detections'] += result['total_tomatoes']
                    if result['average_confidence'] > 0:
                        model_results['avg_confidence'].append(result['average_confidence'])
                    model_results['inference_times'].append(result['processing_time_ms'])
                    print(f"  ✓ {img_path.name}: {result['total_tomatoes']} detections")
                else:
                    model_results['failed_tests'] += 1
                    print(f"  ✗ {img_path.name}: {result.get('error', 'Unknown error')}")

            # Calculate summary
            if model_results['successful_tests'] > 0:
                avg_detections = model_results['total_detections'] / model_results['successful_tests']
                avg_inference = sum(model_results['inference_times']) / len(model_results['inference_times']) if model_results['inference_times'] else 0
                avg_conf = sum(model_results['avg_confidence']) / len(model_results['avg_confidence']) if model_results['avg_confidence'] else 0

                print(f"\n  Summary for {model}:")
                print(f"    Successful tests: {model_results['successful_tests']}/{len(test_images)}")
                print(f"    Avg detections per image: {avg_detections:.1f}")
                print(f"    Avg confidence: {avg_conf:.3f}")
                print(f"    Avg inference time: {avg_inference:.1f}ms")

                self.results[f"test_set_{model}"] = {
                    'avg_detections': avg_detections,
                    'avg_confidence': avg_conf,
                    'avg_inference_time_ms': avg_inference,
                    'successful_tests': model_results['successful_tests'],
                    'total_tests': len(test_images)
                }

    def test_on_timeseries(self):
        """Test models on time-series greenhouse images"""
        print("\n=== Testing on Time-Series Data ===")

        total_dir = DATA_DIR / "Total"
        if not total_dir.exists():
            print("Time-series data not found")
            return

        all_images = sorted(list(total_dir.glob("*.png")))
        # Sample 10 images evenly across the dataset
        step = max(1, len(all_images) // 10)
        test_images = all_images[::step][:10]

        print(f"Testing on {len(test_images)} sampled time-series images\n")

        for model in MODELS[:2]:  # Test only first 2 models for speed
            print(f"\n📊 Testing model: {model} on time-series")
            model_results = {
                'detections_timeline': [],
                'total_detections': 0,
                'inference_times': [],
                'successful_tests': 0
            }

            for img_path in test_images:
                # Extract timestamp from filename
                timestamp = img_path.stem.split('_')[0].replace('@', '')

                result = self.test_image_detection(img_path, model)

                if result['success']:
                    model_results['successful_tests'] += 1
                    model_results['total_detections'] += result['total_tomatoes']
                    model_results['inference_times'].append(result['processing_time_ms'])
                    model_results['detections_timeline'].append({
                        'timestamp': timestamp,
                        'count': result['total_tomatoes'],
                        'confidence': result['average_confidence']
                    })
                    print(f"  ✓ Time {timestamp}: {result['total_tomatoes']} tomatoes")
                else:
                    print(f"  ✗ Time {timestamp}: Failed")

            # Calculate summary
            if model_results['successful_tests'] > 0:
                avg_detections = model_results['total_detections'] / model_results['successful_tests']
                avg_inference = sum(model_results['inference_times']) / len(model_results['inference_times']) if model_results['inference_times'] else 0

                print(f"\n  Time-series summary for {model}:")
                print(f"    Successful tests: {model_results['successful_tests']}/{len(test_images)}")
                print(f"    Avg detections: {avg_detections:.1f}")
                print(f"    Avg inference time: {avg_inference:.1f}ms")

                # Show detection trend
                counts = [d['count'] for d in model_results['detections_timeline']]
                if counts:
                    print(f"    Detection range: {min(counts)}-{max(counts)} tomatoes")

                self.results[f"timeseries_{model}"] = {
                    'avg_detections': avg_detections,
                    'avg_inference_time_ms': avg_inference,
                    'successful_tests': model_results['successful_tests'],
                    'total_tests': len(test_images),
                    'timeline': model_results['detections_timeline']
                }

    def batch_test(self):
        """Test batch processing capability"""
        print("\n=== Testing Batch Processing ===")

        # Get sample images
        test_images = []
        test_dir = DATA_DIR / "training_version_2" / "test" / "images"
        if test_dir.exists():
            test_images = list(test_dir.glob("*.jpg"))[:3]

        if not test_images:
            print("No test images found for batch testing")
            return

        print(f"Testing batch processing with {len(test_images)} images")

        try:
            files = [('files', (img.name, open(img, 'rb'), 'image/jpeg')) for img in test_images]
            params = {
                'model': 'yolov8n',
                'greenhouse_id': 'test_greenhouse'
            }

            start_time = time.time()
            response = requests.post(
                f"{API_BASE_URL}/batch-process",
                files=files,
                params=params
            )
            batch_time = (time.time() - start_time) * 1000

            # Close file handles
            for _, (_, f, _) in files:
                f.close()

            if response.status_code == 200:
                data = response.json()
                print(f"✓ Batch processing successful")
                print(f"  Processed: {data.get('processed', 0)} images")
                print(f"  Successful: {data.get('successful', 0)}")
                print(f"  Total time: {batch_time:.1f}ms")
                print(f"  Avg time per image: {batch_time/len(test_images):.1f}ms")

                self.results['batch_processing'] = {
                    'images_processed': data.get('processed', 0),
                    'successful': data.get('successful', 0),
                    'total_time_ms': batch_time,
                    'avg_time_per_image_ms': batch_time / len(test_images)
                }
            else:
                print(f"✗ Batch processing failed: HTTP {response.status_code}")

        except Exception as e:
            print(f"✗ Batch test error: {e}")

    def save_results(self):
        """Save test results to file"""
        output_file = RESULTS_DIR / f"api_baseline_{self.timestamp}.json"

        with open(output_file, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)

        print(f"\n📁 Results saved to: {output_file}")

        # Print summary report
        print("\n" + "="*60)
        print("BASELINE PERFORMANCE SUMMARY")
        print("="*60)

        # Find best model based on detection count
        model_scores = {}
        for key, value in self.results.items():
            if key.startswith('test_set_'):
                model = key.replace('test_set_', '')
                if value.get('avg_detections'):
                    model_scores[model] = {
                        'detections': value['avg_detections'],
                        'confidence': value.get('avg_confidence', 0),
                        'speed': value.get('avg_inference_time_ms', 0)
                    }

        if model_scores:
            print("\n📊 Model Performance Ranking:")
            ranked = sorted(model_scores.items(),
                          key=lambda x: x[1]['detections'],
                          reverse=True)

            for i, (model, scores) in enumerate(ranked, 1):
                print(f"\n{i}. {model}:")
                print(f"   Avg Detections: {scores['detections']:.1f}")
                print(f"   Avg Confidence: {scores['confidence']:.3f}")
                print(f"   Inference Speed: {scores['speed']:.1f}ms")

            if ranked:
                print(f"\n🏆 Best Performing Model: {ranked[0][0]}")

        return output_file

    def run_all_tests(self):
        """Run complete baseline testing"""
        print("\n" + "="*60)
        print("HORTI-IOT AI SERVICE - BASELINE TESTING")
        print("="*60)

        # Check service health
        if not self.check_service_health():
            return

        # Run tests
        self.test_on_labeled_dataset()
        self.test_on_timeseries()
        self.batch_test()

        # Save results
        results_file = self.save_results()

        print("\n✅ Baseline testing complete!")
        print(f"   View detailed results in: {results_file}")

def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] == '--help':
        print("Usage: python api_baseline_test.py")
        print("\nThis script tests the AI service through its API.")
        print("Make sure the AI service is running on port 8000:")
        print("  cd ai-service && python app.py")
        return

    tester = APIBaselineTester()
    tester.run_all_tests()

if __name__ == "__main__":
    main()