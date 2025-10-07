/**
 * Logger utility for development and production environments
 * In development: logs to console
 * In production: can be extended to send to error tracking service (Sentry, LogRocket, etc.)
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Log informational messages
   */
  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log('[LOG]', ...args);
    }
  }

  /**
   * Log informational messages
   */
  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info('[INFO]', ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn('[WARN]', ...args);
    }
    // In production, you could send to error tracking service
  }

  /**
   * Log error messages
   */
  error(...args: any[]): void {
    if (this.isDevelopment) {
      console.error('[ERROR]', ...args);
    }
    // In production, send to error tracking service (Sentry, etc.)
    // Example: Sentry.captureException(args[0]);
  }

  /**
   * Log debug messages (only in development)
   */
  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * Group logs together
   */
  group(label: string): void {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Log a table (useful for arrays of objects)
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Start a timer
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  /**
   * End a timer
   */
  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
