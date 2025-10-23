// Simple Logger Utility
// Provides structured logging for the application

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

class Logger {
  private level: LogLevel;

  constructor() {
    // Set log level based on environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case 'DEBUG':
        this.level = LogLevel.DEBUG;
        break;
      case 'WARN':
        this.level = LogLevel.WARN;
        break;
      case 'ERROR':
        this.level = LogLevel.ERROR;
        break;
      default:
        this.level = LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    if (process.env.NODE_ENV === 'development') {
      // Pretty print in development
      return `[${timestamp}] ${level}: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
    }

    // JSON format in production
    return JSON.stringify(logEntry);
  }

  debug(message: string, data?: any): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message: string, data?: any): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message, data));
    }
  }

  warn(message: string, data?: any): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message: string, data?: any): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }
}

export const logger = new Logger();