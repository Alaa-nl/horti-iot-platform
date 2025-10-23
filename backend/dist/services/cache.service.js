"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = exports.CacheService = void 0;
const logger_1 = require("../utils/logger");
class CacheService {
    constructor() {
        this.cache = new Map();
        this.cleanupInterval = null;
        this.startCleanupInterval();
    }
    set(key, data, ttlSeconds = 3600) {
        const entry = {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds * 1000
        };
        this.cache.set(key, entry);
        logger_1.logger.debug('Cache set', { key, ttl: ttlSeconds });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            logger_1.logger.debug('Cache miss', { key });
            return null;
        }
        const now = Date.now();
        const age = now - entry.timestamp;
        if (age > entry.ttl) {
            this.cache.delete(key);
            logger_1.logger.debug('Cache expired', { key, age: age / 1000 });
            return null;
        }
        logger_1.logger.debug('Cache hit', { key, age: age / 1000 });
        return entry.data;
    }
    has(key) {
        return this.get(key) !== null;
    }
    delete(key) {
        const deleted = this.cache.delete(key);
        if (deleted) {
            logger_1.logger.debug('Cache delete', { key });
        }
        return deleted;
    }
    clear() {
        const size = this.cache.size;
        this.cache.clear();
        logger_1.logger.info('Cache cleared', { entriesRemoved: size });
    }
    getStats() {
        const keys = Array.from(this.cache.keys());
        const timestamps = Array.from(this.cache.values()).map(entry => entry.timestamp);
        return {
            size: this.cache.size,
            keys,
            oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : null,
            newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : null
        };
    }
    generatePhytoSenseKey(tdid, params, aggregation) {
        const paramString = Object.entries(params)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
        return `phytosense:${tdid}:${aggregation}:${paramString}`;
    }
    calculateTTL(startDate, endDate) {
        const now = new Date();
        const daysSinceEnd = (now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEnd > 7) {
            return 86400;
        }
        if (daysSinceEnd > 1) {
            return 3600;
        }
        return 300;
    }
    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 300000);
    }
    cleanup() {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
                this.cache.delete(key);
                removed++;
            }
        }
        if (removed > 0) {
            logger_1.logger.info('Cache cleanup completed', {
                entriesRemoved: removed,
                remainingEntries: this.cache.size
            });
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clear();
        logger_1.logger.info('Cache service destroyed');
    }
}
exports.CacheService = CacheService;
exports.cacheService = new CacheService();
//# sourceMappingURL=cache.service.js.map