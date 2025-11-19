#!/usr/bin/env python3
"""
Model and Data Analysis for Horti-IoT AI System
Analyzes model files and dataset structure to establish baseline capabilities
"""

import os
import json
from pathlib import Path
from datetime import datetime
import random

# Configuration
DATA_DIR = Path("./data")
MODELS_DIR = Path("./models")
RESULTS_DIR = Path("./baseline_results")
RESULTS_DIR.mkdir(exist_ok=True)

def analyze_models():
    """Analyze available model files"""
    print("\n=== Model Analysis ===")

    models_info = {}

    model_files = list(MODELS_DIR.glob("*.pt"))

    if not model_files:
        print("No model files found in models directory")
        return models_info

    print(f"Found {len(model_files)} model files:\n")

    for model_path in model_files:
        model_name = model_path.stem
        file_size_mb = model_path.stat().st_size / (1024 * 1024)

        # Extract model info from filename
        if "yolov8n" in model_name:
            architecture = "YOLOv8 Nano"
            expected_performance = "Fast inference, 89.4% accuracy"
        elif "yolov8s" in model_name:
            architecture = "YOLOv8 Small"
            expected_performance = "Balanced speed/accuracy, 88.9% accuracy"
        elif "yolov9t" in model_name:
            architecture = "YOLOv9 Tiny"
            expected_performance = "Compact model, 82.6% accuracy"
        elif "yolov10n" in model_name:
            architecture = "YOLOv10 Nano"
            expected_performance = "Advanced architecture, 75.5% accuracy"
        elif "yolov11n" in model_name:
            architecture = "YOLOv11 Nano"
            expected_performance = "Latest YOLO, 78.0% accuracy"
        else:
            architecture = "Unknown"
            expected_performance = "Performance unknown"

        models_info[model_name] = {
            "file": model_path.name,
            "size_mb": round(file_size_mb, 2),
            "architecture": architecture,
            "expected_performance": expected_performance
        }

        print(f"📦 {model_name}:")
        print(f"   Architecture: {architecture}")
        print(f"   File size: {file_size_mb:.2f} MB")
        print(f"   Expected: {expected_performance}")
        print()

    return models_info

def analyze_dataset():
    """Analyze the greenhouse dataset structure and characteristics"""
    print("\n=== Dataset Analysis ===")

    dataset_info = {}

    # Analyze training data
    train_dir = DATA_DIR / "training_version_2"

    if train_dir.exists():
        print("\n📊 Training Dataset (training_version_2):")

        # Count images and labels
        train_images = list((train_dir / "train" / "images").glob("*.jpg"))
        train_labels = list((train_dir / "train" / "labels").glob("*.txt"))
        valid_images = list((train_dir / "valid" / "images").glob("*.jpg"))
        valid_labels = list((train_dir / "valid" / "labels").glob("*.txt"))
        test_images = list((train_dir / "test" / "images").glob("*.jpg"))
        test_labels = list((train_dir / "test" / "labels").glob("*.txt"))

        dataset_info['training_version_2'] = {
            'train_images': len(train_images),
            'train_labels': len(train_labels),
            'valid_images': len(valid_images),
            'valid_labels': len(valid_labels),
            'test_images': len(test_images),
            'test_labels': len(test_labels),
            'total_labeled_images': len(train_images) + len(valid_images) + len(test_images)
        }

        print(f"   Training set: {len(train_images)} images, {len(train_labels)} labels")
        print(f"   Validation set: {len(valid_images)} images, {len(valid_labels)} labels")
        print(f"   Test set: {len(test_images)} images, {len(test_labels)} labels")
        print(f"   Total labeled images: {dataset_info['training_version_2']['total_labeled_images']}")

        # Analyze label format
        if train_labels:
            sample_label = train_labels[0]
            with open(sample_label, 'r') as f:
                lines = f.readlines()
                if lines:
                    parts = lines[0].strip().split()
                    if len(parts) > 5:
                        print(f"   Label format: Polygon segmentation ({len(parts)-1} coordinates)")
                    else:
                        print(f"   Label format: Bounding box (YOLO format)")

    # Analyze time-series data
    total_dir = DATA_DIR / "Total"

    if total_dir.exists():
        print("\n📊 Time-Series Dataset (Total):")

        total_images = sorted(list(total_dir.glob("*.png")))
        dataset_info['total'] = {
            'total_images': len(total_images),
            'timestamps': []
        }

        if total_images:
            # Extract time range
            first_time = total_images[0].stem.split('_')[0].replace('@', '')
            last_time = total_images[-1].stem.split('_')[0].replace('@', '')

            print(f"   Total images: {len(total_images)}")
            print(f"   Time range: {first_time} to {last_time}")
            print(f"   Capture interval: ~30 minutes")

            # Sample some timestamps
            sample_times = [img.stem.split('_')[0].replace('@', '') for img in total_images[::60]]
            dataset_info['total']['sample_timestamps'] = sample_times

            # Calculate data collection duration
            if first_time and last_time:
                # Assuming format HHMMSS
                hours_covered = (int(last_time[:2]) - int(first_time[:2])) % 24
                print(f"   Data collection span: ~{hours_covered} hours of greenhouse monitoring")

    # Check for other data folders
    if (DATA_DIR / "training_version2").exists():
        other_images = list((DATA_DIR / "training_version2").glob("**/*.jpg"))
        print(f"\n📊 Additional data in training_version2: {len(other_images)} images")

    return dataset_info

def generate_recommendations(models_info, dataset_info):
    """Generate recommendations based on analysis"""
    print("\n=== Recommendations for Baseline Testing ===")

    recommendations = []

    # Model recommendations
    if models_info:
        print("\n🎯 Model Testing Strategy:")
        print("1. Start with YOLOv8n (best expected accuracy: 89.4%)")
        print("2. Compare with YOLOv8s for accuracy vs speed trade-off")
        print("3. Test YOLOv11n as the latest architecture")

        smallest_model = min(models_info.items(), key=lambda x: x[1]['size_mb'])
        print(f"\n   Fastest inference: {smallest_model[0]} ({smallest_model[1]['size_mb']} MB)")

        recommendations.append({
            "category": "models",
            "recommendation": "Test YOLOv8n first for baseline, then compare with others",
            "rationale": "YOLOv8n has the highest expected accuracy"
        })

    # Dataset recommendations
    if dataset_info:
        if 'training_version_2' in dataset_info:
            total_labeled = dataset_info['training_version_2']['total_labeled_images']
            print(f"\n🎯 Dataset Usage:")
            print(f"   • Use {dataset_info['training_version_2']['test_images']} test images for accuracy evaluation")
            print(f"   • {total_labeled} total labeled images available for fine-tuning")

            recommendations.append({
                "category": "dataset",
                "recommendation": f"Use the {dataset_info['training_version_2']['test_images']} test images for unbiased evaluation",
                "rationale": "Test set provides ground truth for accuracy metrics"
            })

        if 'total' in dataset_info:
            print(f"   • Use {dataset_info['total']['total_images']} time-series images for temporal analysis")
            print(f"   • Sample every 10th image for efficient testing (~{dataset_info['total']['total_images']//10} images)")

            recommendations.append({
                "category": "time_series",
                "recommendation": "Sample time-series data at 10-image intervals for growth tracking",
                "rationale": "Provides temporal insights while keeping test time manageable"
            })

    # Testing recommendations
    print("\n🎯 Testing Approach:")
    print("1. Accuracy Testing: Run models on test set with ground truth")
    print("2. Speed Testing: Measure inference time per image")
    print("3. Consistency Testing: Check detection stability on time-series")
    print("4. Growth Analysis: Track tomato counts over time")

    recommendations.append({
        "category": "testing",
        "recommendation": "Implement multi-metric evaluation: accuracy, speed, and consistency",
        "rationale": "Comprehensive evaluation for production deployment"
    })

    return recommendations

def estimate_performance():
    """Estimate expected performance based on model and data characteristics"""
    print("\n=== Performance Estimation ===")

    print("\n📈 Expected Baseline Performance:")

    performance = {
        "yolov8n": {
            "accuracy": "85-90%",
            "inference_speed": "15-25ms per image",
            "tomatoes_per_image": "8-15",
            "confidence_range": "0.4-0.9"
        },
        "yolov8s": {
            "accuracy": "83-88%",
            "inference_speed": "20-35ms per image",
            "tomatoes_per_image": "8-15",
            "confidence_range": "0.4-0.9"
        },
        "yolov11n": {
            "accuracy": "75-80%",
            "inference_speed": "15-25ms per image",
            "tomatoes_per_image": "7-14",
            "confidence_range": "0.35-0.85"
        }
    }

    for model, perf in performance.items():
        print(f"\n{model}:")
        print(f"  • Expected accuracy: {perf['accuracy']}")
        print(f"  • Inference speed: {perf['inference_speed']}")
        print(f"  • Avg detections: {perf['tomatoes_per_image']}")
        print(f"  • Confidence range: {perf['confidence_range']}")

    print("\n⚡ Performance Factors:")
    print("  • Image resolution affects both accuracy and speed")
    print("  • Greenhouse lighting conditions impact detection quality")
    print("  • Occlusion and clustering reduce detection accuracy")
    print("  • Fine-tuning with your data can improve accuracy by 5-10%")

    return performance

def save_analysis_report(models_info, dataset_info, recommendations, performance):
    """Save comprehensive analysis report"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    report = {
        "timestamp": timestamp,
        "models": models_info,
        "dataset": dataset_info,
        "recommendations": recommendations,
        "expected_performance": performance,
        "summary": {
            "total_models": len(models_info),
            "total_labeled_images": dataset_info.get('training_version_2', {}).get('total_labeled_images', 0),
            "total_timeseries_images": dataset_info.get('total', {}).get('total_images', 0),
            "recommended_model": "yolov8n",
            "next_steps": [
                "Run API baseline test when service is available",
                "Fine-tune YOLOv8n with greenhouse-specific data",
                "Implement time-series growth tracking",
                "Set up continuous model evaluation pipeline"
            ]
        }
    }

    output_file = RESULTS_DIR / f"analysis_report_{timestamp}.json"
    with open(output_file, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📁 Analysis report saved to: {output_file}")

    return output_file

def main():
    """Run complete analysis"""
    print("\n" + "="*60)
    print("HORTI-IOT AI SYSTEM - MODEL & DATA ANALYSIS")
    print("="*60)

    # Analyze models
    models_info = analyze_models()

    # Analyze dataset
    dataset_info = analyze_dataset()

    # Generate recommendations
    recommendations = generate_recommendations(models_info, dataset_info)

    # Estimate performance
    performance = estimate_performance()

    # Save report
    report_file = save_analysis_report(models_info, dataset_info, recommendations, performance)

    print("\n" + "="*60)
    print("ANALYSIS COMPLETE")
    print("="*60)

    print("\n✅ Key Findings:")
    if models_info:
        print(f"   • {len(models_info)} AI models available for testing")
    if dataset_info.get('training_version_2'):
        print(f"   • {dataset_info['training_version_2']['total_labeled_images']} labeled images for validation")
    if dataset_info.get('total'):
        print(f"   • {dataset_info['total']['total_images']} time-series images for growth analysis")

    print("\n🚀 Next Steps:")
    print("1. Install Python dependencies (consider Python 3.11 or 3.12)")
    print("2. Run the AI service: cd ai-service && python app.py")
    print("3. Execute api_baseline_test.py for performance metrics")
    print("4. Review results and implement recommended improvements")

    print(f"\n📊 Detailed report: {report_file}")

if __name__ == "__main__":
    main()