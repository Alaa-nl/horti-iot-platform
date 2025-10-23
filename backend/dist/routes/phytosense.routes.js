"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const security_1 = require("../middleware/security");
const phytosense_service_1 = require("../services/phytosense.service");
const cache_service_1 = require("../services/cache.service");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
router.get('/data/:dtid', auth_1.authenticateToken, security_1.phytoSenseRateLimit, async (req, res) => {
    try {
        const { dtid } = req.params;
        const { aggregation, ...queryParams } = req.query;
        if (!queryParams.setup_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameter: setup_id'
            });
        }
        const params = {
            setup_id: parseInt(queryParams.setup_id),
            channel: parseInt(queryParams.channel) || 0,
            after: queryParams.after,
            before: queryParams.before,
            from: queryParams.from,
            till: queryParams.till
        };
        const aggregationMode = aggregation || 'raw';
        logger_1.logger.info('PhytoSense data request', {
            dtid,
            params,
            aggregation: aggregationMode,
            user: req.user?.email
        });
        const result = await phytosense_service_1.phytoSenseService.fetchData(parseInt(dtid), params, aggregationMode);
        res.json(result);
        return;
    }
    catch (error) {
        logger_1.logger.error('PhytoSense route error', {
            error: error.message,
            stack: error.stack
        });
        if (error.status) {
            res.status(error.status).json({
                success: false,
                message: error.message,
                error: error.error
            });
            return;
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
            return;
        }
    }
});
router.get('/devices', auth_1.authenticateToken, async (req, res) => {
    try {
        const devices = await phytosense_service_1.phytoSenseService.getDevices();
        logger_1.logger.info('PhytoSense devices requested', {
            user: req.user?.email
        });
        res.json({
            success: true,
            data: devices
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching devices', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch devices',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const health = await phytosense_service_1.phytoSenseService.healthCheck();
        const statusCode = health.status === 'healthy' ? 200 : 503;
        res.status(statusCode).json({
            success: health.status === 'healthy',
            ...health,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        logger_1.logger.error('Health check error', {
            error: error.message
        });
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            message: 'Health check failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/aggregate-suggestion', auth_1.authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: startDate, endDate'
            });
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format'
            });
        }
        const suggestion = phytosense_service_1.phytoSenseService.calculateOptimalAggregation(start, end);
        res.json({
            success: true,
            suggestion,
            dateRange: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
                days: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Aggregation suggestion error', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to calculate aggregation suggestion',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.get('/cache/stats', auth_1.authenticateToken, async (req, res) => {
    try {
        const stats = cache_service_1.cacheService.getStats();
        res.json({
            success: true,
            stats
        });
    }
    catch (error) {
        logger_1.logger.error('Cache stats error', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cache statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
router.delete('/cache', auth_1.authenticateToken, async (req, res) => {
    try {
        cache_service_1.cacheService.clear();
        res.json({
            success: true,
            message: 'Cache cleared successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Cache clear error', {
            error: error.message
        });
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});
exports.default = router;
//# sourceMappingURL=phytosense.routes.js.map