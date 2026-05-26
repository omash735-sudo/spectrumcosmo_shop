import { getDb } from './db';

export interface StockItem {
  productId: string;
  quantity: number;
}

export interface StockReservationResult {
  success: boolean;
  failedItems: { productId: string; requested: number; available: number }[];
}

/**
 * Reserve stock for items in an order using atomic database operations
 * Prevents overselling by using row-level locks and conditional updates
 */
export async function reserveStock(
  items: StockItem[],
  orderId: string
): Promise<StockReservationResult> {
  const sql = getDb();
  const failedItems: { productId: string; requested: number; available: number }[] = [];

  await sql`BEGIN`;

  try {
    for (const item of items) {
      // Get current available stock (stock - reserved)
      const [product] = await sql`
        SELECT id, stock, reserved_stock, 
               (stock - reserved_stock) as available
        FROM products 
        WHERE id = ${item.productId}
        FOR UPDATE
      `;

      if (!product) {
        failedItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: 0,
        });
        continue;
      }

      const available = Number(product.available);

      if (available < item.quantity) {
        failedItems.push({
          productId: item.productId,
          requested: item.quantity,
          available,
        });
        continue;
      }

      // Atomic update - only succeeds if stock hasn't changed since SELECT
      const [updated] = await sql`
        UPDATE products 
        SET reserved_stock = reserved_stock + ${item.quantity}
        WHERE id = ${item.productId} 
          AND (stock - reserved_stock) >= ${item.quantity}
        RETURNING stock, reserved_stock
      `;

      if (!updated) {
        failedItems.push({
          productId: item.productId,
          requested: item.quantity,
          available: 0,
        });
      }
    }

    if (failedItems.length > 0) {
      await sql`ROLLBACK`;
      return { success: false, failedItems };
    }

    // Store reservation reference
    await sql`
      INSERT INTO order_stock_reservations (order_id, items, created_at)
      VALUES (${orderId}, ${JSON.stringify(items)}, NOW())
      ON CONFLICT (order_id) DO UPDATE SET items = EXCLUDED.items
    `;

    await sql`COMMIT`;
    return { success: true, failedItems: [] };
  } catch (err) {
    await sql`ROLLBACK`;
    throw err;
  }
}

/**
 * Permanently deduct stock when order is approved
 */
export async function deductStock(orderId: string): Promise<boolean> {
  const sql = getDb();

  const [reservation] = await sql`
    SELECT items FROM order_stock_reservations WHERE order_id = ${orderId}
  `;

  if (!reservation) {
    console.error(`No stock reservation found for order ${orderId}`);
    return false;
  }

  const items = reservation.items as StockItem[];

  await sql`BEGIN`;

  try {
    for (const item of items) {
      const [updated] = await sql`
        UPDATE products 
        SET stock = stock - ${item.quantity},
            reserved_stock = reserved_stock - ${item.quantity}
        WHERE id = ${item.productId}
          AND stock >= ${item.quantity}
          AND reserved_stock >= ${item.quantity}
        RETURNING stock
      `;

      if (!updated) {
        await sql`ROLLBACK`;
        return false;
      }
    }

    await sql`DELETE FROM order_stock_reservations WHERE order_id = ${orderId}`;
    await sql`COMMIT`;
    return true;
  } catch (err) {
    await sql`ROLLBACK`;
    throw err;
  }
}

/**
 * Release reserved stock when order is cancelled or declined
 */
export async function releaseReservedStock(orderId: string): Promise<void> {
  const sql = getDb();

  const [reservation] = await sql`
    SELECT items FROM order_stock_reservations WHERE order_id = ${orderId}
  `;

  if (!reservation) return;

  const items = reservation.items as StockItem[];

  await sql`BEGIN`;

  try {
    for (const item of items) {
      await sql`
        UPDATE products 
        SET reserved_stock = reserved_stock - ${item.quantity}
        WHERE id = ${item.productId}
          AND reserved_stock >= ${item.quantity}
      `;
    }

    await sql`DELETE FROM order_stock_reservations WHERE order_id = ${orderId}`;
    await sql`COMMIT`;
  } catch (err) {
    await sql`ROLLBACK`;
    throw err;
  }
}

/**
 * Check if items are in stock (without reserving)
 */
export async function checkStockAvailability(
  items: StockItem[]
): Promise<{ available: boolean; unavailableItems: StockItem[] }> {
  const sql = getDb();
  const unavailableItems: StockItem[] = [];

  for (const item of items) {
    const [product] = await sql`
      SELECT (stock - reserved_stock) as available
      FROM products 
      WHERE id = ${item.productId}
    `;

    const available = product ? Number(product.available) : 0;
    if (available < item.quantity) {
      unavailableItems.push(item);
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
  };
}

// Create the reservations table if not exists
export async function ensureStockReservationsTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS order_stock_reservations (
      id SERIAL PRIMARY KEY,
      order_id UUID UNIQUE NOT NULL,
      items JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 minutes')
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id 
    ON order_stock_reservations(order_id)
  `;
}
