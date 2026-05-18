import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: Request) {
  const authError = requireAdmin(req as any)
  if (authError) return authError

  try {
    const sql = getDb()

    const [ordersCount, revenue, confirmed, pending, declined, monthly, products, repeatData] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'approved'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'approved'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'declined'`,
      // Monthly revenue based on paid_at (confirmation date)
      sql`
        SELECT
          DATE_TRUNC('month', paid_at) as month,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE status = 'approved' AND paid_at IS NOT NULL
          AND paid_at >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `,
      sql`
        SELECT product_name, SUM(quantity) as sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'approved'
        GROUP BY product_name
        ORDER BY sold DESC
        LIMIT 5
      `,
      sql`
        SELECT
          COUNT(CASE WHEN order_count > 1 THEN 1 END) as repeat,
          COUNT(CASE WHEN order_count = 1 THEN 1 END) as new
        FROM (
          SELECT user_id, COUNT(*) as order_count
          FROM orders
          WHERE user_id IS NOT NULL AND status = 'approved'
          GROUP BY user_id
        ) t
      `
    ])

    const monthlyData = monthly.map((row: any) => ({
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: parseFloat(row.revenue),
    }))

    return NextResponse.json({
      stats: {
        totalOrders: parseInt(ordersCount[0]?.count || 0),
        totalRevenue: parseFloat(revenue[0]?.total || 0),
        confirmedOrders: parseInt(confirmed[0]?.count || 0),
        pendingOrders: parseInt(pending[0]?.count || 0),
        declinedOrders: parseInt(declined[0]?.count || 0),
      },
      monthlyData,
      topProducts: products.map((p: any) => ({ product_name: p.product_name, sold: parseInt(p.sold) })),
      customerStats: {
        repeatCustomers: parseInt(repeatData[0]?.repeat || 0),
        newCustomers: parseInt(repeatData[0]?.new || 0),
      }
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json({
      stats: {
        totalOrders: 0,
        totalRevenue: 0,
        confirmedOrders: 0,
        pendingOrders: 0,
        declinedOrders: 0,
      },
      monthlyData: [],
      topProducts: [],
      customerStats: { repeatCustomers: 0, newCustomers: 0 }
    })
  }
}
