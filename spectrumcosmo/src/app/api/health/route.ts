// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getDb, healthCheck, getPoolStatus } from '@/lib/db';
import { getQueueHealth } from '@/lib/queue-worker';

// Types
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'connected' | 'disconnected' | 'error';
      latencyMs?: number;
      poolSize?: number;
      activeConnections?: number;
    };
    redis: {
      status: 'connected' | 'disconnected' | 'not_configured' | 'error';
      configured: boolean;
      latencyMs?: number;
    };
    algolia?: {
      status: 'connected' | 'disconnected' | 'not_configured';
      latencyMs?: number;
    };
    cloudinary?: {
      status: 'connected' | 'disconnected' | 'not_configured';
    };
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

function getMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const total = process.memoryUsage().heapTotal / 1024 / 1024;
  const percentage = Math.round((used / total) * 100);
  return { used: Math.round(used), total: Math.round(total), percentage };
}

function getUptime(): number {
  return Math.floor(process.uptime());
}

async function checkCloudinary() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return { status: 'not_configured' as const };
  const startTime = Date.now();
  try {
    const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/list`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - startTime;
    return { status: response.ok ? ('connected' as const) : ('disconnected' as const), latencyMs };
  } catch {
    return { status: 'disconnected' as const, latencyMs: Date.now() - startTime };
  }
}

async function checkAlgolia() {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_ADMIN_KEY;
  if (!appId || !apiKey) return { status: 'not_configured' as const };
  const startTime = Date.now();
  try {
    const algoliasearchModule = await import('algoliasearch');
    const algoliasearch = algoliasearchModule.default;
    const client = algoliasearch(appId, apiKey);
    const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'products');
    await index.getSettings(); // light connectivity check
    const latencyMs = Date.now() - startTime;
    return { status: 'connected' as const, latencyMs };
  } catch {
    return { status: 'disconnected' as const, latencyMs: Date.now() - startTime };
  }
}

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Database health
  let databaseStatus: HealthCheckResponse['services']['database'] = { status: 'unknown' };
  try {
    const dbHealth = await healthCheck();
    const poolStatus = getPoolStatus();
    databaseStatus = {
      status: dbHealth.status === 'healthy' ? 'connected' : 'disconnected',
      latencyMs: dbHealth.latencyMs,
      poolSize: 10,
      activeConnections: poolStatus.isConnected ? 1 : 0,
    };
    if (dbHealth.status !== 'healthy') overallStatus = 'degraded';
  } catch {
    databaseStatus = { status: 'error' };
    overallStatus = 'degraded';
  }

  // Redis / Queue health
  let redisStatus: HealthCheckResponse['services']['redis'] = { status: 'unknown', configured: false };
  try {
    const queueHealth = await getQueueHealth();
    redisStatus = {
      status: queueHealth.configured && queueHealth.running ? 'connected' : queueHealth.configured ? 'disconnected' : 'not_configured',
      configured: queueHealth.configured,
    };
    if (queueHealth.configured && !queueHealth.running) overallStatus = 'degraded';
  } catch {
    redisStatus = { status: 'error', configured: false };
    overallStatus = 'degraded';
  }

  // Algolia health
  let algoliaStatus: HealthCheckResponse['services']['algolia'] = { status: 'not_configured' };
  try {
    algoliaStatus = await checkAlgolia();
    if (algoliaStatus.status === 'disconnected') overallStatus = 'degraded';
  } catch {
    // ignore
  }

  // Cloudinary health
  let cloudinaryStatus: HealthCheckResponse['services']['cloudinary'] = { status: 'not_configured' };
  try {
    cloudinaryStatus = await checkCloudinary();
    if (cloudinaryStatus.status === 'disconnected') overallStatus = 'degraded';
  } catch {
    // ignore
  }

  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: databaseStatus,
      redis: redisStatus,
      algolia: algoliaStatus,
      cloudinary: cloudinaryStatus,
    },
    memory: getMemoryUsage(),
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 500;
  const nextResponse = NextResponse.json(response, { status: statusCode });
  nextResponse.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
  return nextResponse;
}
