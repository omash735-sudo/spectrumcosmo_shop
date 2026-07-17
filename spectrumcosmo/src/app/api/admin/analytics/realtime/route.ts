import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  product_name: string;
  sold: number;
  revenue: number;
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();

    // ----- Order status counts + revenue -----
    const [statsRow] = await sql`
      SELECT
        COUNT(*)::int AS total_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('approved', 'delivered')), 0)::float AS total_revenue,
        COUNT(*) FILTER (WHERE status = 'approved')::int AS confirmed_orders,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
        COUNT(*) FILTER (WHERE status IN ('declined', 'cancelled'))::int AS declined_orders
      FROM orders
    `;

    const stats = {
      totalOrders: statsRow?.total_orders || 0,
      totalRevenue: statsRow?.total_revenue || 0,
      confirmedOrders: statsRow?.confirmed_orders || 0,
      pendingOrders: statsRow?.pending_orders || 0,
      declinedOrders: statsRow?.declined_orders || 0,
    };

    // ----- Monthly revenue/orders trend (last 6 months) -----
    const monthlyRows = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') AS month,
        COALESCE(SUM(total_amount) FILTER (WHERE status IN ('approved', 'delivered')), 0)::float AS revenue,
        COUNT(*)::int AS orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `;

    // Ensure monthlyData is always an array
    let monthlyData: MonthlyData[] = [];
    if (monthlyRows && Array.isArray(monthlyRows)) {
      monthlyData = monthlyRows.map((row: any) => ({
        month: row.month,
        revenue: Number(row.revenue) || 0,
        orders: Number(row.orders) || 0,
      }));
    }

    // ----- Top selling products -----
    const topProductRows = await sql`
      SELECT
        oi.product_name,
        SUM(oi.quantity)::int AS sold,
        COALESCE(SUM(oi.subtotal_usd), 0)::float AS revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status IN ('approved', 'delivered')
      GROUP BY oi.product_name
      ORDER BY sold DESC
      LIMIT 5
    `;

    let topProducts: TopProduct[] = [];
    if (topProductRows && Array.isArray(topProductRows)) {
      topProducts = topProductRows.map((row: any) => ({
        product_name: row.product_name,
        sold: Number(row.sold) || 0,
        revenue: Number(row.revenue) || 0,
      }));
    }

    // ----- Customer retention: repeat vs new -----
    const customerRows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE order_count > 1)::int AS repeat_customers,
        COUNT(*) FILTER (WHERE order_count = 1)::int AS new_customers
      FROM (
        SELECT customer_email, COUNT(*) AS order_count
        FROM orders
        GROUP BY customer_email
      ) AS customer_orders
    `;

    const customerStats = {
      repeatCustomers: customerRows?.[0]?.repeat_customers || 0,
      newCustomers: customerRows?.[0]?.new_customers || 0,
    };

    return NextResponse.json({
      stats,
      monthlyData,
      topProducts,
      customerStats,
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
