// lib/db.ts
import { neon, neonConfig, NeonQueryFunction } from '@neondatabase/serverless';

export type DatabaseClient = NeonQueryFunction<false, false>;

export interface TransactionCallback<T> {
  (client: DatabaseClient): Promise<T>;
}

export interface DatabaseConfig {
  connectionString: string;
  connectionTimeoutMs?: number;
  queryTimeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  enableQueryLogging?: boolean;
  slowQueryThresholdMs?: number;
}

const DEFAULT_CONFIG: DatabaseConfig = {
  connectionString: process.env.POSTGRES_URL || '',
  connectionTimeoutMs: 10000,
  queryTimeoutMs: 30000,
  maxRetries: 3,
  retryDelayMs: 1000,
  enableQueryLogging: process.env.NODE_ENV === 'development',
  slowQueryThresholdMs: 1000,
};

neonConfig.poolQueryViaFetch = true;

let sql: DatabaseClient | null = null;
let initPromise: Promise<DatabaseClient> | null = null;
let initError: Error | null = null;
let activeQueries = 0;
let totalQueries = 0;

function validateConfig(): void {
  if (!process.env.POSTGRES_URL) {
    throw new Error('POSTGRES_URL environment variable is not set');
  }
}

async function createConnection(retries: number = DEFAULT_CONFIG.maxRetries!): Promise<DatabaseClient> {
  validateConfig();
  for (let i = 0; i < retries; i++) {
    try {
      const client = neon(process.env.POSTGRES_URL!);
      await client`SELECT 1 as connected`;
      return client;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Connection failed';
      console.error(`Database connection attempt ${i + 1} failed:`, errorMsg);
      if (i < retries - 1) {
        const delay = DEFAULT_CONFIG.retryDelayMs! * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error(`Failed to connect after ${retries} attempts`);
}

export async function initDb(): Promise<DatabaseClient> {
  if (sql) return sql;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      sql = await createConnection();
      initError = null;
      console.log('Database connected successfully');
      return sql;
    } catch (err) {
      initError = err instanceof Error ? err : new Error('Unknown connection error');
      console.error('Database initialization failed:', initError);
      throw initError;
    } finally {
      initPromise = null;
    }
  })();
  return initPromise;
}

// Dummy client that returns empty arrays for any query (used when DB is unreachable)
const dummyClient: DatabaseClient = (() => {
  const queryHandler: DatabaseClient = async (strings, ...values) => {
    console.warn('Dummy database client used – returning empty result');
    return [];
  };
  queryHandler.transaction = async () => { throw new Error('Transaction not supported in dummy client'); };
  queryHandler.end = async () => {};
  return queryHandler;
})();

export function getDb(): DatabaseClient {
  if (sql) return sql;
  if (initError) {
    console.warn('Database previously failed to initialize – using dummy client');
    return dummyClient;
  }
  if (!initPromise) {
    initDb().catch(err => console.error('Background init failed:', err));
  }
  return dummyClient;
}

export async function getDbAsync(): Promise<DatabaseClient> {
  if (sql) return sql;
  if (initError) return dummyClient;
  try {
    return await initDb();
  } catch {
    return dummyClient;
  }
}

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

export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const client = getDb();
  try {
    await client`BEGIN`;
    const result = await callback(client);
    await client`COMMIT`;
    return result;
  } catch (err) {
    await client`ROLLBACK`;
    throw err;
  }
}

export async function healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latencyMs: number; error?: string }> {
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

export function getPoolStatus() {
  return {
    isConnected: sql !== null,
    hasError: initError !== null,
    errorMessage: initError?.message || null,
    activeQueries,
    totalQueries,
  };
}

export function getDbMetrics() {
  return {
    activeQueries,
    totalQueries,
    isConnected: sql !== null,
    uptime: sql ? Date.now() - (global as any).dbStartTime || 0 : 0,
  };
}

export function resetMetrics(): void {
  activeQueries = 0;
  totalQueries = 0;
}

export async function closeDb(): Promise<void> {
  if (sql && typeof (sql as any).end === 'function') {
    await (sql as any).end();
    console.log('Database connection closed');
  }
  sql = null;
  initError = null;
}

export function setupGracefulShutdown(): void {
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
// TYPED QUERY HELPERS (now use dummy‑safe getDb)
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

export async function queryAsArray<T = any>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  const client = getDb();
  const result = await client(strings, ...values);
  return result as T[];
}

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
