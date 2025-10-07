/**
 * Environment Variables Validation
 * Ensures all required environment variables are present at runtime
 */

import { logger } from '../utils/logger';

interface EnvConfig {
  apiUrl: string;
  mlServiceUrl: string;
  openWeatherApiKey?: string;
  knmiApiKey?: string;
  defaultWeatherLocation?: string;
  nodeEnv: string;
}

/**
 * List of required environment variables
 */
const requiredEnvVars = [
  'REACT_APP_API_URL',
];

/**
 * List of optional environment variables with defaults
 */
const optionalEnvVars: Record<string, string> = {
  'REACT_APP_ML_SERVICE_URL': 'http://localhost:8000',
  'REACT_APP_DEFAULT_WEATHER_LOCATION': 'Naaldwijk',
  'NODE_ENV': 'development',
};

/**
 * Validate that all required environment variables are present
 */
function validateEnvVars(): void {
  const missingVars: string[] = [];

  requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('✅ All required environment variables are present');
}

/**
 * Get environment configuration with validation
 */
export function getEnvConfig(): EnvConfig {
  // Validate required vars
  validateEnvVars();

  return {
    apiUrl: process.env.REACT_APP_API_URL!,
    mlServiceUrl: process.env.REACT_APP_ML_SERVICE_URL || optionalEnvVars['REACT_APP_ML_SERVICE_URL'],
    openWeatherApiKey: process.env.REACT_APP_OPENWEATHER_API_KEY,
    knmiApiKey: process.env.REACT_APP_KNMI_API_KEY,
    defaultWeatherLocation: process.env.REACT_APP_DEFAULT_WEATHER_LOCATION || optionalEnvVars['REACT_APP_DEFAULT_WEATHER_LOCATION'],
    nodeEnv: process.env.NODE_ENV || optionalEnvVars['NODE_ENV'],
  };
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Validate on module load
validateEnvVars();

// Export validated config
export const envConfig = getEnvConfig();

export default envConfig;
