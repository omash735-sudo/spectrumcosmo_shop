// app/api/admin/sync-products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';
import algoliasearch from 'algoliasearch';

// Types
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  category_id: string | null;
  status: string;
  stock_quantity: number;
  category_name: string | null;
  updated_at: Date;
  created_at: Date;
}

interface SyncLog {
  id: string;
  started_at: Date;
  completed_at: Date | null;
  status: 'running' | 'completed' | 'failed';
  total_products: number;
  synced_products: number;
  deleted_products: number;
  error_message: string | null;
}

interface AlgoliaProduct {
  objectID: string;
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  category_id: string | null;
  category_name: string | null;
  stock_quantity: number;
  is_available: boolean;
  in_stock: boolean;
  updated_at: string;
}

function safeParseInt(value: string | number | null | undefined, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

function formatForAlgolia(product: Product): AlgoliaProduct {
  return {
    objectID: product.id,
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: product.price,
    currency: product.currency || 'MWK',
    image_url: product.image_url || '',
    category_id: product.category_id,
    category_name: product.category_name,
    stock_quantity: product.stock_quantity,
    is_available: product.status === 'in_stock' && product.stock_quantity > 0,
    in_stock: product.status === 'in_stock',
    updated_at: product.updated_at?.toISOString() || product.created_at?.toISOString(),
  };
}

async function getLastSyncTime(sql: any): Promise<Date | null> {
  try {
    const [lastSync] = await sql`
      SELECT completed_at FROM algolia_sync_logs 
      WHERE status = 'completed' 
      ORDER BY completed_at DESC 
      LIMIT 1
    `;
    return lastSync?.completed_at || null;
  } catch {
    return null;
  }
}

async function createSyncLog(sql: any, status: string): Promise<string> {
  const [log] = await sql`
    INSERT INTO algolia_sync_logs (status, started_at) 
    VALUES (${status}, NOW()) 
    RETURNING id
  `;
  return log.id;
}

async function updateSyncLog(sql: any, logId: string, updates: Partial<SyncLog>) {
  const entries = Object.entries(updates).filter(([_, v]) => v !== undefined);
  
  for (const [key, value] of entries) {
    if (value === null) {
      await sql`UPDATE algolia_sync_logs SET ${sql(key)} = NULL WHERE id = ${logId}`;
    } else if (value instanceof Date) {
      await sql`UPDATE algolia_sync_logs SET ${sql(key)} = ${value} WHERE id = ${logId}`;
    } else {
      await sql`UPDATE algolia_sync_logs SET ${sql(key)} = ${value} WHERE id = ${logId}`;
    }
  }
}

async function getChangedProducts(sql: any, since: Date | null): Promise<Product[]> {
  if (since) {
    return await sql`
      SELECT 
        p.id, p.name, p.description, p.price, p.currency,
        p.image_url, p.category_id, p.status, p.stock_quantity,
        p.updated_at, p.created_at,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.updated_at > ${since}
    ` as Product[];
  }
  
  return await sql`
    SELECT 
      p.id, p.name, p.description, p.price, p.currency,
      p.image_url, p.category_id, p.status, p.stock_quantity,
      p.updated_at, p.created_at,
      c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.status = 'in_stock'
  ` as Product[];
}

async function getDeletedProductIds(sql: any, since: Date | null): Promise<string[]> {
  if (!since) return [];
  
  try {
    const deletedProducts = await sql`
      SELECT product_id FROM product_deletions 
      WHERE deleted_at > ${since}
    `;
    return deletedProducts.map((row: any) => row.product_id);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_KEY) {
    return NextResponse.json({ 
      success: false, 
      error: 'Algolia is not configured properly' 
    }, { status: 500 });
  }

  const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
  const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY!;
  const ALGOLIA_INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'products';

  const sql = getDb();
  let logId: string | null = null;

  try {
    logId = await createSyncLog(sql, 'running');
    const lastSyncTime = await getLastSyncTime(sql);
    const products = await getChangedProducts(sql, lastSyncTime);
    const deletedProductIds = await getDeletedProductIds(sql, lastSyncTime);

    if (products.length === 0 && deletedProductIds.length === 0) {
      await updateSyncLog(sql, logId, {
        status: 'completed',
        completed_at: new Date(),
        total_products: 0,
        synced_products: 0,
        deleted_products: 0,
      });
      
      return NextResponse.json({
        success: true,
        message: 'No changes detected. Everything is already in sync.',
        syncedCount: 0,
        deletedCount: 0,
      });
    }

    // Stable Algolia v4 client
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(ALGOLIA_INDEX_NAME);

    let syncedCount = 0;
    let deletedCount = 0;

    if (products.length > 0) {
      const algoliaObjects: AlgoliaProduct[] = products.map(formatForAlgolia);
      const BATCH_SIZE = 100;
      
      for (let i = 0; i < algoliaObjects.length; i += BATCH_SIZE) {
        const batch = algoliaObjects.slice(i, i + BATCH_SIZE);
        await index.saveObjects(batch);
        syncedCount += batch.length;
      }
    }

    if (deletedProductIds.length > 0) {
      await index.deleteObjects(deletedProductIds);
      deletedCount = deletedProductIds.length;
    }

    await updateSyncLog(sql, logId, {
      status: 'completed',
      completed_at: new Date(),
      total_products: products.length + deletedProductIds.length,
      synced_products: syncedCount,
      deleted_products: deletedCount,
    });

    return NextResponse.json({
      success: true,
      message: `Delta sync completed. Synced ${syncedCount} products, deleted ${deletedCount} products.`,
      syncedCount,
      deletedCount,
      isDeltaSync: lastSyncTime !== null,
      lastSyncTime: lastSyncTime?.toISOString(),
    });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Algolia sync error:', errorMessage);
    
    if (logId) {
      await updateSyncLog(sql, logId, {
        status: 'failed',
        completed_at: new Date(),
        error_message: errorMessage,
      });
    }
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || !process.env.ALGOLIA_ADMIN_KEY) {
    return NextResponse.json({ 
      configured: false, 
      error: 'Algolia is not configured properly' 
    }, { status: 500 });
  }

  const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
  const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY!;
  const ALGOLIA_INDEX_NAME = process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'products';

  try {
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(ALGOLIA_INDEX_NAME);
    
    const [settings, stats] = await Promise.all([
      index.getSettings(),
      index.getStats(),
    ]);

    const sql = getDb();
    const [productCount] = await sql`
      SELECT COUNT(*) as count FROM products WHERE status = 'in_stock'
    `;
    
    const [lastSync] = await sql`
      SELECT completed_at, synced_products, deleted_products 
      FROM algolia_sync_logs 
      WHERE status = 'completed' 
      ORDER BY completed_at DESC 
      LIMIT 1
    `;

    return NextResponse.json({
      configured: true,
      indexName: ALGOLIA_INDEX_NAME,
      appId: ALGOLIA_APP_ID.slice(0, 4) + '...',
      dbProductCount: safeParseInt(productCount?.count),
      algoliaProductCount: stats.numberOfObjects || 0,
      lastSync: lastSync ? {
        completedAt: lastSync.completed_at,
        syncedProducts: lastSync.synced_products,
        deletedProducts: lastSync.deleted_products,
      } : null,
      settings,
    });
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Algolia status error:', errorMessage);
    return NextResponse.json({ 
      configured: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}
