export declare class CacheService {
    private cache;
    private cleanupInterval;
    constructor();
    set<T>(key: string, data: T, ttlSeconds?: number): void;
    get<T>(key: string): T | null;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getStats(): {
        size: number;
        keys: string[];
        oldestEntry: number | null;
        newestEntry: number | null;
    };
    generatePhytoSenseKey(tdid: number, params: any, aggregation: string): string;
    calculateTTL(startDate: Date, endDate: Date): number;
    private startCleanupInterval;
    private cleanup;
    destroy(): void;
}
export declare const cacheService: CacheService;
//# sourceMappingURL=cache.service.d.ts.map