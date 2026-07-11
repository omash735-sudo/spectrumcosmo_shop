// lib/order-status.ts
import { getDb } from '@/lib/db';
import { 
  Clock, Package, Truck, CheckCircle2, XCircle, AlertCircle, Send
} from 'lucide-react';
import { OrderStatus } from '@/lib/types/order';

export const STATUS_CONFIG: Record<OrderStatus, { 
  label: string; 
  icon: any; 
  color: string; 
  bg: string;
  step: number;
  description: string;
}> = {
  pending: {
    label: 'Pending Payment',
    icon: Clock,
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    step: 1,
    description: 'Order placed, awaiting payment confirmation'
  },
  pending_quote: {
    label: 'Pending Delivery Quote',
    icon: Send,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    step: 1,
    description: 'Delivery quote requested, admin will review'
  },
  awaiting_verification: {
    label: 'Payment Verification',
    icon: AlertCircle,
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    step: 2,
    description: 'Payment proof uploaded, admin verifying'
  },
  processing: {
    label: 'Processing',
    icon: Package,
    color: 'text-blue-700 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    step: 3,
    description: 'Order confirmed and being prepared'
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    color: 'text-purple-700 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    step: 4,
    description: 'Order on its way to you'
  },
  delivered: {
    label: 'Delivered',
    icon: CheckCircle2,
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30',
    step: 5,
    description: 'Order has been delivered'
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950/30',
    step: 0,
    description: 'Order has been cancelled'
  }
};

export const PAYMENT_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950/30'
  },
  awaiting_verification: {
    label: 'Awaiting Verification',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/30'
  },
  paid: {
    label: 'Paid',
    color: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/30'
  }
};

export function getStatusDisplayInfo(status: string) {
  const config = STATUS_CONFIG[status as OrderStatus];
  if (!config) {
    return null;
  }
  return {
    label: config.label,
    color: config.color,
    bg: config.bg,
    icon: config.icon,
    step: config.step,
    description: config.description
  };
}

export async function getOrderStatusHistory(orderId: string) {
  const sql = getDb();
  try {
    const history = await sql`
      SELECT 
        id, 
        old_status, 
        new_status, 
        changed_by, 
        notes, 
        changed_at,
        CASE 
          WHEN new_status = 'delivered' THEN 'green'
          WHEN new_status = 'shipped' THEN 'purple'
          WHEN new_status = 'processing' THEN 'blue'
          WHEN new_status = 'pending_quote' THEN 'orange'
          WHEN new_status = 'awaiting_verification' THEN 'orange'
          WHEN new_status = 'pending' THEN 'yellow'
          WHEN new_status = 'cancelled' THEN 'red'
          ELSE 'gray'
        END as color,
        new_status as status_name
      FROM order_status_history
      WHERE order_id = ${orderId}::uuid
      ORDER BY changed_at ASC
    `;
    return history || [];
  } catch (err) {
    console.error('Error fetching order history:', err);
    return [];
  }
}

export async function getAllowedStatusTransitions(currentStatus: string): Promise<string[]> {
  const transitions: Record<string, string[]> = {
    'pending': ['awaiting_verification', 'cancelled'],
    'pending_quote': ['awaiting_verification', 'cancelled'],
    'awaiting_verification': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': []
  };
  return transitions[currentStatus] || [];
}

export async function updateOrderStatus(params: {
  orderId: string;
  newStatusSlug: string;
  adminNotes?: string;
  trackingNumber?: string;
  trackingNotes?: string;
  changedBy: string;
  changedById?: string;
  ipAddress?: string;
}) {
  const { 
    orderId, 
    newStatusSlug, 
    adminNotes, 
    trackingNumber, 
    trackingNotes,
    changedBy,
    changedById,
    ipAddress 
  } = params;

  const sql = getDb();

  const [order] = await sql`
    SELECT status FROM orders WHERE id = ${orderId}::uuid
  `;

  if (!order) {
    throw new Error('Order not found');
  }

  const oldStatus = order.status;
  const changedByIdValue = changedById || changedBy;

  await sql`
    INSERT INTO order_status_history (
      order_id, old_status, new_status, changed_by, notes, changed_at, ip_address
    ) VALUES (
      ${orderId}::uuid, ${oldStatus}, ${newStatusSlug}, ${changedByIdValue}, 
      ${adminNotes || null}, NOW(), ${ipAddress || null}
    )
  `;

  let updateQuery;
  if (trackingNumber) {
    updateQuery = sql`
      UPDATE orders 
      SET status = ${newStatusSlug}, 
          tracking_number = ${trackingNumber},
          tracking_notes = ${trackingNotes || null},
          updated_at = NOW()
      WHERE id = ${orderId}::uuid
      RETURNING *
    `;
  } else if (adminNotes) {
    updateQuery = sql`
      UPDATE orders 
      SET status = ${newStatusSlug}, 
          admin_notes = ${adminNotes},
          updated_at = NOW()
      WHERE id = ${orderId}::uuid
      RETURNING *
    `;
  } else {
    updateQuery = sql`
      UPDATE orders 
      SET status = ${newStatusSlug}, updated_at = NOW()
      WHERE id = ${orderId}::uuid
      RETURNING *
    `;
  }

  const [updatedOrder] = await updateQuery;

  return { 
    order: updatedOrder,
    oldStatus,
    newStatus: newStatusSlug
  };
}

export function getOrderStatusSteps(status: string) {
  const allSteps = [
    { key: 'placed', label: 'Order Placed' },
    { key: 'payment', label: 'Payment' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const statusMap: Record<string, number> = {
    'pending': 1,
    'pending_quote': 1,
    'awaiting_verification': 2,
    'processing': 3,
    'shipped': 4,
    'delivered': 5,
    'cancelled': 0
  };

  const completedSteps = statusMap[status] || 0;
  return allSteps.map((step, index) => ({
    ...step,
    completed: index < completedSteps,
    isCurrent: index === completedSteps - 1
  }));
}

export function getAdminStatusBadge(status: string) {
  const config = STATUS_CONFIG[status as OrderStatus];
  if (!config) {
    return {
      label: 'Unknown',
      color: 'text-gray-700 dark:text-gray-400',
      bg: 'bg-gray-100 dark:bg-gray-800'
    };
  }
  return {
    label: config.label,
    color: config.color,
    bg: config.bg
  };
}

export function formatStatusLabel(status: string): string {
  const config = STATUS_CONFIG[status as OrderStatus];
  return config?.label || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function getStatusFlow() {
  return {
    statuses: Object.keys(STATUS_CONFIG).map(key => ({
      slug: key,
      label: STATUS_CONFIG[key as OrderStatus].label,
      color: STATUS_CONFIG[key as OrderStatus].color.replace('text-', '').replace(' dark:', ''),
      bg: STATUS_CONFIG[key as OrderStatus].bg,
      step: STATUS_CONFIG[key as OrderStatus].step,
      description: STATUS_CONFIG[key as OrderStatus].description
    })),
    transitions: {
      'pending': ['awaiting_verification', 'cancelled'],
      'pending_quote': ['awaiting_verification', 'cancelled'],
      'awaiting_verification': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': []
    }
  };
}
