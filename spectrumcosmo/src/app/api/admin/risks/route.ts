import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

type RiskAlert = {
  id: string
  type: 'critical' | 'warning' | 'info'
  message: string
  timestamp: string
  metric?: string
  value?: number
}

export async function GET(req: Request) {
  const authError = requireAdmin(req as any)
  if (authError) return authError

  try {
    const sql = getDb()
    const alerts: RiskAlert[] = []

    // Check for slow API responses
    const slowApis = await sql`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE started_at >= NOW() - INTERVAL '1 hour'
        AND (completed_at - started_at) > INTERVAL '1 second'
    `
    if (parseInt(slowApis[0]?.count || '0') > 10) {
      alerts.push({
        id: `slow-api-${Date.now()}`,
        type: 'warning',
        message: `${slowApis[0].count} slow API requests (>1s) in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'api_response_time',
        value: 1.0
      })
    }

    // Check for high error rate
    const errors = await sql`
      SELECT 
        COUNT(CASE WHEN status >= 400 THEN 1 END) as errors,
        COUNT(*) as total
      FROM api_logs
      WHERE started_at >= NOW() - INTERVAL '1 hour'
    `
    const errorRate = (parseInt(errors[0]?.errors || '0') / parseInt(errors[0]?.total || '1')) * 100
    if (errorRate > 10) {
      alerts.push({
        id: `high-error-rate-${Date.now()}`,
        type: 'critical',
        message: `High error rate: ${errorRate.toFixed(1)}% in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        value: errorRate
      })
    } else if (errorRate > 5) {
      alerts.push({
        id: `elevated-error-rate-${Date.now()}`,
        type: 'warning',
        message: `Elevated error rate: ${errorRate.toFixed(1)}% in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'error_rate',
        value: errorRate
      })
    }

    // Check for payment gateway failures
    const paymentFailures = await sql`
      SELECT COUNT(*) as count
      FROM payment_logs
      WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '1 hour'
    `
    if (parseInt(paymentFailures[0]?.count || '0') > 3) {
      alerts.push({
        id: `payment-failures-${Date.now()}`,
        type: 'critical',
        message: `${paymentFailures[0].count} payment gateway failures in last hour`,
        timestamp: new Date().toISOString(),
        metric: 'payment_failures',
        value: parseInt(paymentFailures[0]?.count || '0')
      })
    }

    // Check for suspicious activity (multiple failed logins)
    const failedLogins = await sql`
      SELECT COUNT(*) as count, ip_address
      FROM login_attempts
      WHERE success = false AND attempted_at >= NOW() - INTERVAL '1 hour'
      GROUP BY ip_address
      HAVING COUNT(*) > 5
    `
    for (const attempt of failedLogins) {
      alerts.push({
        id: `suspicious-logins-${Date.now()}-${attempt.ip_address}`,
        type: 'warning',
        message: `Suspicious activity: ${attempt.count} failed login attempts from ${attempt.ip_address}`,
        timestamp: new Date().toISOString(),
        metric: 'failed_logins',
        value: attempt.count
      })
    }

    // Check for inventory sync issues
    const inventoryIssues = await sql`
      SELECT COUNT(*) as count
      FROM products
      WHERE stock_quantity < 0
    `
    if (parseInt(inventoryIssues[0]?.count || '0') > 0) {
      alerts.push({
        id: `inventory-issues-${Date.now()}`,
        type: 'critical',
        message: `${inventoryIssues[0].count} products have negative stock`,
        timestamp: new Date().toISOString(),
        metric: 'inventory',
        value: parseInt(inventoryIssues[0]?.count || '0')
      })
    }

    // Check for broken routes (404s)
    const brokenRoutes = await sql`
      SELECT COUNT(*) as count
      FROM api_logs
      WHERE status = 404 AND started_at >= NOW() - INTERVAL '1 hour'
    `
    if (parseInt(brokenRoutes[0]?.count || '0') > 5) {
      alerts.push({
        id: `broken-routes-${Date.now()}`,
        type: 'warning',
        message: `${brokenRoutes[0].count} broken routes (404 errors) detected`,
        timestamp: new Date().toISOString(),
        metric: 'broken_routes',
        value: parseInt(brokenRoutes[0]?.count || '0')
      })
    }

    return NextResponse.json({
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Risk detection error:', err)
    return NextResponse.json({ alerts: [], count: 0, timestamp: new Date().toISOString() })
  }
}
