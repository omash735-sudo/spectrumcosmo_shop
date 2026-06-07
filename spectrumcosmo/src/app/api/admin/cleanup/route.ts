// app/api/admin/cleanup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  // Allow both admin cookie and cron secret
  const authError = requireAdmin(req);
  if (authError) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return authError;
    }
  }

  const sql = getDb();

  try {
    // Get retention days from settings (default 7 years = 2555 days)
    const [retentionSetting] = await sql`
      SELECT value FROM site_settings WHERE key = 'data_retention_days'
    `;
    const retentionDays = Number(retentionSetting?.value ?? '2555');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete soft-deleted users older than cutoff
    const usersResult = await sql`
      DELETE FROM users
      WHERE deleted_at IS NOT NULL AND deleted_at < ${cutoffDate}
      RETURNING id
    `;
    const usersArray = usersResult as any[];
    const deletedUsersCount = usersArray.length;

    // Delete orphaned orders (no user_id) older than cutoff
    const ordersResult = await sql`
      DELETE FROM orders
      WHERE user_id IS NULL AND created_at < ${cutoffDate}
      RETURNING id
    `;
    const ordersArray = ordersResult as any[];
    const deletedOrdersCount = ordersArray.length;

    // Optional: also delete other orphaned data like order_items that belong to deleted orders? (cascade should handle)

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedUsersCount} users and ${deletedOrdersCount} orphaned orders.`,
      deletedUsers: deletedUsersCount,
      deletedOrders: deletedOrdersCount,
    });
  } catch (err) {
    console.error('Cleanup job failed:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
