"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const PHYTOSENSE_CONFIG = {
    baseUrl: 'https://www.phytosense.net/PhytoSense/v1',
    account: 'Pebble',
    appKey: 'e8d9e660e023afc3bb3a03f9a59e8213',
    auth: {
        username: 'aaldrobe',
        password: 'u4E4Zb100a8v'
    }
};
router.get('/data/:dtid', auth_1.authenticateToken, async (req, res) => {
    try {
        const { dtid } = req.params;
        const queryParams = req.query;
        const url = `${PHYTOSENSE_CONFIG.baseUrl}/${PHYTOSENSE_CONFIG.account}/DeviceTransformation/${dtid}`;
        const params = {
            app_key: PHYTOSENSE_CONFIG.appKey,
            ...queryParams
        };
        console.log('Proxying PhytoSense request to:', url, 'with params:', params);
        const response = await axios_1.default.get(url, {
            params,
            auth: {
                username: PHYTOSENSE_CONFIG.auth.username,
                password: PHYTOSENSE_CONFIG.auth.password
            },
            headers: {
                'Accept': 'application/xml, text/xml',
                'User-Agent': 'HORTI-IOT-Platform/1.0'
            },
            timeout: 30000
        });
        res.set('Content-Type', 'application/xml');
        res.send(response.data);
    }
    catch (error) {
        console.error('PhytoSense proxy error:', error.message);
        if (error.response) {
            res.status(error.response.status).json({
                success: false,
                message: `PhytoSense API error: ${error.response.statusText}`,
                error: error.response.data
            });
        }
        else if (error.request) {
            res.status(503).json({
                success: false,
                message: 'PhytoSense API is unreachable',
                error: 'No response from PhytoSense API'
            });
        }
        else {
            res.status(500).json({
                success: false,
                message: 'Failed to proxy PhytoSense request',
                error: error.message
            });
        }
    }
});
router.get('/devices', auth_1.authenticateToken, async (req, res) => {
    try {
        const devices = [
            {
                setupId: 1324,
                name: 'Stem051 - NL 2022 MKB Raak',
                fromDate: '2022-10-19T00:00:00',
                toDate: '2023-06-01T09:42:23',
                diameterTDID: 33385,
                diameterChannelId: 0,
                sapFlowTDID: 33387,
                sapFlowChannelId: 0,
                cropType: 'General'
            },
            {
                setupId: 1324,
                name: 'Stem127 - NL 2022 MKB Raak',
                fromDate: '2022-10-19T00:00:00',
                toDate: '2023-06-01T09:42:23',
                diameterTDID: 33386,
                diameterChannelId: 0,
                sapFlowTDID: 33388,
                sapFlowChannelId: 0,
                cropType: 'General'
            },
            {
                setupId: 1445,
                name: 'Stem051 - NL 2023 Tomato',
                fromDate: '2023-06-23T00:00:00',
                toDate: '2023-08-25T13:30:00',
                diameterTDID: 38210,
                diameterChannelId: 0,
                sapFlowTDID: 39916,
                sapFlowChannelId: 0,
                cropType: 'Tomato'
            },
            {
                setupId: 1445,
                name: 'Stem136 - NL 2023 Tomato',
                fromDate: '2023-06-23T00:00:00',
                toDate: '2023-08-25T13:30:00',
                diameterTDID: 38211,
                diameterChannelId: 0,
                sapFlowTDID: 39915,
                sapFlowChannelId: 0,
                cropType: 'Tomato'
            },
            {
                setupId: 1445,
                name: 'Stem051 - NL 2023 Cucumber',
                fromDate: '2023-08-25T13:30:00',
                toDate: '2023-10-20T00:00:00',
                diameterTDID: 38210,
                diameterChannelId: 0,
                sapFlowTDID: 39916,
                sapFlowChannelId: 0,
                cropType: 'Cucumber'
            },
            {
                setupId: 1445,
                name: 'Stem136 - NL 2023 Cucumber',
                fromDate: '2023-08-25T13:30:00',
                toDate: '2023-10-20T00:00:00',
                diameterTDID: 38211,
                diameterChannelId: 0,
                sapFlowTDID: 39915,
                sapFlowChannelId: 0,
                cropType: 'Cucumber'
            },
            {
                setupId: 1508,
                name: 'Stem051 - NL 2023-2024 MKB Raak',
                fromDate: '2023-11-01T00:00:00',
                toDate: '2024-10-15T12:00:00',
                diameterTDID: 39999,
                diameterChannelId: 0,
                sapFlowTDID: 39987,
                sapFlowChannelId: 0,
                cropType: 'General'
            },
            {
                setupId: 1508,
                name: 'Stem136 - NL 2023-2024 MKB Raak',
                fromDate: '2023-11-01T00:00:00',
                toDate: '2024-10-15T12:00:00',
                diameterTDID: 40007,
                diameterChannelId: 0,
                sapFlowTDID: 39981,
                sapFlowChannelId: 0,
                cropType: 'General'
            }
        ];
        res.json({
            success: true,
            data: devices
        });
    }
    catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch devices',
            error: error.message
        });
    }
});
router.get('/health', async (req, res) => {
    res.json({
        success: true,
        message: 'PhytoSense proxy is running',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=phytosense.routes.js.map