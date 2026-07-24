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
let activeQueries = 0;
let totalQueries = 0;

export function getDb(): DatabaseClient {
  if (!sql) {
    if (!process.env.POSTGRES_URL) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }
    sql = neon(process.env.POSTGRES_URL);
  }
  return sql;
}

export async function getDbAsync(): Promise<DatabaseClient> {
  return getDb();
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
    const client = getDb();
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
    hasError: false,
    errorMessage: null,
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
  sql = null;
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
