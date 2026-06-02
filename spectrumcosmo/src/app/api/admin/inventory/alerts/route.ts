// app/api/admin/inventory/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const sql = getDb();
    
    const alerts = await sql`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.stock_quantity,
        p.low_stock_threshold,
        CASE 
          WHEN p.stock_quantity = 0 THEN 'out'
          WHEN p.stock_quantity <= p.low_stock_threshold AND p.stock_quantity <= 3 THEN 'critical'
          WHEN p.stock_quantity <= p.low_stock_threshold THEN 'low'
          ELSE NULL
        END as alert_type
      FROM products p
      WHERE p.status = 'in_stock'
        AND (
          p.stock_quantity = 0 
          OR p.stock_quantity <= p.low_stock_threshold
        )
      ORDER BY 
        CASE 
          WHEN p.stock_quantity = 0 THEN 1
          WHEN p.stock_quantity <= 3 THEN 2
          ELSE 3
        END,
        p.stock_quantity ASC
    `;
    
    const summary = {
      out_of_stock: alerts.filter((a: any) => a.alert_type === 'out').length,
      critical: alerts.filter((a: any) => a.alert_type === 'critical').length,
      low: alerts.filter((a: any) => a.alert_type === 'low').length,
      total_alerts: alerts.length,
    };
    
    return NextResponse.json({ success: true, summary, alerts });
  } catch (err: any) {
    console.error('Failed to fetch stock alerts:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
