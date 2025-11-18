#!/bin/bash

# Quick start script for AI service

echo "🚀 Starting Horti-IoT AI Service..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📚 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Check if models exist
if [ ! -f "models/yolov8n_tomato.pt" ]; then
    echo "⚠️  Warning: No models found in models/ directory"
    echo "   Run ./copy_models.sh to copy your trained models"
fi

# Check if test images exist
if [ ! -d "test_images" ] || [ -z "$(ls -A test_images)" ]; then
    echo "📸 No test images found. Creating test_images directory..."
    mkdir -p test_images
fi

# Start the service
echo ""
echo "✨ Starting FastAPI server..."
echo "📍 API Documentation: http://localhost:8000/docs"
echo "📍 Health Check: http://localhost:8000/"
echo ""
echo "Press Ctrl+C to stop the service"
echo "="*50

uvicorn app:app --reload --host 0.0.0.0 --port 8000