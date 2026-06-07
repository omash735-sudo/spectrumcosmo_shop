// app/api/admin/risk-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryOne, queryMany } from '@/lib/db';

type RiskAlert = {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  metric?: string;
  value?: number;
};

// Helper to safely parse count from database result
function safeParseCount(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10) || 0;
  return 0;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const alerts: RiskAlert[] = [];

    // 1. Slow API responses (>1 second) in last hour
    const slowCount = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE started_at >= NOW() - INTERVAL '1 hour'
        AND (completed_at - started_at) > INTERVAL '1 second'
    `;
    const slowCountValue = safeParseCount(slowCount?.count);
    if (slowCountValue > 10) {
      alerts.push({
        id: `slow-api-${Date.now()}`,
        type: 'warning',
        message: `${slowCountValue} slow API requests (>1s) in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'api_response_time',
        value: 1.0,
      });
    }

    // 2. High error rate (5xx or 4xx)
    const errorStats = await queryOne<{ errors: string | number; total: string | number }>`
      SELECT 
        COUNT(CASE WHEN status >= 400 THEN 1 END) as errors,
        COUNT(*) as total
      FROM api_logs
      WHERE started_at >= NOW() - INTERVAL '1 hour'
    `;
    const errors = safeParseCount(errorStats?.errors);
    const total = safeParseCount(errorStats?.total) || 1;
    const errorRate = (errors / total) * 100;
    if (errorRate > 10) {
      alerts.push({
        id: `high-error-rate-${Date.now()}`,
        type: 'critical',
        message: `High error rate: ${errorRate.toFixed(1)}% in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        value: errorRate,
      });
    } else if (errorRate > 5) {
      alerts.push({
        id: `elevated-error-rate-${Date.now()}`,
        type: 'warning',
        message: `Elevated error rate: ${errorRate.toFixed(1)}% in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        value: errorRate,
      });
    }

    // 3. Payment gateway failures
    const paymentFailures = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count
      FROM payment_logs
      WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '1 hour'
    `;
    const paymentFailuresCount = safeParseCount(paymentFailures?.count);
    if (paymentFailuresCount > 3) {
      alerts.push({
        id: `payment-failures-${Date.now()}`,
        type: 'critical',
        message: `${paymentFailuresCount} payment gateway failures in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'payment_failures',
        value: paymentFailuresCount,
      });
    }

    // 4. Suspicious failed logins (more than 5 per IP)
    const suspiciousLogins = await queryMany<{ count: string | number; ip_address: string }>`
      SELECT COUNT(*) as count, ip_address
      FROM login_attempts
      WHERE success = false AND attempted_at >= NOW() - INTERVAL '1 hour'
      GROUP BY ip_address
      HAVING COUNT(*) > 5
    `;
    for (const attempt of suspiciousLogins) {
      alerts.push({
        id: `suspicious-logins-${Date.now()}-${attempt.ip_address}`,
        type: 'warning',
        message: `Suspicious activity: ${attempt.count} failed login attempts from ${attempt.ip_address}`,
        timestamp: new Date().toISOString(),
        metric: 'failed_logins',
        value: safeParseCount(attempt.count),
      });
    }

    // 5. Inventory issues (negative stock)
    const inventoryIssues = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock_quantity < 0
    `;
    const inventoryCount = safeParseCount(inventoryIssues?.count);
    if (inventoryCount > 0) {
      alerts.push({
        id: `inventory-issues-${Date.now()}`,
        type: 'critical',
        message: `${inventoryCount} products have negative stock`,
        timestamp: new Date().toISOString(),
        metric: 'inventory',
        value: inventoryCount,
      });
    }

    // 6. Broken routes (404 errors)
    const brokenRoutes = await queryOne<{ count: string | number }>`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE status = 404 AND started_at >= NOW() - INTERVAL '1 hour'
    `;
    const brokenCount = safeParseCount(brokenRoutes?.count);
    if (brokenCount > 5) {
      alerts.push({
        id: `broken-routes-${Date.now()}`,
        type: 'warning',
        message: `${brokenCount} broken routes (404 errors) detected`,
        timestamp: new Date().toISOString(),
        metric: 'broken_routes',
        value: brokenCount,
      });
    }

    return NextResponse.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Risk detection error:', err);
    return NextResponse.json(
      { alerts: [], count: 0, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
