import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { updateOrderStatus, getStatusDisplayInfo, getOrderStatusHistory } from '@/lib/order-status';
import { sendDynamicStatusEmail } from '@/lib/email';
import { deductStock, releaseReservedStock } from '@/lib/stock-manager';

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;
  
  const sql = getDb();
  
  // Fetch orders with their items
  const orders = await sql`
    SELECT o.*, 
           array_agg(DISTINCT jsonb_build_object(
             'product_name', oi.product_name,
             'quantity', oi.quantity,
             'unit_price_usd', oi.unit_price_usd
           )) as items
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id::uuid
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `;
  
  return NextResponse.json({ orders });
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { id, status, trackingNumber, trackingNotes, adminNotes } = body;
  
  if (!id || !status) {
    return NextResponse.json({ error: 'ID and status required' }, { status: 400 });
  }

  const sql = getDb();
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Get current order status
    const [currentOrder] = await sql`
      SELECT status, paid_at FROM orders WHERE id = ${id}
    `;
    
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // === STOCK MANAGEMENT ===
    // If moving to 'approved' from a different status
    if (status === 'approved' && currentOrder.status !== 'approved') {
      const stockDeducted = await deductStock(id);
      if (!stockDeducted) {
        return NextResponse.json({ 
          error: 'Failed to deduct stock. Items may be out of stock.' 
        }, { status: 409 });
      }
    }
    
    // If moving to 'declined' or 'cancelled' from any status
    if ((status === 'declined' || status === 'cancelled') && 
        currentOrder.status !== 'declined' && 
        currentOrder.status !== 'cancelled') {
      await releaseReservedStock(id);
    }
    
    // Get status info to check if it requires paid_at
    const statusInfo = await getStatusDisplayInfo(status);
    
    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    updateFields.push(`status = $${paramIndex++}`);
    updateValues.push(status);
    
    updateFields.push(`updated_at = NOW()`);
    
    // If status is 'approved' or 'delivered' and order wasn't paid yet, set paid_at
    if ((status === 'approved' || status === 'delivered') && !currentOrder.paid_at) {
      updateFields.push(`paid_at = NOW()`);
    }
    
    if (trackingNumber !== undefined) {
      updateFields.push(`tracking_number = $${paramIndex++}`);
      updateValues.push(trackingNumber || null);
    }
    
    if (trackingNotes !== undefined) {
      updateFields.push(`tracking_notes = $${paramIndex++}`);
      updateValues.push(trackingNotes || null);
    }
    
    if (adminNotes !== undefined) {
      updateFields.push(`admin_notes = $${paramIndex++}`);
      updateValues.push(adminNotes || null);
    }
    
    updateValues.push(id);
    
    const query = `
      UPDATE orders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await sql.query(query, updateValues);
    const updatedOrder = result[0];
    
    // Log status change to history
    if (currentOrder.status !== status) {
      await sql`
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, ip_address, notes, changed_at)
        VALUES (${id}, ${currentOrder.status}, ${status}, 'admin', ${ipAddress}, ${adminNotes || null}, NOW())
      `;
      
      // Send email notification for status change
      const statusInfo = await getStatusDisplayInfo(status);
      if (statusInfo?.send_email) {
        try {
          await sendDynamicStatusEmail({
            customerEmail: updatedOrder.customer_email,
            customerName: updatedOrder.customer_name,
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.order_number || updatedOrder.id.slice(-8),
            oldStatus: currentOrder.status,
            newStatus: status,
            totalAmount: updatedOrder.total_amount,
            trackingNumber: trackingNumber || updatedOrder.tracking_number,
            adminNotes: trackingNotes || adminNotes,
          });
        } catch (emailErr) {
          console.error('Failed to send status email:', emailErr);
          // Don't fail the request if email fails
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      statusChanged: currentOrder.status !== status
    });
    
  } catch (err: any) {
    console.error('Admin order update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }

  const sql = getDb();
  
  try {
    // Release reserved stock before deleting
    await releaseReservedStock(id);
    
    // Delete order items first (foreign key constraint)
    await sql`DELETE FROM order_items WHERE order_id = ${id}::uuid`;
    
    // Delete order status history
    await sql`DELETE FROM order_status_history WHERE order_id = ${id}::uuid`;
    
    // Delete the order
    await sql`DELETE FROM orders WHERE id = ${id}::uuid`;
    
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Admin order delete error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { id, status, trackingNumber, trackingNotes, adminNotes } = body;
  
  if (!id) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }

  const sql = getDb();
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
  
  try {
    // Get current order
    const [currentOrder] = await sql`
      SELECT status, paid_at FROM orders WHERE id = ${id}
    `;
    
    if (!currentOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // If status is being updated in PATCH request
    if (status && status !== currentOrder.status) {
      // === STOCK MANAGEMENT ===
      if (status === 'approved' && currentOrder.status !== 'approved') {
        const stockDeducted = await deductStock(id);
        if (!stockDeducted) {
          return NextResponse.json({ 
            error: 'Failed to deduct stock. Items may be out of stock.' 
          }, { status: 409 });
        }
      }
      
      if ((status === 'declined' || status === 'cancelled') && 
          currentOrder.status !== 'declined' && 
          currentOrder.status !== 'cancelled') {
        await releaseReservedStock(id);
      }
      
      // Update status
      await sql`
        UPDATE orders 
        SET 
          status = ${status},
          updated_at = NOW(),
          paid_at = CASE 
            WHEN (${status} = 'approved' OR ${status} = 'delivered') AND paid_at IS NULL 
            THEN NOW() 
            ELSE paid_at 
          END
        WHERE id = ${id}
      `;
      
      // Log status change
      await sql`
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, ip_address, notes, changed_at)
        VALUES (${id}, ${currentOrder.status}, ${status}, 'admin', ${ipAddress}, ${adminNotes || null}, NOW())
      `;
    }
    
    // Update tracking and notes
    const [updatedOrder] = await sql`
      UPDATE orders 
      SET 
        tracking_number = COALESCE(${trackingNumber || null}, tracking_number),
        tracking_notes = COALESCE(${trackingNotes || null}, tracking_notes),
        admin_notes = COALESCE(${adminNotes || null}, admin_notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (err: any) {
    console.error('Admin order update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
