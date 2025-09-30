"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const greenhouseController_1 = require("../controllers/greenhouseController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const security_1 = require("../middleware/security");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const greenhouseController = new greenhouseController_1.GreenhouseController();
router.use(security_1.sanitizeRequestBody);
router.use(security_1.generalApiRateLimit);
const createGreenhouseSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(255).required(),
    location: joi_1.default.string().min(2).max(255).required(),
    dimensions: joi_1.default.object().optional(),
    area_m2: joi_1.default.number().positive().optional(),
    crop_type: joi_1.default.string().max(100).optional(),
    variety: joi_1.default.string().max(100).optional(),
    rootstock: joi_1.default.string().max(100).optional(),
    planting_date: joi_1.default.date().optional(),
    supplier: joi_1.default.string().max(255).optional(),
    substrate_info: joi_1.default.string().max(500).optional(),
    climate_system: joi_1.default.string().max(255).optional(),
    lighting_system: joi_1.default.string().max(255).optional(),
    growing_system: joi_1.default.string().max(255).optional(),
    co2_target_ppm: joi_1.default.number().positive().optional(),
    temperature_range_c: joi_1.default.string().max(50).optional(),
    configuration: joi_1.default.object().optional()
});
const updateGreenhouseSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(255).optional(),
    location: joi_1.default.string().min(2).max(255).optional(),
    dimensions: joi_1.default.object().optional(),
    area_m2: joi_1.default.number().positive().optional(),
    crop_type: joi_1.default.string().max(100).optional(),
    variety: joi_1.default.string().max(100).optional(),
    rootstock: joi_1.default.string().max(100).optional(),
    planting_date: joi_1.default.date().optional(),
    supplier: joi_1.default.string().max(255).optional(),
    substrate_info: joi_1.default.string().max(500).optional(),
    climate_system: joi_1.default.string().max(255).optional(),
    lighting_system: joi_1.default.string().max(255).optional(),
    growing_system: joi_1.default.string().max(255).optional(),
    co2_target_ppm: joi_1.default.number().positive().optional(),
    temperature_range_c: joi_1.default.string().max(50).optional(),
    configuration: joi_1.default.object().optional()
});
router.get('/', auth_1.optionalAuth, async (req, res) => {
    await greenhouseController.getAllGreenhouses(req, res);
});
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    await greenhouseController.getGreenhouseById(req, res);
});
router.get('/:id/sensors', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['admin', 'researcher', 'grower']), async (req, res) => {
    await greenhouseController.getGreenhouseSensors(req, res);
});
router.get('/:id/readings', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['admin', 'researcher', 'grower']), async (req, res) => {
    await greenhouseController.getLatestSensorReadings(req, res);
});
router.get('/:id/weather', auth_1.optionalAuth, async (req, res) => {
    await greenhouseController.getWeatherData(req, res);
});
router.post('/', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['admin', 'researcher']), (0, validation_1.validateRequest)(createGreenhouseSchema), async (req, res) => {
    await greenhouseController.createGreenhouse(req, res);
});
router.put('/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['admin', 'researcher']), (0, validation_1.validateRequest)(updateGreenhouseSchema), async (req, res) => {
    await greenhouseController.updateGreenhouse(req, res);
});
router.delete('/:id', auth_1.authenticateToken, (0, auth_1.authorizeRole)(['admin']), async (req, res) => {
    await greenhouseController.deleteGreenhouse(req, res);
});
exports.default = router;
//# sourceMappingURL=greenhouse.js.map