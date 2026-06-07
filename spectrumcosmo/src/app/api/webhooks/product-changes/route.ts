// app/api/webhooks/product-changes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import algoliasearch from 'algoliasearch';

interface ProductChangeWebhook {
  event: 'product.created' | 'product.updated' | 'product.deleted' | 'product.status_changed' | 'product.stock_updated';
  product_id: string;
  timestamp: string;
  user_id?: string;
  changes?: Record<string, any>;
}

const syncQueue = new Map<string, NodeJS.Timeout>();
const SYNC_DEBOUNCE_MS = 5000;

async function triggerAlgoliaSync() {
  try {
    const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
    
    if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
      console.error('Algolia not configured for webhook sync');
      return;
    }

    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
    const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'products');
    
    const sql = getDb();
    // In a real implementation, you would fetch changed product IDs from the queue
    console.log('Algolia sync triggered via webhook');
  } catch (err) {
    console.error('Webhook sync failed:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ProductChangeWebhook;
    
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.PRODUCT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(`Product webhook received: ${body.event} for product ${body.product_id}`);
    
    const sql = getDb();
    await sql`
      INSERT INTO product_change_queue (product_id, event_type, created_at, processed)
      VALUES (${body.product_id}, ${body.event}, NOW(), false)
    `;
    
    const existingTimeout = syncQueue.get('sync');
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(async () => {
      await triggerAlgoliaSync();
      syncQueue.delete('sync');
    }, SYNC_DEBOUNCE_MS);
    
    syncQueue.set('sync', timeout);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook received, sync scheduled',
      event: body.event,
      product_id: body.product_id,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook error:', errorMessage);
    const userMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : errorMessage;
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    // Use queryAsArray to get a real array with indexing
    const pendingItems = await queryAsArray<{ count: string | number }>`
      SELECT COUNT(*) as count FROM product_change_queue WHERE processed = false
    `;
    const pendingCount = pendingItems.length ? Number(pendingItems[0].count) : 0;
    
    return NextResponse.json({
      pendingSyncCount: pendingCount,
      debounceActive: syncQueue.has('sync'),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook GET error:', errorMessage);
    const userMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : errorMessage;
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
