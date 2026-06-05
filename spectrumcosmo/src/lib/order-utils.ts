// src/lib/order-utils.ts
import { getDb } from './db';

export async function deductStock(orderId: string): Promise<boolean> {
  const sql = getDb();
  try {
    // Get order items
    const items = await sql`
      SELECT product_id, quantity FROM order_items WHERE order_id = ${orderId}
    `;
    
    for (const item of items) {
      const result = await sql`
        UPDATE products 
        SET stock_quantity = stock_quantity - ${item.quantity}
        WHERE id = ${item.product_id} AND stock_quantity >= ${item.quantity}
        RETURNING id
      `;
      
      if (result.length === 0) {
        return false;
      }
    }
    return true;
  } catch (err) {
    console.error('Failed to deduct stock:', err);
    return false;
  }
}

export async function releaseReservedStock(orderId: string): Promise<void> {
  const sql = getDb();
  try {
    const items = await sql`
      SELECT product_id, quantity FROM order_items WHERE order_id = ${orderId}
    `;
    
    for (const item of items) {
      await sql`
        UPDATE products 
        SET stock_quantity = stock_quantity + ${item.quantity}
        WHERE id = ${item.product_id}
      `;
    }
  } catch (err) {
    console.error('Failed to release reserved stock:', err);
  }
}

export async function getStatusDisplayInfo(status: string): Promise<{ send_email: boolean } | null> {
  const statusesThatSendEmail = ['approved', 'shipped', 'delivered', 'declined', 'cancelled'];
  return { send_email: statusesThatSendEmail.includes(status) };
}

export async function sendDynamicStatusEmail(params: {
  customerEmail: string;
  customerName: string;
  orderId: string;
  orderNumber: string;
  oldStatus: string;
  newStatus: string;
  totalAmount: number;
  trackingNumber?: string;
  adminNotes?: string;
}): Promise<void> {
  // Implement your email sending logic here
  console.log(`Would send status update email to ${params.customerEmail} for order ${params.orderNumber}`);
  // You can use nodemailer or your preferred email service
}
