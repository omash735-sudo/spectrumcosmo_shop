import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Cache for 60 seconds
export const revalidate = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const start = performance.now();
  
  try {
    const sql = getDb();
    
    // Optimized single query instead of view
    const result = await sql`
      WITH 
      today_stats AS (
        SELECT 
          COUNT(DISTINCT session_id) as active_users,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders 
        WHERE created_at >= CURRENT_DATE
      ),
      cart_stats AS (
        SELECT 
          COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned,
          COUNT(CASE WHEN status = 'active' AND last_activity >= NOW() - INTERVAL '1 hour' THEN 1 END) as active
        FROM cart_sessions
        WHERE last_activity >= NOW() - INTERVAL '24 hours'
      ),
      api_stats AS (
        SELECT AVG(response_time_ms) as avg_response
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
        (SELECT active_users FROM today_stats) as active_users_today,
        (SELECT orders FROM today_stats) as orders_today,
        (SELECT revenue FROM today_stats) as revenue_today,
        (SELECT abandoned FROM cart_stats) as abandoned_carts,
        (SELECT active FROM cart_stats) as active_carts,
        (SELECT failed_payments FROM payment_stats) as failed_payments,
        ROUND((SELECT avg_response FROM api_stats)) as avg_api_response_ms,
        (SELECT failed_logins FROM login_stats) as failed_logins_last_hour
    `;
    
    const end = performance.now();
    console.log(`Stats API took ${(end - start).toFixed(0)}ms`);
    
    return NextResponse.json(result[0] || {}, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=30',
      },
    });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
