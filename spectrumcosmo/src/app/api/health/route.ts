// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getQueueHealth } from '@/lib/queue-worker';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  try {
    const sql = getDb();
    await sql`SELECT 1`;
    health.services.database = 'connected';
  } catch {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  try {
    const queueHealth = await getQueueHealth();
    health.services.redis = queueHealth.configured ? 'connected' : 'not configured';
    if (queueHealth.configured && !queueHealth.running) {
      health.status = 'degraded';
    }
  } catch {
    health.services.redis = 'error';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
