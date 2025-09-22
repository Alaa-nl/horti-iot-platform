import { Router } from 'express';
import { GreenhouseController } from '../controllers/greenhouseController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const greenhouseController = new GreenhouseController();

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
 * @access  Private (researchers only)
 */
router.get('/:id/sensors', authenticateToken, async (req, res) => {
  await greenhouseController.getGreenhouseSensors(req, res);
});

/**
 * @route   GET /api/greenhouses/:id/readings
 * @desc    Get latest sensor readings for a greenhouse
 * @access  Private (researchers only)
 * @query   hours - Number of hours to look back (default: 24)
 */
router.get('/:id/readings', authenticateToken, async (req, res) => {
  await greenhouseController.getLatestSensorReadings(req, res);
});

/**
 * @route   GET /api/greenhouses/:id/weather
 * @desc    Get weather data for a greenhouse
 * @access  Public (with optional auth)
 * @query   days - Number of days to look back (default: 7)
 */
router.get('/:id/weather', optionalAuth, async (req, res) => {
  await greenhouseController.getWeatherData(req, res);
});

export default router;