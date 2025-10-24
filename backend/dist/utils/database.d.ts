import { Pool, PoolClient } from 'pg';
declare class Database {
    private pool;
    private static instance;
    private constructor();
    static getInstance(): Database;
    getPool(): Pool;
    query(text: string, params?: any[]): Promise<any>;
    getClient(): Promise<PoolClient>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
}
export declare const database: Database;
export default database;
//# sourceMappingURL=database.d.ts.map