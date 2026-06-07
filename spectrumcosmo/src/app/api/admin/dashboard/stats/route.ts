// app/api/admin/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export const revalidate = 60;
export const dynamic = 'force-dynamic';

interface DashboardStats {
  active_users_today: number;
  orders_today: number;
  revenue_today: number;
  abandoned_carts: number;
  active_carts: number;
  failed_payments: number;
  avg_api_response_ms: number;
  failed_logins_last_hour: number;
}

export async function GET(req: Request) {
  // Admin authentication
  const authError = requireAdmin(req as any);
  if (authError) return authError;

  const start = performance.now();

  try {
    const sql = getDb();

    // Use queryAsArray to get a properly typed array
    const result = await queryAsArray<DashboardStats>`
      WITH 
      today_stats AS (
        SELECT 
          COUNT(*) as orders,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN total_amount ELSE 0 END), 0) as revenue
        FROM orders 
        WHERE created_at >= (NOW() AT TIME ZONE 'Africa/Blantyre')::DATE
      ),
      active_users_stats AS (
        SELECT COUNT(DISTINCT session_id) as active_users
        FROM user_sessions
        WHERE visited_at >= NOW() - INTERVAL '15 minutes'
      ),
      cart_stats AS (
        SELECT 
          COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned,
          COUNT(CASE WHEN status = 'active' AND last_activity >= NOW() - INTERVAL '1 hour' THEN 1 END) as active
        FROM cart_sessions
        WHERE last_activity >= NOW() - INTERVAL '24 hours'
      ),
      api_stats AS (
        SELECT ROUND(AVG(response_time_ms)) as avg_response
        FROM api_logs 
        WHERE started_at >= NOW() - INTERVAL '1 hour'
      ),
      login_stats AS (
        SELECT COUNT(*) as failed_logins
        FROM login_attempts 
        WHERE success = false AND attempted_at >= NOW() - INTERVAL '1 hour'
      ),
      payment_stats AS (
        SELECT COUNT(*) as failed_payments
        FROM payment_logs 
        WHERE status = 'failed' AND attempted_at >= NOW() - INTERVAL '24 hours'
      )
      SELECT 
        (SELECT active_users FROM active_users_stats) as active_users_today,
        (SELECT orders FROM today_stats) as orders_today,
        (SELECT revenue FROM today_stats) as revenue_today,
        (SELECT abandoned FROM cart_stats) as abandoned_carts,
        (SELECT active FROM cart_stats) as active_carts,
        (SELECT failed_payments FROM payment_stats) as failed_payments,
        (SELECT avg_response FROM api_stats) as avg_api_response_ms,
        (SELECT failed_logins FROM login_stats) as failed_logins_last_hour
    `;

    const stats = result[0] || {
      active_users_today: 0,
      orders_today: 0,
      revenue_today: 0,
      abandoned_carts: 0,
      active_carts: 0,
      failed_payments: 0,
      avg_api_response_ms: 0,
      failed_logins_last_hour: 0,
    };

    const end = performance.now();
    // Keep log for debugging (could be removed in production)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Stats API took ${(end - start).toFixed(0)}ms`);
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err);
    return NextResponse.json(
      {
        active_users_today: 0,
        orders_today: 0,
        revenue_today: 0,
        abandoned_carts: 0,
        active_carts: 0,
        failed_payments: 0,
        avg_api_response_ms: 0,
        failed_logins_last_hour: 0,
      },
      { status: 500 }
    );
  }
}
