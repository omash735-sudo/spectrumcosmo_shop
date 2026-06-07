// lib/db.ts
import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';

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
  enableQueryLogging?: boolean;
  slowQueryThresholdMs?: number;
}

// Configuration
const DEFAULT_CONFIG: DatabaseConfig = {
  connectionString: process.env.POSTGRES_URL || '',
  poolSize: 10,
  connectionTimeoutMs: 10000,
  queryTimeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableQueryLogging: process.env.NODE_ENV === 'development',
  slowQueryThresholdMs: 1000,
};

// Connection pooling configuration
neonConfig.poolQueryViaFetch = true;
neonConfig.poolDefaultMaxClients = DEFAULT_CONFIG.poolSize;

let sql: DatabaseClient | null = null;
let isConnecting = false;
let connectionError: Error | null = null;
let activeQueries = 0;
let totalQueries = 0;

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
        const delay = DEFAULT_CONFIG.retryDelayMs! * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed to connect to database after ${retries} attempts: ${connectionError?.message}`);
}

// Initialize connection
export async function initDb(): Promise<DatabaseClient> {
  if (sql) return sql;
  
  if (isConnecting) {
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

// Execute query with timeout and logging
export async function executeQuery<T = any>(
  queryFn: (client: DatabaseClient) => Promise<T[]>,
  timeoutMs: number = DEFAULT_CONFIG.queryTimeoutMs!
): Promise<T[]> {
  const startTime = Date.now();
  activeQueries++;
  totalQueries++;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Query timeout after ${timeoutMs}ms`)), timeoutMs);
  });
  
  const client = getDb();
  const queryPromise = queryFn(client);
  
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    const duration = Date.now() - startTime;
    
    if (DEFAULT_CONFIG.enableQueryLogging && duration > (DEFAULT_CONFIG.slowQueryThresholdMs || 1000)) {
      console.warn(`Slow query detected: ${duration}ms`);
    }
    
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Query failed';
    console.error('Query execution error:', errorMessage);
    throw new Error(errorMessage);
  } finally {
    activeQueries--;
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
  activeQueries: number;
  totalQueries: number;
} {
  return {
    isConnected: sql !== null,
    hasError: connectionError !== null,
    errorMessage: connectionError?.message || null,
    activeQueries,
    totalQueries,
  };
}

// Get database metrics
export function getDbMetrics() {
  return {
    activeQueries,
    totalQueries,
    isConnected: sql !== null,
    uptime: sql ? Date.now() - (global as any).dbStartTime || 0 : 0,
  };
}

// Reset metrics (for testing)
export function resetMetrics(): void {
  activeQueries = 0;
  totalQueries = 0;
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
  // Store start time
  (global as any).dbStartTime = Date.now();
  
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
  const startTime = Date.now();
  const client = getDb();
  const result = await client(strings, ...values);
  
  if (DEFAULT_CONFIG.enableQueryLogging) {
    const duration = Date.now() - startTime;
    if (duration > (DEFAULT_CONFIG.slowQueryThresholdMs || 1000)) {
      console.warn(`Slow queryOne detected: ${duration}ms`);
    }
  }
  
  return (result as T[])[0] || null;
}

export async function queryMany<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const startTime = Date.now();
  const client = getDb();
  const result = await client(strings, ...values);
  
  if (DEFAULT_CONFIG.enableQueryLogging) {
    const duration = Date.now() - startTime;
    if (duration > (DEFAULT_CONFIG.slowQueryThresholdMs || 1000)) {
      console.warn(`Slow queryMany detected: ${duration}ms, returned ${(result as T[]).length} rows`);
    }
  }
  
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

// NEW: queryAsArray - returns a properly typed array (works around Neon's union type)
export async function queryAsArray<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const client = getDb();
  const result = await client(strings, ...values);
  return result as T[];
}

// Batch query helper
export async function batchQuery<T = any>(
  queries: Array<{ strings: TemplateStringsArray; values: any[] }>
): Promise<T[][]> {
  const client = getDb();
  const results: T[][] = [];
  
  for (const query of queries) {
    const result = await client(query.strings, ...query.values);
    results.push(result as T[]);
  }
  
  return results;
}
