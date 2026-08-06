import { getDb } from '@/lib/db';

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: string;
  statusLabel: string;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  deliveryMethod: string;
  createdAt: Date;
  items: OrderItem[];
}

interface OrderLookupResult {
  order: Order | null;
  error: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Your order has been received and is currently waiting for admin approval.',
  'payment-pending': 'We have received your order and are currently verifying your payment.',
  'payment-verifying': 'We have received your order and are currently verifying your payment.',
  processing: 'Your order has been approved and is currently being prepared.',
  ready: 'Your order has been packed and is ready for dispatch.',
  shipped: 'Your order has been dispatched and is on its way.',
  delivered: 'Our records show your order has been delivered. If you are experiencing any issues, please let me know.',
  cancelled: 'This order has been cancelled.',
  refunded: 'This order has been refunded.',
};

function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || `Your order status is: ${status}. Please contact support for more details.`;
}

export async function lookupOrderByEmail(email: string): Promise<Order[]> {
  const sql = getDb();

  const orders = await sql`
    SELECT 
      id,
      order_number,
      customer_name,
      customer_email,
      status,
      total_amount,
      currency,
      delivery_address,
      custom_delivery_method as delivery_method,
      created_at
    FROM orders 
    WHERE customer_email = ${email}
    ORDER BY created_at DESC
    LIMIT 20
  `;

  if (!orders || orders.length === 0) {
    return [];
  }

  const result: Order[] = [];

  for (const order of orders) {
    const items = await sql`
      SELECT 
        id,
        product_name as productName,
        quantity,
        unit_price_usd as unitPrice,
        subtotal_usd as subtotal
      FROM order_items 
      WHERE order_id = ${order.id}
    `;

    result.push({
      id: order.id,
      orderNumber: order.order_number || order.id.substring(0, 8),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      status: order.status,
      statusLabel: getStatusLabel(order.status),
      totalAmount: Number(order.total_amount),
      currency: order.currency || 'MWK',
      deliveryAddress: order.delivery_address,
      deliveryMethod: order.delivery_method,
      createdAt: order.created_at,
      items: (items || []) as OrderItem[],
    });
  }

  return result;
}

export async function lookupOrderByNumberAndEmail(
  orderNumber: string,
  email: string
): Promise<OrderLookupResult> {
  const sql = getDb();

  const orders = await sql`
    SELECT 
      id,
      order_number,
      customer_name,
      customer_email,
      status,
      total_amount,
      currency,
      delivery_address,
      custom_delivery_method as delivery_method,
      created_at
    FROM orders 
    WHERE 
      order_number = ${orderNumber} 
      AND customer_email = ${email}
    LIMIT 1
  `;

  if (!orders || orders.length === 0) {
    return { 
      order: null, 
      error: 'No order found matching that order number and email address. Please check and try again.' 
    };
  }

  const order = orders[0];

  const items = await sql`
    SELECT 
      id,
      product_name as productName,
      quantity,
      unit_price_usd as unitPrice,
      subtotal_usd as subtotal
    FROM order_items 
    WHERE order_id = ${order.id}
  `;

  return {
    order: {
      id: order.id,
      orderNumber: order.order_number || order.id.substring(0, 8),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      status: order.status,
      statusLabel: getStatusLabel(order.status),
      totalAmount: Number(order.total_amount),
      currency: order.currency || 'MWK',
      deliveryAddress: order.delivery_address,
      deliveryMethod: order.delivery_method,
      createdAt: order.created_at,
      items: (items || []) as OrderItem[],
    },
    error: null,
  };
}

export async function lookupOrdersByUserId(userId: string): Promise<Order[]> {
  const sql = getDb();

  const orders = await sql`
    SELECT 
      id,
      order_number,
      customer_name,
      customer_email,
      status,
      total_amount,
      currency,
      delivery_address,
      custom_delivery_method as delivery_method,
      created_at
    FROM orders 
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  if (!orders || orders.length === 0) {
    return [];
  }

  const result: Order[] = [];

  for (const order of orders) {
    const items = await sql`
      SELECT 
        id,
        product_name as productName,
        quantity,
        unit_price_usd as unitPrice,
        subtotal_usd as subtotal
      FROM order_items 
      WHERE order_id = ${order.id}
    `;

    result.push({
      id: order.id,
      orderNumber: order.order_number || order.id.substring(0, 8),
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      status: order.status,
      statusLabel: getStatusLabel(order.status),
      totalAmount: Number(order.total_amount),
      currency: order.currency || 'MWK',
      deliveryAddress: order.delivery_address,
      deliveryMethod: order.delivery_method,
      createdAt: order.created_at,
      items: (items || []) as OrderItem[],
    });
  }

  return result;
}

export function formatOrderResponse(order: Order): string {
  let response = `Order #${order.orderNumber}\n`;
  response += `Status: ${order.statusLabel}\n`;
  response += `Total: ${order.currency} ${order.totalAmount.toLocaleString()}\n`;
  
  if (order.items && order.items.length > 0) {
    response += `\nItems:\n`;
    for (const item of order.items) {
      response += `- ${item.quantity}x ${item.productName} @ ${order.currency} ${item.unitPrice.toLocaleString()}\n`;
    }
  }
  
  response += `\nDelivery: ${order.deliveryMethod || 'Standard'}\n`;
  response += `Address: ${order.deliveryAddress}\n`;
  response += `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`;
  
  return response;
}

export function formatMultipleOrdersResponse(orders: Order[]): string {
  let response = `Your Recent Orders (${orders.length} orders)\n\n`;
  
  for (const order of orders.slice(0, 5)) {
    response += `#${order.orderNumber} - ${order.statusLabel}\n`;
    response += `Total: ${order.currency} ${order.totalAmount.toLocaleString()}\n`;
    response += `Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n`;
  }
  
  if (orders.length > 5) {
    response += `And ${orders.length - 5} more orders. Visit your account for full history.`;
  }
  
  return response;
}
