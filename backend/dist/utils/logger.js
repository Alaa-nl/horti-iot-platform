"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
class Logger {
    constructor() {
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
    formatMessage(level, message, data) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...(data && { data })
        };
        if (process.env.NODE_ENV === 'development') {
            return `[${timestamp}] ${level}: ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}`;
        }
        return JSON.stringify(logEntry);
    }
    debug(message, data) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message, data));
        }
    }
    info(message, data) {
        if (this.level <= LogLevel.INFO) {
            console.log(this.formatMessage('INFO', message, data));
        }
    }
    warn(message, data) {
        if (this.level <= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', message, data));
        }
    }
    error(message, data) {
        if (this.level <= LogLevel.ERROR) {
            console.error(this.formatMessage('ERROR', message, data));
        }
    }
}
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map