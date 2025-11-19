"""
Baseline Performance Testing for Horti-IoT AI Models
Tests current models against greenhouse-specific data to establish performance baselines
"""

import os
import sys
import cv2
import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime
import json
import time
from typing import Dict, List, Tuple, Any
from ultralytics import YOLO
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')

# Configuration
DATA_DIR = Path("/Users/alaadrobe/Downloads/data")
MODELS_DIR = Path("./models")
RESULTS_DIR = Path("./baseline_results")
RESULTS_DIR.mkdir(exist_ok=True)

# Model configurations
MODEL_CONFIGS = {
    "yolov8n": {
        "path": "models/yolov8n_tomato.pt",
        "description": "YOLOv8 Nano - Fastest inference"
    },
    "yolov8s": {
        "path": "models/yolov8s_tomato.pt",
        "description": "YOLOv8 Small - Balanced"
    },
    "yolov9t": {
        "path": "models/yolov9t_tomato.pt",
        "description": "YOLOv9 Tiny - Compact"
    },
    "yolov10n": {
        "path": "models/yolov10n_tomato.pt",
        "description": "YOLOv10 Nano - Advanced"
    },
    "yolov11n": {
        "path": "models/yolov11n_tomato.pt",
        "description": "YOLOv11 Nano - Latest"
    }
}

class BaselineEvaluator:
    def __init__(self):
        self.results = {}
        self.models = {}
        self.timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    def load_models(self):
        """Load all available YOLO models"""
        print("\n=== Loading AI Models ===")
        for model_name, config in MODEL_CONFIGS.items():
            try:
                if os.path.exists(config["path"]):
                    self.models[model_name] = YOLO(config["path"])
                    print(f"✓ Loaded {model_name}: {config['description']}")
                else:
                    print(f"✗ Model file not found: {config['path']}")
            except Exception as e:
                print(f"✗ Error loading {model_name}: {str(e)}")

    def parse_yolo_label(self, label_path: Path) -> List[Dict]:
        """Parse YOLO format label file"""
        labels = []
        if label_path.exists():
            with open(label_path, 'r') as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        # For polygon format, convert to bounding box
                        class_id = int(parts[0])
                        coords = [float(x) for x in parts[1:]]

                        if len(coords) >= 4:
                            # If it's polygon coordinates, find bounding box
                            x_coords = coords[::2]
                            y_coords = coords[1::2]
                            x_min, x_max = min(x_coords), max(x_coords)
                            y_min, y_max = min(y_coords), max(y_coords)
                            x_center = (x_min + x_max) / 2
                            y_center = (y_min + y_max) / 2
                            width = x_max - x_min
                            height = y_max - y_min

                            labels.append({
                                'class': class_id,
                                'x_center': x_center,
                                'y_center': y_center,
                                'width': width,
                                'height': height
                            })
        return labels

    def calculate_iou(self, box1, box2):
        """Calculate Intersection over Union between two boxes"""
        # Convert from center format to corner format
        x1_min = box1['x_center'] - box1['width'] / 2
        y1_min = box1['y_center'] - box1['height'] / 2
        x1_max = box1['x_center'] + box1['width'] / 2
        y1_max = box1['y_center'] + box1['height'] / 2

        x2_min = box2['x_center'] - box2['width'] / 2
        y2_min = box2['y_center'] - box2['height'] / 2
        x2_max = box2['x_center'] + box2['width'] / 2
        y2_max = box2['y_center'] + box2['height'] / 2

        # Calculate intersection
        x_inter_min = max(x1_min, x2_min)
        y_inter_min = max(y1_min, y2_min)
        x_inter_max = min(x1_max, x2_max)
        y_inter_max = min(y1_max, y2_max)

        if x_inter_max < x_inter_min or y_inter_max < y_inter_min:
            return 0.0

        inter_area = (x_inter_max - x_inter_min) * (y_inter_max - y_inter_min)
        box1_area = box1['width'] * box1['height']
        box2_area = box2['width'] * box2['height']
        union_area = box1_area + box2_area - inter_area

        return inter_area / union_area if union_area > 0 else 0

    def evaluate_on_test_set(self):
        """Evaluate models on the labeled test dataset"""
        print("\n=== Evaluating on Labeled Test Set ===")
        test_dir = DATA_DIR / "training_version_2" / "test"

        if not test_dir.exists():
            print("Test directory not found")
            return

        results_by_model = {}

        for model_name, model in self.models.items():
            print(f"\nTesting {model_name}...")

            metrics = {
                'true_positives': 0,
                'false_positives': 0,
                'false_negatives': 0,
                'total_iou': 0,
                'inference_times': [],
                'confidences': [],
                'detections_per_image': []
            }

            image_dir = test_dir / "images"
            label_dir = test_dir / "labels"

            image_files = list(image_dir.glob("*.jpg"))

            for img_path in tqdm(image_files, desc=f"Processing {model_name}"):
                # Get corresponding label file
                label_path = label_dir / img_path.name.replace('.jpg', '.txt')
                ground_truth = self.parse_yolo_label(label_path)

                # Run inference
                start_time = time.time()
                results = model(str(img_path), verbose=False)
                inference_time = (time.time() - start_time) * 1000  # ms
                metrics['inference_times'].append(inference_time)

                # Process detections
                detections = []
                if len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes
                    img = cv2.imread(str(img_path))
                    h, w = img.shape[:2]

                    for box in boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])

                        # Normalize to 0-1 range
                        x_center = ((x1 + x2) / 2) / w
                        y_center = ((y1 + y2) / 2) / h
                        width = (x2 - x1) / w
                        height = (y2 - y1) / h

                        detections.append({
                            'x_center': x_center,
                            'y_center': y_center,
                            'width': width,
                            'height': height,
                            'confidence': conf
                        })
                        metrics['confidences'].append(conf)

                metrics['detections_per_image'].append(len(detections))

                # Match detections with ground truth
                matched_gt = set()
                matched_det = set()

                # Calculate IoU for all pairs and match
                for i, det in enumerate(detections):
                    best_iou = 0
                    best_gt_idx = -1

                    for j, gt in enumerate(ground_truth):
                        if j not in matched_gt:
                            iou = self.calculate_iou(det, gt)
                            if iou > best_iou:
                                best_iou = iou
                                best_gt_idx = j

                    if best_iou > 0.5:  # IoU threshold
                        metrics['true_positives'] += 1
                        metrics['total_iou'] += best_iou
                        matched_gt.add(best_gt_idx)
                        matched_det.add(i)
                    else:
                        metrics['false_positives'] += 1

                # Count false negatives
                metrics['false_negatives'] += len(ground_truth) - len(matched_gt)

            # Calculate final metrics
            precision = metrics['true_positives'] / (metrics['true_positives'] + metrics['false_positives']) \
                       if (metrics['true_positives'] + metrics['false_positives']) > 0 else 0
            recall = metrics['true_positives'] / (metrics['true_positives'] + metrics['false_negatives']) \
                    if (metrics['true_positives'] + metrics['false_negatives']) > 0 else 0
            f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            avg_iou = metrics['total_iou'] / metrics['true_positives'] if metrics['true_positives'] > 0 else 0

            results_by_model[model_name] = {
                'precision': precision,
                'recall': recall,
                'f1_score': f1_score,
                'avg_iou': avg_iou,
                'avg_inference_time': np.mean(metrics['inference_times']),
                'avg_confidence': np.mean(metrics['confidences']) if metrics['confidences'] else 0,
                'avg_detections': np.mean(metrics['detections_per_image']),
                'total_images': len(image_files),
                'true_positives': metrics['true_positives'],
                'false_positives': metrics['false_positives'],
                'false_negatives': metrics['false_negatives']
            }

            print(f"  Precision: {precision:.3f}")
            print(f"  Recall: {recall:.3f}")
            print(f"  F1 Score: {f1_score:.3f}")
            print(f"  Avg IoU: {avg_iou:.3f}")
            print(f"  Avg Inference Time: {np.mean(metrics['inference_times']):.2f}ms")

        self.results['test_set'] = results_by_model

    def evaluate_on_timeseries(self):
        """Evaluate models on time-series greenhouse images"""
        print("\n=== Evaluating on Time-Series Data ===")
        total_dir = DATA_DIR / "Total"

        if not total_dir.exists():
            print("Total directory not found")
            return

        results_by_model = {}

        # Sample 100 images evenly across the dataset
        all_images = sorted(list(total_dir.glob("*.png")))
        sample_size = min(100, len(all_images))
        step = len(all_images) // sample_size
        sampled_images = all_images[::step][:sample_size]

        for model_name, model in self.models.items():
            print(f"\nTesting {model_name} on time-series data...")

            metrics = {
                'inference_times': [],
                'detections_count': [],
                'confidences': [],
                'detection_sizes': [],
                'timestamps': []
            }

            for img_path in tqdm(sampled_images, desc=f"Processing {model_name}"):
                # Extract timestamp from filename
                timestamp = img_path.stem.split('_')[0].replace('@', '')
                metrics['timestamps'].append(timestamp)

                # Run inference
                start_time = time.time()
                results = model(str(img_path), verbose=False)
                inference_time = (time.time() - start_time) * 1000
                metrics['inference_times'].append(inference_time)

                # Process detections
                detections = 0
                if len(results) > 0 and results[0].boxes is not None:
                    boxes = results[0].boxes
                    detections = len(boxes)

                    for box in boxes:
                        conf = float(box.conf[0])
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        size = (x2 - x1) * (y2 - y1)

                        metrics['confidences'].append(conf)
                        metrics['detection_sizes'].append(size)

                metrics['detections_count'].append(detections)

            # Calculate statistics
            results_by_model[model_name] = {
                'avg_detections': np.mean(metrics['detections_count']),
                'std_detections': np.std(metrics['detections_count']),
                'min_detections': np.min(metrics['detections_count']),
                'max_detections': np.max(metrics['detections_count']),
                'avg_confidence': np.mean(metrics['confidences']) if metrics['confidences'] else 0,
                'avg_inference_time': np.mean(metrics['inference_times']),
                'avg_detection_size': np.mean(metrics['detection_sizes']) if metrics['detection_sizes'] else 0,
                'total_images': len(sampled_images),
                'detections_timeline': list(zip(metrics['timestamps'], metrics['detections_count']))
            }

            print(f"  Avg Detections: {np.mean(metrics['detections_count']):.1f} ± {np.std(metrics['detections_count']):.1f}")
            print(f"  Range: {np.min(metrics['detections_count'])}-{np.max(metrics['detections_count'])}")
            print(f"  Avg Confidence: {results_by_model[model_name]['avg_confidence']:.3f}")
            print(f"  Avg Inference Time: {np.mean(metrics['inference_times']):.2f}ms")

        self.results['timeseries'] = results_by_model

    def generate_visualizations(self):
        """Generate comparison visualizations"""
        print("\n=== Generating Visualizations ===")

        # Create comparison plots
        fig, axes = plt.subplots(2, 3, figsize=(15, 10))
        fig.suptitle('Baseline Model Performance Comparison', fontsize=16)

        # Test Set Metrics
        if 'test_set' in self.results:
            models = list(self.results['test_set'].keys())

            # Precision, Recall, F1
            metrics = ['precision', 'recall', 'f1_score']
            values = [[self.results['test_set'][m][metric] for m in models] for metric in metrics]

            x = np.arange(len(models))
            width = 0.25

            ax = axes[0, 0]
            for i, (metric, vals) in enumerate(zip(metrics, values)):
                ax.bar(x + i * width, vals, width, label=metric.replace('_', ' ').title())
            ax.set_xlabel('Model')
            ax.set_ylabel('Score')
            ax.set_title('Detection Accuracy Metrics')
            ax.set_xticks(x + width)
            ax.set_xticklabels(models, rotation=45)
            ax.legend()
            ax.grid(axis='y', alpha=0.3)

            # IoU Performance
            ax = axes[0, 1]
            ious = [self.results['test_set'][m]['avg_iou'] for m in models]
            bars = ax.bar(models, ious, color='green', alpha=0.7)
            ax.set_xlabel('Model')
            ax.set_ylabel('Average IoU')
            ax.set_title('Localization Accuracy (IoU)')
            ax.set_xticklabels(models, rotation=45)
            ax.grid(axis='y', alpha=0.3)

            # Add value labels on bars
            for bar, val in zip(bars, ious):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{val:.3f}', ha='center', va='bottom')

            # Inference Speed
            ax = axes[0, 2]
            speeds = [self.results['test_set'][m]['avg_inference_time'] for m in models]
            bars = ax.bar(models, speeds, color='orange', alpha=0.7)
            ax.set_xlabel('Model')
            ax.set_ylabel('Time (ms)')
            ax.set_title('Average Inference Speed')
            ax.set_xticklabels(models, rotation=45)
            ax.grid(axis='y', alpha=0.3)

            for bar, val in zip(bars, speeds):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{val:.1f}', ha='center', va='bottom')

        # Time-series Performance
        if 'timeseries' in self.results:
            models = list(self.results['timeseries'].keys())

            # Detection Count Statistics
            ax = axes[1, 0]
            avg_dets = [self.results['timeseries'][m]['avg_detections'] for m in models]
            std_dets = [self.results['timeseries'][m]['std_detections'] for m in models]

            bars = ax.bar(models, avg_dets, yerr=std_dets, capsize=5, color='blue', alpha=0.7)
            ax.set_xlabel('Model')
            ax.set_ylabel('Number of Detections')
            ax.set_title('Average Detections per Image (±std)')
            ax.set_xticklabels(models, rotation=45)
            ax.grid(axis='y', alpha=0.3)

            # Confidence Distribution
            ax = axes[1, 1]
            confidences = [self.results['timeseries'][m]['avg_confidence'] for m in models]
            bars = ax.bar(models, confidences, color='purple', alpha=0.7)
            ax.set_xlabel('Model')
            ax.set_ylabel('Confidence Score')
            ax.set_title('Average Detection Confidence')
            ax.set_xticklabels(models, rotation=45)
            ax.grid(axis='y', alpha=0.3)

            for bar, val in zip(bars, confidences):
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{val:.3f}', ha='center', va='bottom')

            # Performance vs Speed Trade-off
            ax = axes[1, 2]
            if 'test_set' in self.results:
                f1_scores = [self.results['test_set'][m]['f1_score'] for m in models]
                speeds = [self.results['test_set'][m]['avg_inference_time'] for m in models]

                colors = plt.cm.viridis(np.linspace(0, 1, len(models)))
                for i, (model, f1, speed) in enumerate(zip(models, f1_scores, speeds)):
                    ax.scatter(speed, f1, s=100, color=colors[i], label=model, alpha=0.7)

                ax.set_xlabel('Inference Time (ms)')
                ax.set_ylabel('F1 Score')
                ax.set_title('Performance vs Speed Trade-off')
                ax.legend(loc='best')
                ax.grid(True, alpha=0.3)

        plt.tight_layout()

        # Save visualization
        viz_path = RESULTS_DIR / f"baseline_comparison_{self.timestamp}.png"
        plt.savefig(viz_path, dpi=150, bbox_inches='tight')
        print(f"✓ Saved visualization: {viz_path}")

        # Create detection timeline for best model
        if 'timeseries' in self.results and self.results['timeseries']:
            best_model = max(self.results['test_set'].keys(),
                           key=lambda x: self.results['test_set'][x]['f1_score'])

            fig, ax = plt.subplots(figsize=(12, 4))
            timeline_data = self.results['timeseries'][best_model]['detections_timeline']

            # Convert timestamps and counts
            times = [t[0] for t in timeline_data[:50]]  # First 50 for readability
            counts = [t[1] for t in timeline_data[:50]]

            ax.plot(range(len(counts)), counts, marker='o', markersize=4, linewidth=1)
            ax.set_xlabel('Time Index')
            ax.set_ylabel('Number of Detections')
            ax.set_title(f'Detection Count Over Time - {best_model}')
            ax.grid(True, alpha=0.3)

            # Mark every 10th timestamp
            tick_positions = range(0, len(times), 10)
            ax.set_xticks(tick_positions)
            ax.set_xticklabels([times[i] for i in tick_positions], rotation=45, ha='right')

            plt.tight_layout()
            timeline_path = RESULTS_DIR / f"timeline_{best_model}_{self.timestamp}.png"
            plt.savefig(timeline_path, dpi=150, bbox_inches='tight')
            print(f"✓ Saved timeline: {timeline_path}")

    def save_results(self):
        """Save detailed results to JSON and CSV"""
        print("\n=== Saving Results ===")

        # Save complete results as JSON
        json_path = RESULTS_DIR / f"baseline_results_{self.timestamp}.json"
        with open(json_path, 'w') as f:
            json.dump(self.results, f, indent=2, default=str)
        print(f"✓ Saved JSON results: {json_path}")

        # Create summary DataFrame
        summary_data = []

        for model_name in self.models.keys():
            row = {'model': model_name}

            if 'test_set' in self.results and model_name in self.results['test_set']:
                test_data = self.results['test_set'][model_name]
                row.update({
                    'precision': test_data['precision'],
                    'recall': test_data['recall'],
                    'f1_score': test_data['f1_score'],
                    'avg_iou': test_data['avg_iou'],
                    'inference_time_ms': test_data['avg_inference_time']
                })

            if 'timeseries' in self.results and model_name in self.results['timeseries']:
                ts_data = self.results['timeseries'][model_name]
                row.update({
                    'avg_detections': ts_data['avg_detections'],
                    'detection_std': ts_data['std_detections'],
                    'timeseries_confidence': ts_data['avg_confidence']
                })

            summary_data.append(row)

        df = pd.DataFrame(summary_data)
        csv_path = RESULTS_DIR / f"baseline_summary_{self.timestamp}.csv"
        df.to_csv(csv_path, index=False)
        print(f"✓ Saved CSV summary: {csv_path}")

        # Print summary table
        print("\n=== Performance Summary ===")
        print(df.to_string(index=False))

        # Identify best model
        if 'test_set' in self.results:
            best_model = max(self.results['test_set'].keys(),
                           key=lambda x: self.results['test_set'][x]['f1_score'])
            print(f"\n🏆 Best Performing Model: {best_model}")
            print(f"   F1 Score: {self.results['test_set'][best_model]['f1_score']:.3f}")
            print(f"   Precision: {self.results['test_set'][best_model]['precision']:.3f}")
            print(f"   Recall: {self.results['test_set'][best_model]['recall']:.3f}")
            print(f"   Inference Speed: {self.results['test_set'][best_model]['avg_inference_time']:.2f}ms")

    def run_complete_evaluation(self):
        """Run the complete baseline evaluation pipeline"""
        print("\n" + "="*50)
        print("HORTI-IOT AI BASELINE EVALUATION")
        print("="*50)

        # Load models
        self.load_models()

        if not self.models:
            print("No models loaded. Exiting.")
            return

        # Run evaluations
        self.evaluate_on_test_set()
        self.evaluate_on_timeseries()

        # Generate visualizations
        self.generate_visualizations()

        # Save results
        self.save_results()

        print("\n" + "="*50)
        print("EVALUATION COMPLETE")
        print(f"Results saved in: {RESULTS_DIR}")
        print("="*50)

if __name__ == "__main__":
    evaluator = BaselineEvaluator()
    evaluator.run_complete_evaluation()