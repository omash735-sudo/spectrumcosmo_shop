import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const authError = requireAdmin(req as any)
  if (authError) return authError

  try {
    const sql = getDb()

    // Get real-time visitor stats
    const [visitorStats, cartStats, orderStats, productViews] = await Promise.all([
      sql`
        SELECT 
          COUNT(*) as active_today,
          COUNT(DISTINCT user_id) as unique_visitors
        FROM user_sessions 
        WHERE visited_at >= NOW() - INTERVAL '24 hours'
      `,
      sql`
        SELECT 
          COUNT(*) as active_carts,
          COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned
        FROM cart_sessions 
        WHERE updated_at >= NOW() - INTERVAL '24 hours'
      `,
      sql`
        SELECT 
          COUNT(*) as today_orders,
          COALESCE(SUM(total_amount), 0) as today_revenue
        FROM orders 
        WHERE created_at >= NOW() - INTERVAL '24 hours'
      `,
      sql`
        SELECT product_id, COUNT(*) as views
        FROM product_views
        WHERE viewed_at >= NOW() - INTERVAL '24 hours'
        GROUP BY product_id
        ORDER BY views DESC
        LIMIT 5
      `
    ])

    // Get conversion rate
    const totalVisitors = parseInt(visitorStats[0]?.unique_visitors || '1')
    const todayOrders = parseInt(orderStats[0]?.today_orders || '0')
    const conversionRate = (todayOrders / totalVisitors) * 100

    // Cart abandonment rate
    const activeCarts = parseInt(cartStats[0]?.active_carts || '1')
    const abandonedCarts = parseInt(cartStats[0]?.abandoned || '0')
    const abandonmentRate = (abandonedCarts / (activeCarts + abandonedCarts)) * 100

    return NextResponse.json({
      activeUsers: parseInt(visitorStats[0]?.active_today || '0'),
      uniqueVisitors: totalVisitors,
      todayOrders,
      todayRevenue: parseFloat(orderStats[0]?.today_revenue || '0'),
      conversionRate,
      abandonmentRate,
      activeCarts,
      topProducts: productViews,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({
      activeUsers: 0,
      uniqueVisitors: 0,
      todayOrders: 0,
      todayRevenue: 0,
      conversionRate: 0,
      abandonmentRate: 0,
      activeCarts: 0,
      topProducts: [],
      timestamp: new Date().toISOString()
    })
  }
}
