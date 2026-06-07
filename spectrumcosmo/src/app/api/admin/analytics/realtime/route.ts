// app/api/admin/analytics/realtime/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

// Types for query results
interface CountResult {
  count: string | number;
}

interface RevenueResult {
  total: string | number;
}

interface MonthlyRow {
  month: Date;
  revenue: string | number;
}

interface ProductRow {
  product_name: string;
  sold: string | number;
}

interface RepeatResult {
  repeat: string | number;
  new: string | number;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req as any);
  if (authError) return authError;

  try {
    const sql = getDb();

    const [ordersCount, revenue, confirmed, pending, declined, monthlyResult, productsResult, repeatResult] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM orders`,
      sql`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'completed'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'completed'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'pending'`,
      sql`SELECT COUNT(*) as count FROM orders WHERE status = 'declined'`,
      sql`
        SELECT
          DATE_TRUNC('month', COALESCE(paid_at, created_at)) as month,
          COALESCE(SUM(total_amount), 0) as revenue
        FROM orders
        WHERE status = 'completed'
          AND COALESCE(paid_at, created_at) >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `,
      sql`
        SELECT product_name, SUM(quantity) as sold
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.status = 'completed'
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
          WHERE user_id IS NOT NULL AND status = 'completed'
          GROUP BY user_id
        ) t
      `
    ]);

    // Cast results to arrays (the Neon client returns arrays)
    const ordersCountArray = ordersCount as CountResult[];
    const revenueArray = revenue as RevenueResult[];
    const confirmedArray = confirmed as CountResult[];
    const pendingArray = pending as CountResult[];
    const declinedArray = declined as CountResult[];
    const monthlyArray = monthlyResult as MonthlyRow[];
    const productsArray = productsResult as ProductRow[];
    const repeatArray = repeatResult as RepeatResult[];

    const monthlyData = monthlyArray.map((row) => ({
      month: new Date(row.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: Number(row.revenue),
    }));

    const topProducts = productsArray.map((p) => ({
      product_name: p.product_name,
      sold: Number(p.sold),
    }));

    return NextResponse.json({
      stats: {
        totalOrders: Number(ordersCountArray[0]?.count ?? 0),
        totalRevenue: Number(revenueArray[0]?.total ?? 0),
        confirmedOrders: Number(confirmedArray[0]?.count ?? 0),
        pendingOrders: Number(pendingArray[0]?.count ?? 0),
        declinedOrders: Number(declinedArray[0]?.count ?? 0),
      },
      monthlyData,
      topProducts,
      customerStats: {
        repeatCustomers: Number(repeatArray[0]?.repeat ?? 0),
        newCustomers: Number(repeatArray[0]?.new ?? 0),
      },
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return NextResponse.json(
      {
        error: 'Failed to load analytics data',
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          confirmedOrders: 0,
          pendingOrders: 0,
          declinedOrders: 0,
        },
        monthlyData: [],
        topProducts: [],
        customerStats: { repeatCustomers: 0, newCustomers: 0 },
      },
      { status: 500 }
    );
  }
}
