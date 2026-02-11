/**
 * AI Service Integration
 * Connects to the Python AI microservice for tomato detection and analysis
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

interface DetectionResult {
  detection_id: string;
  timestamp: Date;
  model_used: string;
  detections: Array<{
    bbox: number[];
    confidence: number;
    class: string;
    center: { x: number; y: number };
    size: { width: number; height: number };
  }>;
  total_tomatoes: number;
  average_confidence: number;
  image_dimensions: { width: number; height: number };
  processing_time_ms: number;
  greenhouse_id?: string;
}

interface GrowthAnalysis {
  greenhouse_id: string;
  analysis_date: Date;
  total_heads_detected: number;
  average_size: number;
  size_distribution: {
    small: number;
    medium: number;
    large: number;
  };
  growth_rate?: number;
  health_score: number;
  recommendations: string[];
}

interface ModelInfo {
  path: string;
  description: string;
  speed: string;
  accuracy: number;
}

class AIService {
  private client: AxiosInstance;
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.aiServiceUrl,
      timeout: 30000, // 30 seconds timeout for AI processing
      headers: {
        'Accept': 'application/json',
      }
    });

    logger.info(`AI Service initialized with URL: ${this.aiServiceUrl}`);
  }

  /**
   * Check AI service health
   */
  async healthCheck(): Promise<any> {
    try {
      const response = await this.client.get('/');
      return response.data;
    } catch (error) {
      logger.error('AI Service health check failed:', error);
      throw new Error('AI Service is not available');
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<Record<string, ModelInfo>> {
    try {
      const response = await this.client.get('/models');
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch AI models:', error);
      throw error;
    }
  }

  /**
   * Detect tomatoes in an image
   */
  async detectTomatoes(
    imagePath: string,
    options: {
      model?: string;
      confidenceThreshold?: number;
      greenhouseId?: string;
    } = {}
  ): Promise<DetectionResult> {
    try {
      const formData = new FormData();

      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      const filename = path.basename(imagePath);

      formData.append('file', imageBuffer, {
        filename: filename,
        contentType: 'image/jpeg'
      });

      // Add optional parameters
      const params = new URLSearchParams();
      if (options.model) params.append('model', options.model);
      if (options.confidenceThreshold) {
        params.append('confidence_threshold', options.confidenceThreshold.toString());
      }
      if (options.greenhouseId) params.append('greenhouse_id', options.greenhouseId);

      const response = await this.client.post(
        `/detect?${params.toString()}`,
        formData,
        {
          headers: formData.getHeaders()
        }
      );

      logger.info('Tomato detection completed:', {
        detection_id: response.data.detection_id,
        total_tomatoes: response.data.total_tomatoes,
        processing_time: response.data.processing_time_ms
      });

      return response.data;
    } catch (error: any) {
      logger.error('Tomato detection failed:', error);
      throw new Error(`Detection failed: ${error.message}`);
    }
  }

  /**
   * Process multiple images in batch
   */
  async batchProcessImages(
    imagePaths: string[],
    options: {
      model?: string;
      greenhouseId?: string;
    } = {}
  ): Promise<any> {
    try {
      const formData = new FormData();

      // Add all images to form data
      for (const imagePath of imagePaths) {
        const imageBuffer = fs.readFileSync(imagePath);
        const filename = path.basename(imagePath);

        formData.append('files', imageBuffer, {
          filename: filename,
          contentType: 'image/jpeg'
        });
      }

      // Add optional parameters
      const params = new URLSearchParams();
      if (options.model) params.append('model', options.model);
      if (options.greenhouseId) params.append('greenhouse_id', options.greenhouseId);

      const response = await this.client.post(
        `/batch-process?${params.toString()}`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 60000 // 60 seconds for batch processing
        }
      );

      logger.info('Batch processing completed:', {
        processed: response.data.processed,
        successful: response.data.successful
      });

      return response.data;
    } catch (error: any) {
      logger.error('Batch processing failed:', error);
      throw new Error(`Batch processing failed: ${error.message}`);
    }
  }

  /**
   * Analyze growth trends for a greenhouse
   */
  async analyzeGrowth(
    greenhouseId: string,
    days: number = 7
  ): Promise<GrowthAnalysis> {
    try {
      const response = await this.client.post('/analyze-growth', null, {
        params: {
          greenhouse_id: greenhouseId,
          days: days
        }
      });

      logger.info('Growth analysis completed:', {
        greenhouse_id: greenhouseId,
        health_score: response.data.health_score
      });

      return response.data;
    } catch (error: any) {
      logger.error('Growth analysis failed:', error);
      throw new Error(`Growth analysis failed: ${error.message}`);
    }
  }

  /**
   * Get detection results by ID
   */
  async getDetectionResults(detectionId: string): Promise<DetectionResult> {
    try {
      const response = await this.client.get(`/results/${detectionId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch detection results:', error);
      throw new Error(`Failed to fetch results: ${error.message}`);
    }
  }

  /**
   * Delete detection results
   */
  async deleteDetectionResults(detectionId: string): Promise<void> {
    try {
      await this.client.delete(`/results/${detectionId}`);
      logger.info(`Deleted detection results: ${detectionId}`);
    } catch (error: any) {
      logger.error('Failed to delete detection results:', error);
      throw new Error(`Failed to delete results: ${error.message}`);
    }
  }

  /**
   * Store detection results in database
   */
  async storeDetectionInDB(
    detection: DetectionResult,
    userId: string
  ): Promise<void> {
    try {
      // Store in PostgreSQL database
      const query = `
        INSERT INTO ai_detections (
          detection_id,
          greenhouse_id,
          user_id,
          timestamp,
          model_used,
          total_detections,
          average_confidence,
          detections_data,
          processing_time_ms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;

      // Note: You'll need to implement the actual database query
      // This is a placeholder showing the structure
      logger.info('Stored detection in database:', detection.detection_id);
    } catch (error) {
      logger.error('Failed to store detection in database:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();
export { DetectionResult, GrowthAnalysis, ModelInfo };