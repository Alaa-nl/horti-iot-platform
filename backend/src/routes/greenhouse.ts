import { Router } from 'express';
import { GreenhouseController } from '../controllers/greenhouseController';
import { authenticateToken, optionalAuth, authorizeRole } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { generalApiRateLimit, sanitizeRequestBody } from '../middleware/security';
import Joi from 'joi';

const router = Router();
const greenhouseController = new GreenhouseController();

// Apply security middleware to all routes
router.use(sanitizeRequestBody);
router.use(generalApiRateLimit);

// Validation schemas
const createGreenhouseSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  location: Joi.string().min(2).max(255).required(),
  dimensions: Joi.object().optional().allow(null),
  area_m2: Joi.number().positive().optional().allow(null),
  crop_type: Joi.string().max(100).optional().allow('', null),
  variety: Joi.string().max(100).optional().allow('', null),
  rootstock: Joi.string().max(100).optional().allow('', null),
  planting_date: Joi.date().optional().allow(null),
  supplier: Joi.string().max(255).optional().allow('', null),
  substrate_info: Joi.string().max(500).optional().allow('', null),
  climate_system: Joi.string().max(255).optional().allow('', null),
  lighting_system: Joi.string().max(255).optional().allow('', null),
  growing_system: Joi.string().max(255).optional().allow('', null),
  co2_target_ppm: Joi.number().positive().optional().allow(null),
  temperature_range_c: Joi.string().max(50).optional().allow('', null),
  configuration: Joi.object().optional().allow(null)
});

const updateGreenhouseSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  location: Joi.string().min(2).max(255).optional(),
  dimensions: Joi.object().optional().allow(null),
  area_m2: Joi.number().positive().optional().allow(null),
  crop_type: Joi.string().max(100).optional().allow('', null),
  variety: Joi.string().max(100).optional().allow('', null),
  rootstock: Joi.string().max(100).optional().allow('', null),
  planting_date: Joi.date().optional().allow(null),
  supplier: Joi.string().max(255).optional().allow('', null),
  substrate_info: Joi.string().max(500).optional().allow('', null),
  climate_system: Joi.string().max(255).optional().allow('', null),
  lighting_system: Joi.string().max(255).optional().allow('', null),
  growing_system: Joi.string().max(255).optional().allow('', null),
  co2_target_ppm: Joi.number().positive().optional().allow(null),
  temperature_range_c: Joi.string().max(50).optional().allow('', null),
  configuration: Joi.object().optional().allow(null)
});

/**
 * @route   GET /api/greenhouses
 * @desc    Get all greenhouses
 * @access  Public (with optional auth for personalized data)
 */
router.get('/', optionalAuth, async (req, res) => {
  await greenhouseController.getAllGreenhouses(req, res);
});

/**
 * @route   GET /api/greenhouses/:id
 * @desc    Get greenhouse by ID
 * @access  Public (with optional auth)
 */
router.get('/:id', optionalAuth, async (req, res) => {
  await greenhouseController.getGreenhouseById(req, res);
});

/**
 * @route   GET /api/greenhouses/:id/sensors
 * @desc    Get all sensors for a greenhouse
 * @access  Private (admin and researchers with access)
 */
router.get('/:id/sensors',
  authenticateToken,
  authorizeRole(['admin', 'researcher', 'grower']),
  async (req, res) => {
    await greenhouseController.getGreenhouseSensors(req, res);
  }
);

/**
 * @route   GET /api/greenhouses/:id/readings
 * @desc    Get latest sensor readings for a greenhouse
 * @access  Private (admin, researchers, and growers with access)
 * @query   hours - Number of hours to look back (default: 24)
 */
router.get('/:id/readings',
  authenticateToken,
  authorizeRole(['admin', 'researcher', 'grower']),
  async (req, res) => {
    await greenhouseController.getLatestSensorReadings(req, res);
  }
);

/**
 * @route   GET /api/greenhouses/:id/weather
 * @desc    Get weather data for a greenhouse
 * @access  Public (with optional auth)
 * @query   days - Number of days to look back (default: 7)
 */
router.get('/:id/weather', optionalAuth, async (req, res) => {
  await greenhouseController.getWeatherData(req, res);
});

/**
 * @route   POST /api/greenhouses
 * @desc    Create a new greenhouse
 * @access  Private (admin and researchers only)
 */
router.post('/',
  authenticateToken,
  authorizeRole(['admin', 'researcher']),
  validateRequest(createGreenhouseSchema),
  async (req, res) => {
    await greenhouseController.createGreenhouse(req, res);
  }
);

/**
 * @route   PUT /api/greenhouses/:id
 * @desc    Update greenhouse details
 * @access  Private (admin and researchers with permission)
 */
router.put('/:id',
  authenticateToken,
  authorizeRole(['admin', 'researcher']),
  validateRequest(updateGreenhouseSchema),
  async (req, res) => {
    await greenhouseController.updateGreenhouse(req, res);
  }
);

/**
 * @route   DELETE /api/greenhouses/:id
 * @desc    Delete a greenhouse
 * @access  Private (admin only)
 */
router.delete('/:id',
  authenticateToken,
  authorizeRole(['admin']),
  async (req, res) => {
    await greenhouseController.deleteGreenhouse(req, res);
  }
);

export default router;