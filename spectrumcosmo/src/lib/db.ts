// lib/db.ts
import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';
import { Pool, neon as neonPg } from '@neondatabase/serverless';

// Types
export type DatabaseClient = NeonQueryFunction<boolean, boolean>;

export interface TransactionCallback<T> {
  (client: DatabaseClient): Promise<T>;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseConfig {
  connectionString: string;
  poolSize?: number;
  connectionTimeoutMs?: number;
  queryTimeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

// Configuration
const DEFAULT_CONFIG: DatabaseConfig = {
  connectionString: process.env.POSTGRES_URL || '',
  poolSize: 10,
  connectionTimeoutMs: 10000,
  queryTimeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
};

// Connection pooling configuration
neonConfig.poolQueryViaFetch = true;
neonConfig.poolDefaultMaxClients = DEFAULT_CONFIG.poolSize;

let sql: DatabaseClient | null = null;
let isConnecting = false;
let connectionError: Error | null = null;

// Validate environment
function validateConfig(): void {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }
}

// Create connection with retry logic
async function createConnection(retries: number = DEFAULT_CONFIG.maxRetries!): Promise<DatabaseClient> {
  validateConfig();
  
  for (let i = 0; i < retries; i++) {
    try {
      const client = neon(process.env.POSTGRES_URL!);
      // Test connection
      await client`SELECT 1 as connected`;
      return client;
    } catch (err) {
      connectionError = err instanceof Error ? err : new Error('Connection failed');
      console.error(`Database connection attempt ${i + 1} failed:`, connectionError.message);
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, DEFAULT_CONFIG.retryDelayMs! * Math.pow(2, i)));
      }
    }
  }
  throw new Error(`Failed to connect to database after ${retries} attempts: ${connectionError?.message}`);
}

// Initialize connection
export async function initDb(): Promise<DatabaseClient> {
  if (sql) return sql;
  
  if (isConnecting) {
    // Wait for existing connection attempt
    await new Promise(resolve => setTimeout(resolve, 100));
    return initDb();
  }
  
  isConnecting = true;
  try {
    sql = await createConnection();
    connectionError = null;
    console.log('Database connected successfully');
    return sql;
  } finally {
    isConnecting = false;
  }
}

// Get database client (lazy initialization)
export function getDb(): DatabaseClient {
  if (!sql) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return sql;
}

// Get database client with auto-initialization (async)
export async function getDbAsync(): Promise<DatabaseClient> {
  if (!sql) {
    await initDb();
  }
  return getDb();
}

// Execute query with timeout
export async function executeQuery<T = any>(
  queryFn: (client: DatabaseClient) => Promise<T[]>,
  timeoutMs: number = DEFAULT_CONFIG.queryTimeoutMs!
): Promise<T[]> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  
  const client = getDb();
  const queryPromise = queryFn(client);
  
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Query failed';
    console.error('Query execution error:', errorMessage);
    throw new Error(errorMessage);
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: TransactionCallback<T>
): Promise<T> {
  const client = getDb();
  
  try {
    await client`BEGIN`;
    const result = await callback(client);
    await client`COMMIT`;
    return result;
  } catch (err) {
    await client`ROLLBACK`;
    const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
    console.error('Transaction error:', errorMessage);
    throw new Error(errorMessage);
  }
}

// Health check
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  latencyMs: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const client = await getDbAsync();
    await client`SELECT 1 as connected`;
    const latencyMs = Date.now() - startTime;
    return { status: 'healthy', latencyMs };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { status: 'unhealthy', latencyMs: Date.now() - startTime, error: errorMessage };
  }
}

// Get connection pool status
export function getPoolStatus(): {
  isConnected: boolean;
  hasError: boolean;
  errorMessage: string | null;
} {
  return {
    isConnected: sql !== null,
    hasError: connectionError !== null,
    errorMessage: connectionError?.message || null,
  };
}

// Close connection (for graceful shutdown)
export async function closeDb(): Promise<void> {
  if (sql && typeof (sql as any).end === 'function') {
    await (sql as any).end();
    console.log('Database connection closed');
  }
  sql = null;
  connectionError = null;
}

// Graceful shutdown handler
export function setupGracefulShutdown(): void {
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, closing database connection...');
    await closeDb();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    console.log('Received SIGINT, closing database connection...');
    await closeDb();
    process.exit(0);
  });
}

// ============================================
// TYPED QUERY HELPERS
// ============================================

export async function queryOne<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T | null> {
  const client = getDb();
  const result = await client(strings, ...values);
  return (result as T[])[0] || null;
}

export async function queryMany<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const client = getDb();
  const result = await client(strings, ...values);
  return result as T[];
}

// With transaction support
export async function queryOneWithTx<T = any>(
  client: DatabaseClient,
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T | null> {
  const result = await client(strings, ...values);
  return (result as T[])[0] || null;
}

export async function queryManyWithTx<T = any>(
  client: DatabaseClient,
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const result = await client(strings, ...values);
  return result as T[];
}
