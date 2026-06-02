// app/api/admin/inventory/update-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { sendStockAlertEmail } from '@/lib/email/stockAlerts';

const ALERT_COOLDOWN_HOURS = {
  low: 6,
  critical: 1,
  out: 1,
};

async function getAdminEmails(sql: any, alertType: string) {
  const receiveColumn = 
    alertType === 'low' ? 'receive_low_stock' :
    alertType === 'critical' ? 'receive_critical' : 'receive_out_of_stock';
  
  const admins = await sql`
    SELECT email FROM admin_alert_settings 
    WHERE ${sql.raw(receiveColumn)} = true
  `;
  return admins.map((a: any) => a.email);
}

async function shouldSendAlert(sql: any, productId: string, alertType: string): Promise<boolean> {
  const cooldownHours = ALERT_COOLDOWN_HOURS[alertType as keyof typeof ALERT_COOLDOWN_HOURS];
  
  const [recentAlert] = await sql`
    SELECT id FROM stock_alerts 
    WHERE product_id = ${productId}
      AND alert_type = ${alertType}
      AND sent_at > NOW() - INTERVAL '${cooldownHours} hours'
      AND resolved_at IS NULL
    LIMIT 1
  `;
  
  return !recentAlert;
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { productId, newStock, reason, adminId } = await req.json();
    
    if (!productId || newStock === undefined) {
      return NextResponse.json({ error: 'Product ID and new stock value required' }, { status: 400 });
    }
    
    const sql = getDb();
    
    // Get current stock
    const [product] = await sql`
      SELECT name, stock_quantity, low_stock_threshold FROM products WHERE id = ${productId}
    `;
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const previousStock = product.stock_quantity;
    const threshold = product.low_stock_threshold || 5;
    
    // Update stock
    await sql`
      UPDATE products 
      SET stock_quantity = ${newStock}, updated_at = NOW()
      WHERE id = ${productId}
    `;
    
    // Determine alert type
    let alertType: 'low' | 'critical' | 'out' | null = null;
    if (newStock === 0) {
      alertType = 'out';
    } else if (newStock <= threshold && newStock <= 3) {
      alertType = 'critical';
    } else if (newStock <= threshold) {
      alertType = 'low';
    }
    
    // Send alert if needed
    if (alertType && await shouldSendAlert(sql, productId, alertType)) {
      const adminEmails = await getAdminEmails(sql, alertType);
      
      if (adminEmails.length > 0) {
        await sendStockAlertEmail({
          productName: product.name,
          currentStock: newStock,
          threshold,
          alertType,
          productUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/products/${productId}`,
        }, adminEmails);
      }
      
      // Record alert in log
      await sql`
        INSERT INTO stock_alerts (product_id, alert_type, current_stock, threshold)
        VALUES (${productId}, ${alertType}, ${newStock}, ${threshold})
      `;
    }
    
    return NextResponse.json({ 
      success: true, 
      previousStock, 
      newStock, 
      alertSent: alertType !== null 
    });
  } catch (err: any) {
    console.error('Stock update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
