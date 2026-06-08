// lib/order-status.ts
import { getDb, queryMany, queryOne } from './db';
import { sendDynamicStatusEmail } from './email';

export interface StatusUpdateOptions {
  orderId: string;
  newStatusSlug: string;
  adminNotes?: string;
  trackingNumber?: string;
  trackingNotes?: string;
  changedBy?: string;
  changedById?: string;
  ipAddress?: string;
}

export interface OrderStatus {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  display_order: number;
  is_active: boolean;
  step_index: number;
  send_email: boolean;
}

interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  old_status: string;
  order_number: string | null;
  tracking_number: string | null;
  tracking_notes: string | null;
}

interface UpdatedOrderRow {
  id: string;
  status: string;
}

// Cache for statuses
let statusCache: OrderStatus[] | null = null;
let statusCacheTime: number = 0;
const CACHE_TTL = 60000;

async function getStatuses(): Promise<OrderStatus[]> {
  const now = Date.now();
  if (statusCache && now - statusCacheTime < CACHE_TTL) {
    return statusCache;
  }
  const statuses = await queryMany<OrderStatus>`
    SELECT * FROM order_statuses 
    WHERE is_active = true 
    ORDER BY display_order ASC
  `;
  statusCache = statuses;
  statusCacheTime = now;
  return statuses;
}

async function getStatusBySlug(slug: string): Promise<OrderStatus | null> {
  const statuses = await getStatuses();
  return statuses.find(s => s.slug === slug) || null;
}

export async function getAllowedStatusTransitions(currentSlug: string): Promise<OrderStatus[]> {
  const statuses = await getStatuses();
  const current = statuses.find(s => s.slug === currentSlug);
  if (!current) return [];
  return statuses.filter(s => s.display_order > current.display_order);
}

export async function updateOrderStatus(options: StatusUpdateOptions) {
  const {
    orderId,
    newStatusSlug,
    adminNotes,
    trackingNumber,
    trackingNotes,
    changedBy = 'admin',
    changedById,
    ipAddress = 'unknown',
  } = options;

  const sql = getDb();

  const order = await queryOne<OrderRow>`
    SELECT id, customer_name, customer_email, total_amount, status as old_status,
           order_number, tracking_number, tracking_notes
    FROM orders 
    WHERE id = ${orderId}
  `;

  if (!order) throw new Error('Order not found');

  if (order.old_status === newStatusSlug) {
    return { order, noChange: true };
  }

  const newStatusInfo = await getStatusBySlug(newStatusSlug);
  if (!newStatusInfo) throw new Error(`Invalid status: ${newStatusSlug}`);

  const updatedOrder = await queryOne<UpdatedOrderRow>`
    UPDATE orders 
    SET status = ${newStatusSlug}, 
        updated_at = NOW(),
        admin_notes = COALESCE(${adminNotes}, admin_notes),
        tracking_number = COALESCE(${trackingNumber}, tracking_number),
        tracking_notes = COALESCE(${trackingNotes}, tracking_notes)
    WHERE id = ${orderId}
    RETURNING id, status
  `;

  if (!updatedOrder) throw new Error('Failed to update order');

  await sql`
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, changed_by_id, ip_address, notes, changed_at)
    VALUES (${orderId}, ${order.old_status}, ${newStatusSlug}, ${changedBy}, ${changedById}, ${ipAddress}, ${adminNotes || null}, NOW())
  `;

  if (newStatusInfo.send_email) {
    try {
      // FIX: Convert null to undefined for optional parameters
      await sendDynamicStatusEmail({
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderId: order.id,
        orderNumber: order.order_number ?? order.id.slice(-8),
        oldStatus: order.old_status,
        newStatus: newStatusSlug,
        totalAmount: order.total_amount,
        trackingNumber: trackingNumber ?? order.tracking_number ?? undefined,
        adminNotes: adminNotes ?? trackingNotes ?? undefined,
      });
    } catch (emailErr) {
      console.error('Failed to send status email:', emailErr);
    }
  }

  const fullUpdatedOrder = { ...order, status: updatedOrder.status };
  return { order: fullUpdatedOrder, changed: true };
}

export async function cancelOrder(orderId: string, userId: string, reason?: string) {
  const order = await queryOne<{ status: string }>`
    SELECT status FROM orders WHERE id = ${orderId} AND user_id = ${userId}
  `;
  if (!order) throw new Error('Order not found');

  const pendingStatus = await getStatusBySlug('pending');
  if (order.status !== pendingStatus?.slug) {
    throw new Error(`Cannot cancel order with status: ${order.status}`);
  }
  return updateOrderStatus({
    orderId,
    newStatusSlug: 'cancelled',
    adminNotes: reason || 'Cancelled by customer',
    changedBy: 'customer',
    changedById: userId,
  });
}

export async function getOrderStatusHistory(orderId: string) {
  return queryMany<{
    id: string;
    old_status: string;
    new_status: string;
    changed_at: Date;
    status_name: string;
    color: string;
  }>`
    SELECT h.*, s.name as status_name, s.color
    FROM order_status_history h
    LEFT JOIN order_statuses s ON h.new_status = s.slug
    WHERE h.order_id = ${orderId}
    ORDER BY h.changed_at ASC
  `;
}

export async function getStatusFlow(): Promise<OrderStatus[]> {
  return getStatuses();
}

export async function getStatusDisplayInfo(slug: string): Promise<OrderStatus | null> {
  return getStatusBySlug(slug);
}
