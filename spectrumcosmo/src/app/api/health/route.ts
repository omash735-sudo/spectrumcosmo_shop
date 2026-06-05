// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getDb, healthCheck, getPoolStatus } from '@/lib/db';
import { getQueueHealth } from '@/lib/queue-worker';
import packageJson from '@/package.json';

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

// Get memory usage
function getMemoryUsage(): { used: number; total: number; percentage: number } {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  const total = process.memoryUsage().heapTotal / 1024 / 1024;
  const percentage = Math.round((used / total) * 100);
  return { used: Math.round(used), total: Math.round(total), percentage };
}

// Get uptime in seconds
function getUptime(): number {
  return Math.floor(process.uptime());
}

// Check Cloudinary connectivity
async function checkCloudinary(): Promise<{ status: 'connected' | 'disconnected' | 'not_configured'; latencyMs?: number }> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    return { status: 'not_configured' };
  }
  
  const startTime = Date.now();
  try {
    const response = await fetch(`https://res.cloudinary.com/${cloudName}/image/list`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - startTime;
    return { status: response.ok ? 'connected' : 'disconnected', latencyMs };
  } catch {
    return { status: 'disconnected', latencyMs: Date.now() - startTime };
  }
}

// Check Algolia connectivity
async function checkAlgolia(): Promise<{ status: 'connected' | 'disconnected' | 'not_configured'; latencyMs?: number }> {
  const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
  const apiKey = process.env.ALGOLIA_ADMIN_KEY;
  
  if (!appId || !apiKey) {
    return { status: 'not_configured' };
  }
  
  const startTime = Date.now();
  try {
    const { algoliasearch } = await import('algoliasearch');
    const client = algoliasearch(appId, apiKey);
    await client.getTimeouts();
    const latencyMs = Date.now() - startTime;
    return { status: 'connected', latencyMs };
  } catch {
    return { status: 'disconnected', latencyMs: Date.now() - startTime };
  }
}

export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Database health check
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
    if (dbHealth.status !== 'healthy') {
      overallStatus = 'degraded';
    }
  } catch (err) {
    databaseStatus = { status: 'error' };
    overallStatus = 'degraded';
    console.error('Database health check failed:', err);
  }
  
  // Redis/Queue health check
  let redisStatus: HealthCheckResponse['services']['redis'] = { status: 'unknown', configured: false };
  try {
    const queueHealth = await getQueueHealth();
    redisStatus = {
      status: queueHealth.configured && queueHealth.running ? 'connected' : queueHealth.configured ? 'disconnected' : 'not_configured',
      configured: queueHealth.configured,
    };
    if (queueHealth.configured && !queueHealth.running) {
      overallStatus = 'degraded';
    }
  } catch (err) {
    redisStatus = { status: 'error', configured: false };
    overallStatus = 'degraded';
    console.error('Redis health check failed:', err);
  }
  
  // Algolia health check (optional)
  let algoliaStatus: HealthCheckResponse['services']['algolia'] = { status: 'not_configured' };
  try {
    algoliaStatus = await checkAlgolia();
    if (algoliaStatus.status === 'disconnected') {
      overallStatus = 'degraded';
    }
  } catch (err) {
    console.error('Algolia health check failed:', err);
  }
  
  // Cloudinary health check
  let cloudinaryStatus: HealthCheckResponse['services']['cloudinary'] = { status: 'not_configured' };
  try {
    cloudinaryStatus = await checkCloudinary();
    if (cloudinaryStatus.status === 'disconnected') {
      overallStatus = 'degraded';
    }
  } catch (err) {
    console.error('Cloudinary health check failed:', err);
  }
  
  const response: HealthCheckResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: getUptime(),
    version: packageJson.version || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: databaseStatus,
      redis: redisStatus,
      algolia: algoliaStatus,
      cloudinary: cloudinaryStatus,
    },
    memory: getMemoryUsage(),
  };
  
  const responseTime = Date.now() - startTime;
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 500;
  
  // Add response time header
  const nextResponse = NextResponse.json(response, { status: statusCode });
  nextResponse.headers.set('X-Response-Time', `${responseTime}ms`);
  
  return nextResponse;
}
