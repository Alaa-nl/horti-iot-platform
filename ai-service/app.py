"""
Tomato Detection AI Service for Horti-IoT Platform
Uses YOLO models for detecting and analyzing tomato heads in greenhouse images
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import os
import cv2
import numpy as np
from datetime import datetime
import uuid
import json
from pathlib import Path
from ultralytics import YOLO
import asyncio
from pydantic import BaseModel
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Horti-IoT AI Service",
    description="Computer Vision AI for Tomato Detection and Growth Analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
UPLOAD_DIR = Path("./uploads")
RESULTS_DIR = Path("./results")
MODELS_DIR = Path("./models")

# Create directories
UPLOAD_DIR.mkdir(exist_ok=True)
RESULTS_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

# Model configurations
MODEL_CONFIGS = {
    "yolov8n": {
        "path": "models/yolov8n_tomato.pt",
        "description": "YOLOv8 Nano - Fastest, less accurate",
        "speed": "fast",
        "accuracy": 0.894
    },
    "yolov8s": {
        "path": "models/yolov8s_tomato.pt",
        "description": "YOLOv8 Small - Balanced speed and accuracy",
        "speed": "medium",
        "accuracy": 0.889
    },
    "yolov11n": {
        "path": "models/yolov11n_tomato.pt",
        "description": "YOLOv11 Nano - Latest architecture",
        "speed": "fast",
        "accuracy": 0.780
    }
}

# Load default model
current_model = None
current_model_name = "yolov8n"

class DetectionRequest(BaseModel):
    image_path: str
    model: Optional[str] = "yolov8n"
    confidence_threshold: Optional[float] = 0.4
    greenhouse_id: Optional[str] = None
    capture_time: Optional[datetime] = None

class DetectionResult(BaseModel):
    detection_id: str
    timestamp: datetime
    model_used: str
    detections: List[Dict[str, Any]]
    total_tomatoes: int
    average_confidence: float
    image_dimensions: Dict[str, int]
    processing_time_ms: float
    greenhouse_id: Optional[str] = None

class GrowthAnalysis(BaseModel):
    greenhouse_id: str
    analysis_date: datetime
    total_heads_detected: int
    average_size: float
    size_distribution: Dict[str, int]
    growth_rate: Optional[float] = None
    health_score: float
    recommendations: List[str]

def load_model(model_name: str = "yolov8n"):
    """Load YOLO model for tomato detection"""
    global current_model, current_model_name

    if model_name not in MODEL_CONFIGS:
        raise ValueError(f"Model {model_name} not found")

    model_path = MODEL_CONFIGS[model_name]["path"]

    # Check if model file exists, if not use default YOLO model
    if os.path.exists(model_path):
        current_model = YOLO(model_path)
    else:
        logger.warning(f"Model file {model_path} not found, using default YOLOv8n")
        current_model = YOLO('yolov8n.pt')  # Will download if not present

    current_model_name = model_name
    logger.info(f"Loaded model: {model_name}")
    return current_model

@app.on_event("startup")
async def startup_event():
    """Initialize the AI service on startup"""
    logger.info("Starting Horti-IoT AI Service...")
    load_model("yolov8n")
    logger.info("AI Service ready!")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Horti-IoT AI Service",
        "status": "running",
        "current_model": current_model_name,
        "available_models": list(MODEL_CONFIGS.keys())
    }

@app.get("/models")
async def get_available_models():
    """Get list of available AI models"""
    return MODEL_CONFIGS

@app.post("/detect")
async def detect_tomatoes(
    file: UploadFile = File(...),
    model: str = "yolov8n",
    confidence_threshold: float = 0.4,
    greenhouse_id: Optional[str] = None
):
    """
    Detect tomato heads in uploaded image
    """
    start_time = datetime.now()

    # Generate unique ID for this detection
    detection_id = str(uuid.uuid4())

    try:
        # Save uploaded file
        file_extension = file.filename.split('.')[-1]
        file_path = UPLOAD_DIR / f"{detection_id}.{file_extension}"

        contents = await file.read()
        with open(file_path, 'wb') as f:
            f.write(contents)

        # Load model if different from current
        if model != current_model_name:
            load_model(model)

        # Run inference
        results = current_model(str(file_path), conf=confidence_threshold)

        # Process results
        detections = []
        for r in results:
            boxes = r.boxes
            if boxes is not None:
                for box in boxes:
                    detection = {
                        "bbox": box.xyxy[0].tolist(),  # [x1, y1, x2, y2]
                        "confidence": float(box.conf[0]),
                        "class": "tomato_head",
                        "center": {
                            "x": float((box.xyxy[0][0] + box.xyxy[0][2]) / 2),
                            "y": float((box.xyxy[0][1] + box.xyxy[0][3]) / 2)
                        },
                        "size": {
                            "width": float(box.xyxy[0][2] - box.xyxy[0][0]),
                            "height": float(box.xyxy[0][3] - box.xyxy[0][1])
                        }
                    }
                    detections.append(detection)

        # Calculate metrics
        total_tomatoes = len(detections)
        avg_confidence = np.mean([d["confidence"] for d in detections]) if detections else 0

        # Get image dimensions
        img = cv2.imread(str(file_path))
        height, width = img.shape[:2]

        # Save annotated image
        annotated_path = RESULTS_DIR / f"{detection_id}_annotated.jpg"
        if len(results) > 0:
            annotated = results[0].plot()
            cv2.imwrite(str(annotated_path), annotated)

        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds() * 1000

        result = DetectionResult(
            detection_id=detection_id,
            timestamp=datetime.now(),
            model_used=model,
            detections=detections,
            total_tomatoes=total_tomatoes,
            average_confidence=float(avg_confidence),
            image_dimensions={"width": width, "height": height},
            processing_time_ms=processing_time,
            greenhouse_id=greenhouse_id
        )

        # Store results for later analysis
        results_file = RESULTS_DIR / f"{detection_id}_results.json"
        with open(results_file, 'w') as f:
            json.dump(result.dict(), f, default=str)

        return result

    except Exception as e:
        logger.error(f"Detection failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-growth")
async def analyze_growth(greenhouse_id: str, days: int = 7):
    """
    Analyze tomato growth trends over time
    """
    try:
        # Load historical detection results for the greenhouse
        results_files = list(RESULTS_DIR.glob("*_results.json"))
        greenhouse_results = []

        for file in results_files:
            with open(file, 'r') as f:
                data = json.load(f)
                if data.get("greenhouse_id") == greenhouse_id:
                    greenhouse_results.append(data)

        if not greenhouse_results:
            raise HTTPException(status_code=404, detail="No data found for greenhouse")

        # Sort by timestamp
        greenhouse_results.sort(key=lambda x: x["timestamp"])

        # Calculate growth metrics
        total_detections = sum(r["total_tomatoes"] for r in greenhouse_results)
        avg_detections = total_detections / len(greenhouse_results) if greenhouse_results else 0

        # Size distribution analysis
        all_sizes = []
        for result in greenhouse_results:
            for detection in result["detections"]:
                size = detection["size"]["width"] * detection["size"]["height"]
                all_sizes.append(size)

        size_distribution = {
            "small": len([s for s in all_sizes if s < 1000]),
            "medium": len([s for s in all_sizes if 1000 <= s < 3000]),
            "large": len([s for s in all_sizes if s >= 3000])
        }

        # Calculate growth rate (simplified)
        if len(greenhouse_results) >= 2:
            first_count = greenhouse_results[0]["total_tomatoes"]
            last_count = greenhouse_results[-1]["total_tomatoes"]
            growth_rate = (last_count - first_count) / len(greenhouse_results)
        else:
            growth_rate = None

        # Generate recommendations
        recommendations = []
        if avg_detections < 10:
            recommendations.append("Low tomato count detected. Check plant health and growing conditions.")
        if size_distribution["small"] > size_distribution["large"]:
            recommendations.append("Many small tomatoes detected. Consider adjusting nutrients or pruning.")

        analysis = GrowthAnalysis(
            greenhouse_id=greenhouse_id,
            analysis_date=datetime.now(),
            total_heads_detected=int(avg_detections),
            average_size=float(np.mean(all_sizes)) if all_sizes else 0,
            size_distribution=size_distribution,
            growth_rate=growth_rate,
            health_score=min(avg_detections / 20 * 100, 100),  # Simplified health score
            recommendations=recommendations
        )

        return analysis

    except Exception as e:
        logger.error(f"Growth analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/batch-process")
async def batch_process_images(
    files: List[UploadFile] = File(...),
    model: str = "yolov8n",
    greenhouse_id: Optional[str] = None
):
    """
    Process multiple images in batch
    """
    results = []

    for file in files:
        try:
            result = await detect_tomatoes(file, model, 0.4, greenhouse_id)
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to process {file.filename}: {str(e)}")
            results.append({"error": str(e), "filename": file.filename})

    return {
        "processed": len(results),
        "successful": len([r for r in results if "error" not in r]),
        "results": results
    }

@app.get("/results/{detection_id}")
async def get_detection_result(detection_id: str):
    """
    Retrieve detection results by ID
    """
    results_file = RESULTS_DIR / f"{detection_id}_results.json"

    if not results_file.exists():
        raise HTTPException(status_code=404, detail="Results not found")

    with open(results_file, 'r') as f:
        return json.load(f)

@app.delete("/results/{detection_id}")
async def delete_detection_result(detection_id: str):
    """
    Delete detection results and associated files
    """
    # Delete results JSON
    results_file = RESULTS_DIR / f"{detection_id}_results.json"
    if results_file.exists():
        results_file.unlink()

    # Delete original image
    for ext in ['jpg', 'jpeg', 'png']:
        img_file = UPLOAD_DIR / f"{detection_id}.{ext}"
        if img_file.exists():
            img_file.unlink()

    # Delete annotated image
    annotated_file = RESULTS_DIR / f"{detection_id}_annotated.jpg"
    if annotated_file.exists():
        annotated_file.unlink()

    return {"message": "Detection results deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)