import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany, queryOne } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's stats
    const [todayStats] = await queryMany`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= ${today.toISOString()}
        AND status NOT IN ('cancelled', 'declined')
    `;

    // Yesterday's stats (for growth calculation)
    const [yesterdayStats] = await queryMany`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= ${yesterday.toISOString()} 
        AND created_at < ${today.toISOString()}
        AND status NOT IN ('cancelled', 'declined')
    `;

    // Active users today - count unique users who placed orders or visited
    const [activeUsers] = await queryMany`
      SELECT COUNT(DISTINCT user_id) as count
      FROM orders 
      WHERE created_at >= ${today.toISOString()}
        AND user_id IS NOT NULL
    `;

    // Active carts (using user_sessions as proxy since carts table doesn't exist)
    const [activeCartsResult] = await queryMany`
      SELECT COUNT(DISTINCT session_id) as count
      FROM user_sessions 
      WHERE visited_at >= NOW() - INTERVAL '30 minutes'
    `;

    // Failed logins last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const [failedLogins] = await queryMany`
      SELECT COUNT(*) as count
      FROM api_logs 
      WHERE endpoint = '/api/auth/login'
        AND status >= 400
        AND created_at >= ${oneHourAgo.toISOString()}
    `;

    // Average API response time (last 24 hours)
    const [avgResponse] = await queryOne`
      SELECT AVG(response_time_ms) as avg_ms
      FROM api_logs 
      WHERE created_at >= ${today.toISOString()}
        AND response_time_ms IS NOT NULL
    `;

    // Growth calculations (handle division by zero)
    const revenueGrowth = yesterdayStats.revenue > 0 
      ? Number(((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue * 100).toFixed(1))
      : 0;
    
    const ordersGrowth = yesterdayStats.orders > 0 
      ? Number(((todayStats.orders - yesterdayStats.orders) / yesterdayStats.orders * 100).toFixed(1))
      : 0;

    // Cart abandonment rate (using sessions vs orders as proxy)
    const totalSessions = Number(activeCartsResult?.count || 0);
    const totalOrders = Number(todayStats.orders || 0);
    const abandonedRate = totalSessions > 0 && totalOrders > 0 
      ? Math.round(((totalSessions - totalOrders) / totalSessions) * 100)
      : 0;

    return NextResponse.json({
      revenue_today: Number(todayStats.revenue),
      orders_today: Number(todayStats.orders),
      active_users_today: Number(activeUsers?.count || 0),
      abandoned_carts: abandonedRate,
      active_carts: totalSessions,
      failed_payments: 0,
      avg_api_response_ms: Math.round(avgResponse?.avg_ms || 0),
      failed_logins_last_hour: Number(failedLogins?.count || 0),
      revenue_growth: revenueGrowth,
      orders_growth: ordersGrowth,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({
      revenue_today: 0,
      orders_today: 0,
      active_users_today: 0,
      abandoned_carts: 0,
      active_carts: 0,
      failed_payments: 0,
      avg_api_response_ms: 0,
      failed_logins_last_hour: 0,
      revenue_growth: 0,
      orders_growth: 0,
    });
  }
}
