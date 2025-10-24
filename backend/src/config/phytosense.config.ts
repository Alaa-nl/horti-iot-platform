// PhytoSense API Configuration
// Validates and exports PhytoSense configuration from environment variables

import { logger } from '../utils/logger';

export interface PhytoSenseConfig {
  baseUrl: string;
  account: string;
  appKey: string;
  auth: {
    username: string;
    password: string;
  };
  timeout: number;
  maxContentLength: number;
}

/**
 * Validates required environment variables and returns config
 * Throws error if required variables are missing
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

  if (missing.length > 0) {
    const error = `Missing required PhytoSense environment variables: ${missing.join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }

  const config: PhytoSenseConfig = {
    baseUrl: process.env.PHYTOSENSE_BASE_URL!,
    account: process.env.PHYTOSENSE_ACCOUNT!,
    appKey: process.env.PHYTOSENSE_APP_KEY!,
    auth: {
      username: process.env.PHYTOSENSE_USERNAME!,
      password: process.env.PHYTOSENSE_PASSWORD!
    },
    timeout: parseInt(process.env.PHYTOSENSE_TIMEOUT || '60000'),
    maxContentLength: parseInt(process.env.PHYTOSENSE_MAX_CONTENT_LENGTH || '100000000')
  };

  logger.info('PhytoSense configuration loaded successfully', {
    baseUrl: config.baseUrl,
    account: config.account,
    username: config.auth.username
  });

  return config;
}

// Export singleton config instance
export const phytoSenseConfig = validateAndLoadConfig();
