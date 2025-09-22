import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class Database {
  private pool: Pool;
  private static instance: Database;

  private constructor() {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'horti_iot',
      user: process.env.DB_USER || 'horti_user',
      password: process.env.DB_PASSWORD || 'horti_password',
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    };

    this.pool = new Pool(config);

    // Handle pool errors
    this.pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    // Handle pool connection
    this.pool.on('connect', (client: PoolClient) => {
      console.log('Database client connected');
    });

    // Handle pool removal
    this.pool.on('remove', (client: PoolClient) => {
      console.log('Database client removed');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: result.rowCount });
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async testConnection(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.query('SELECT NOW()');
      client.release();
      console.log('Database connection successful:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    console.log('Database connection pool closed');
  }
}

// Export singleton instance
export const database = Database.getInstance();
export default database;