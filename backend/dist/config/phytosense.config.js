"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phytoSenseConfig = void 0;
const logger_1 = require("../utils/logger");
function validateAndLoadConfig() {
    const requiredVars = [
        'PHYTOSENSE_BASE_URL',
        'PHYTOSENSE_ACCOUNT',
        'PHYTOSENSE_APP_KEY',
        'PHYTOSENSE_USERNAME',
        'PHYTOSENSE_PASSWORD'
    ];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
        const error = `Missing required PhytoSense environment variables: ${missing.join(', ')}`;
        logger_1.logger.error(error);
        throw new Error(error);
    }
    const config = {
        baseUrl: process.env.PHYTOSENSE_BASE_URL,
        account: process.env.PHYTOSENSE_ACCOUNT,
        appKey: process.env.PHYTOSENSE_APP_KEY,
        auth: {
            username: process.env.PHYTOSENSE_USERNAME,
            password: process.env.PHYTOSENSE_PASSWORD
        },
        timeout: parseInt(process.env.PHYTOSENSE_TIMEOUT || '60000'),
        maxContentLength: parseInt(process.env.PHYTOSENSE_MAX_CONTENT_LENGTH || '100000000')
    };
    logger_1.logger.info('PhytoSense configuration loaded successfully', {
        baseUrl: config.baseUrl,
        account: config.account,
        username: config.auth.username
    });
    return config;
}
exports.phytoSenseConfig = validateAndLoadConfig();
//# sourceMappingURL=phytosense.config.js.map