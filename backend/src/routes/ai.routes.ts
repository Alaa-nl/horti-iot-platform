/**
 * AI Routes for Tomato Detection and Analysis
 */

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { aiService } from '../services/ai.service';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `tomato-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  }
});

/**
 * GET /api/ai/health
 * Check AI service health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await aiService.healthCheck();
    res.json({
      success: true,
      ...health
    });
  } catch (error: any) {
    logger.error('AI health check failed:', error);
    res.status(503).json({
      success: false,
      error: 'AI Service is unavailable',
      message: error.message
    });
  }
});

/**
 * GET /api/ai/models
 * Get available AI models for tomato detection
 */
router.get('/models', authenticateToken, async (req: Request, res: Response) => {
  try {
    const models = await aiService.getAvailableModels();
    res.json({
      success: true,
      models
    });
  } catch (error: any) {
    logger.error('Failed to fetch AI models:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      message: error.message
    });
  }
});

/**
 * POST /api/ai/detect
 * Detect tomatoes in uploaded image
 */
router.post('/detect',
  authenticateToken,
  upload.single('image'),
  async (req: Request, res: Response): Promise<any> => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }

      const { model, confidence_threshold, greenhouse_id } = req.body;

      // Call AI service for detection
      const detection = await aiService.detectTomatoes(req.file.path, {
        model: model || 'yolov8n',
        confidenceThreshold: confidence_threshold ? parseFloat(confidence_threshold) : 0.4,
        greenhouseId: greenhouse_id
      });

      // Store results in database (optional)
      const userId = (req as any).user.userId;
      await aiService.storeDetectionInDB(detection, userId);

      // Clean up uploaded file after processing
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        detection
      });
    } catch (error: any) {
      logger.error('Detection failed:', error);

      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        error: 'Detection failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/ai/batch-detect
 * Process multiple images in batch
 */
router.post('/batch-detect',
  authenticateToken,
  upload.array('images', 10), // Max 10 images
  async (req: Request, res: Response): Promise<any> => {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No image files provided'
        });
      }

      const { model, greenhouse_id } = req.body;
      const imagePaths = files.map(f => f.path);

      // Process batch
      const results = await aiService.batchProcessImages(imagePaths, {
        model: model || 'yolov8n',
        greenhouseId: greenhouse_id
      });

      // Clean up uploaded files
      imagePaths.forEach(path => {
        if (fs.existsSync(path)) {
          fs.unlinkSync(path);
        }
      });

      res.json({
        success: true,
        results
      });
    } catch (error: any) {
      logger.error('Batch detection failed:', error);

      // Clean up files on error
      if (req.files) {
        (req.files as Express.Multer.File[]).forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      res.status(500).json({
        success: false,
        error: 'Batch detection failed',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/ai/analyze-growth
 * Analyze tomato growth trends for a greenhouse
 */
router.post('/analyze-growth',
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { greenhouse_id, days } = req.body;

      if (!greenhouse_id) {
        return res.status(400).json({
          success: false,
          error: 'Greenhouse ID is required'
        });
      }

      const analysis = await aiService.analyzeGrowth(
        greenhouse_id,
        days || 7
      );

      res.json({
        success: true,
        analysis
      });
    } catch (error: any) {
      logger.error('Growth analysis failed:', error);
      res.status(500).json({
        success: false,
        error: 'Growth analysis failed',
        message: error.message
      });
    }
  }
);

/**
 * GET /api/ai/results/:detectionId
 * Get detection results by ID
 */
router.get('/results/:detectionId',
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { detectionId } = req.params;

      const results = await aiService.getDetectionResults(detectionId);

      res.json({
        success: true,
        results
      });
    } catch (error: any) {
      logger.error('Failed to fetch results:', error);
      res.status(404).json({
        success: false,
        error: 'Results not found',
        message: error.message
      });
    }
  }
);

/**
 * DELETE /api/ai/results/:detectionId
 * Delete detection results
 */
router.delete('/results/:detectionId',
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { detectionId } = req.params;

      await aiService.deleteDetectionResults(detectionId);

      res.json({
        success: true,
        message: 'Detection results deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete results:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete results',
        message: error.message
      });
    }
  }
);

/**
 * POST /api/ai/detect-from-camera
 * Detect tomatoes from camera feed URL
 */
router.post('/detect-from-camera',
  authenticateToken,
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { camera_url, greenhouse_id, model } = req.body;

      if (!camera_url) {
        return res.status(400).json({
          success: false,
          error: 'Camera URL is required'
        });
      }

      // TODO: Implement camera feed capture and detection
      // This would involve:
      // 1. Capturing frame from camera URL
      // 2. Saving temporary image
      // 3. Running detection
      // 4. Returning results

      res.json({
        success: true,
        message: 'Camera detection endpoint - implementation pending'
      });
    } catch (error: any) {
      logger.error('Camera detection failed:', error);
      res.status(500).json({
        success: false,
        error: 'Camera detection failed',
        message: error.message
      });
    }
  }
);

export default router;