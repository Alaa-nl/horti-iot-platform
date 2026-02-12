// PhytoSense API Configuration
// Validates and exports PhytoSense configuration from environment variables

import { logger } from '../utils/logger';

export interface PhytoSenseConfig {
  baseUrl?: string;
  account?: string;
  appKey?: string;
  auth?: {
    username: string;
    password: string;
  };
  timeout: number;
  maxContentLength: number;
  isConfigured: boolean;
}

/**
 * Validates and loads PhytoSense config from environment variables
 * Returns null/default config if variables are missing (PhytoSense is optional)
 * This allows the backend to start without PhytoSense for development/testing
 */
function validateAndLoadConfig(): PhytoSenseConfig {
  const requiredVars = [
    'PHYTOSENSE_BASE_URL',
    'PHYTOSENSE_ACCOUNT',
    'PHYTOSENSE_APP_KEY',
    'PHYTOSENSE_USERNAME',
    'PHYTOSENSE_PASSWORD'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  // If any variables are missing, log warning and return default config
  if (missing.length > 0) {
    logger.warn(
      `PhytoSense not fully configured. Missing: ${missing.join(', ')}. ` +
      'PhytoSense features will be unavailable, but the application will continue to run.'
    );

    // Return config with default values - PhytoSense integration disabled
    const config: PhytoSenseConfig = {
      timeout: parseInt(process.env.PHYTOSENSE_TIMEOUT || '60000'),
      maxContentLength: parseInt(process.env.PHYTOSENSE_MAX_CONTENT_LENGTH || '100000000'),
      isConfigured: false
    };

    return config;
  }

  // If all variables are present, use them
  const config: PhytoSenseConfig = {
    baseUrl: process.env.PHYTOSENSE_BASE_URL!,
    account: process.env.PHYTOSENSE_ACCOUNT!,
    appKey: process.env.PHYTOSENSE_APP_KEY!,
    auth: {
      username: process.env.PHYTOSENSE_USERNAME!,
      password: process.env.PHYTOSENSE_PASSWORD!
    },
    timeout: parseInt(process.env.PHYTOSENSE_TIMEOUT || '60000'),
    maxContentLength: parseInt(process.env.PHYTOSENSE_MAX_CONTENT_LENGTH || '100000000'),
    isConfigured: true
  };

  logger.info('PhytoSense configuration loaded successfully', {
    baseUrl: config.baseUrl,
    account: config.account,
    username: config.auth?.username
  });

  return config;
}

// Export singleton config instance
export const phytoSenseConfig = validateAndLoadConfig();
