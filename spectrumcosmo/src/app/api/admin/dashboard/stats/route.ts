import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    
    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [todayStats] = await sql`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= ${today.toISOString()}
        AND status NOT IN ('cancelled', 'declined')
    `;

    // Yesterday's stats for growth
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const [yesterdayStats] = await sql`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at >= ${yesterday.toISOString()} 
        AND created_at < ${today.toISOString()}
        AND status NOT IN ('cancelled', 'declined')
    `;

    // Lifetime stats (NEW)
    const [lifetimeStats] = await sql`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(*) as orders,
        COALESCE(AVG(total_amount), 0) as avg_order
      FROM orders 
      WHERE status NOT IN ('cancelled', 'declined')
    `;

    // Unique visitors today (NEW)
    const [uniqueVisitors] = await sql`
      SELECT COUNT(DISTINCT session_id) as count
      FROM analytics_events
      WHERE event_type = 'page_view'
        AND created_at >= ${today.toISOString()}
    `;

    // Active users today
    const [activeUsers] = await sql`
      SELECT COUNT(DISTINCT user_id) as count
      FROM orders 
      WHERE created_at >= ${today.toISOString()}
        AND user_id IS NOT NULL
    `;

    // Active carts (30 min window)
    const [activeCarts] = await sql`
      SELECT COUNT(DISTINCT session_id) as count
      FROM user_sessions 
      WHERE visited_at >= NOW() - INTERVAL '30 minutes'
    `;

    // Failed logins last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const [failedLogins] = await sql`
      SELECT COUNT(*) as count
      FROM api_logs 
      WHERE endpoint = '/api/auth/login'
        AND status >= 400
        AND created_at >= ${oneHourAgo.toISOString()}
    `;

    // Avg API response time
    const [avgResponse] = await sql`
      SELECT AVG(response_time_ms) as avg_ms
      FROM api_logs 
      WHERE created_at >= ${today.toISOString()}
        AND response_time_ms IS NOT NULL
    `;

    // Calculate growth rates
    const revenueGrowth = yesterdayStats?.revenue > 0 
      ? Number(((todayStats.revenue - yesterdayStats.revenue) / yesterdayStats.revenue * 100).toFixed(1))
      : 0;
    
    const ordersGrowth = yesterdayStats?.orders > 0 
      ? Number(((todayStats.orders - yesterdayStats.orders) / yesterdayStats.orders * 100).toFixed(1))
      : 0;

    // Calculate conversion rate (NEW)
    const totalSessions = Number(uniqueVisitors?.count || 0);
    const totalOrders = Number(todayStats?.orders || 0);
    const conversionRate = totalSessions > 0 
      ? Number((totalOrders / totalSessions).toFixed(4))
      : 0;

    // Cart abandonment
    const totalActiveCarts = Number(activeCarts?.count || 0);
    const abandonmentRate = totalActiveCarts > 0 && totalOrders > 0 
      ? Math.round(((totalActiveCarts - totalOrders) / totalActiveCarts) * 100)
      : 0;

    return NextResponse.json({
      // Today's stats
      revenue_today: Number(todayStats?.revenue || 0),
      orders_today: Number(todayStats?.orders || 0),
      active_users_today: Number(activeUsers?.count || 0),
      
      // Cart stats
      abandoned_carts: abandonmentRate,
      active_carts: totalActiveCarts,
      
      // System stats
      avg_api_response_ms: Math.round(avgResponse?.avg_ms || 0),
      failed_logins_last_hour: Number(failedLogins?.count || 0),
      
      // Growth
      revenue_growth: revenueGrowth,
      orders_growth: ordersGrowth,
      
      // NEW: Lifetime stats
      total_revenue_lifetime: Number(lifetimeStats?.revenue || 0),
      total_orders_lifetime: Number(lifetimeStats?.orders || 0),
      avg_order_value_lifetime: Number(lifetimeStats?.avg_order || 0),
      
      // NEW: Conversion stats
      unique_visitors_today: Number(uniqueVisitors?.count || 0),
      conversion_rate: conversionRate,
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
      total_revenue_lifetime: 0,
      total_orders_lifetime: 0,
      avg_order_value_lifetime: 0,
      unique_visitors_today: 0,
      conversion_rate: 0,
    });
  }
}
