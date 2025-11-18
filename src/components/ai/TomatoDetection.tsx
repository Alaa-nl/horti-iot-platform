import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, AlertCircle, CheckCircle, Loader, BarChart2, Download } from 'lucide-react';
import axios from 'axios';

interface Detection {
  bbox: number[];
  confidence: number;
  class: string;
  center: { x: number; y: number };
  size: { width: number; height: number };
}

interface DetectionResult {
  detection_id: string;
  timestamp: Date;
  model_used: string;
  detections: Detection[];
  total_tomatoes: number;
  average_confidence: number;
  image_dimensions: { width: number; height: number };
  processing_time_ms: number;
  greenhouse_id?: string;
}

interface TomatoDetectionProps {
  greenhouseId?: string;
  onDetectionComplete?: (result: DetectionResult) => void;
}

const TomatoDetection: React.FC<TomatoDetectionProps> = ({
  greenhouseId,
  onDetectionComplete
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('yolov8n');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.4);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const models = [
    { id: 'yolov8n', name: 'YOLOv8 Nano', speed: 'Fast', accuracy: '89.4%' },
    { id: 'yolov8s', name: 'YOLOv8 Small', speed: 'Medium', accuracy: '88.9%' },
    { id: 'yolov11n', name: 'YOLOv11 Nano', speed: 'Fast', accuracy: '78.0%' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
      setDetectionResult(null);
    }
  };

  const drawDetections = (imageUrl: string, detections: Detection[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Draw bounding boxes
      detections.forEach((detection, index) => {
        const [x1, y1, x2, y2] = detection.bbox;
        const width = x2 - x1;
        const height = y2 - y1;

        // Draw box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(x1, y1, width, height);

        // Draw label background
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x1, y1 - 25, width, 25);

        // Draw label text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(
          `Tomato #${index + 1} (${(detection.confidence * 100).toFixed(1)}%)`,
          x1 + 5,
          y1 - 8
        );

        // Draw center point
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(detection.center.x, detection.center.y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    };
    img.src = imageUrl;
  };

  const processImage = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setIsProcessing(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('model', selectedModel);
    formData.append('confidence_threshold', confidenceThreshold.toString());
    if (greenhouseId) {
      formData.append('greenhouse_id', greenhouseId);
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/ai/detect`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setDetectionResult(response.data.detection);
        drawDetections(previewUrl, response.data.detection.detections);
        if (onDetectionComplete) {
          onDetectionComplete(response.data.detection);
        }
      }
    } catch (err: any) {
      console.error('Detection error:', err);
      setError(err.response?.data?.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (!detectionResult) return;

    const results = {
      ...detectionResult,
      image_name: selectedFile?.name
    };

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tomato-detection-${detectionResult.detection_id}.json`;
    a.click();
  };

  const reset = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setDetectionResult(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-soft-lg p-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        AI Tomato Detection
      </h2>

      {/* Model Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          AI Model
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {models.map(model => (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedModel === model.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-semibold">{model.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Speed: {model.speed} | Accuracy: {model.accuracy}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Confidence Threshold */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Confidence Threshold: {(confidenceThreshold * 100).toFixed(0)}%
        </label>
        <input
          type="range"
          min="0.1"
          max="0.9"
          step="0.1"
          value={confidenceThreshold}
          onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* File Upload Area */}
      <div className="mb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!previewUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-primary/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="w-12 h-12 text-primary mx-auto mb-3" />
            <p className="text-foreground font-medium">
              Click to upload image
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PNG, JPG up to 10MB
            </p>
          </div>
        ) : (
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full rounded-lg shadow-md"
              style={{ display: detectionResult ? 'block' : 'none' }}
            />
            {!detectionResult && (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full rounded-lg shadow-md"
              />
            )}
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      {/* Process Button */}
      {selectedFile && !detectionResult && (
        <button
          onClick={processImage}
          disabled={isProcessing}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isProcessing
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5" />
              Detect Tomatoes
            </>
          )}
        </button>
      )}

      {/* Results Display */}
      {detectionResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 space-y-4"
          >
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-green-700">
                Detection completed successfully!
              </span>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-background rounded-lg p-3 border">
                <div className="text-xs text-muted-foreground">Total Detected</div>
                <div className="text-2xl font-bold text-primary">
                  {detectionResult.total_tomatoes}
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
                <div className="text-2xl font-bold text-foreground">
                  {(detectionResult.average_confidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <div className="text-xs text-muted-foreground">Model Used</div>
                <div className="text-sm font-medium text-foreground mt-1">
                  {detectionResult.model_used.toUpperCase()}
                </div>
              </div>
              <div className="bg-background rounded-lg p-3 border">
                <div className="text-xs text-muted-foreground">Process Time</div>
                <div className="text-2xl font-bold text-foreground">
                  {detectionResult.processing_time_ms.toFixed(0)}ms
                </div>
              </div>
            </div>

            {/* Individual Detections */}
            <div className="bg-background rounded-lg p-4 border">
              <h3 className="font-semibold mb-3">Detected Tomatoes</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {detectionResult.detections.map((detection, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-card rounded"
                  >
                    <span className="font-medium">Tomato #{index + 1}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span>
                        Size: {detection.size.width.toFixed(0)}×{detection.size.height.toFixed(0)}
                      </span>
                      <span className="text-primary font-medium">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={downloadResults}
                className="flex-1 py-2 px-4 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Results
              </button>
              <button
                onClick={reset}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Process New Image
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default TomatoDetection;