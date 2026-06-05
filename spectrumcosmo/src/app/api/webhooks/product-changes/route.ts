// app/api/webhooks/product-changes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { algoliasearch } from 'algoliasearch';

interface ProductChangeWebhook {
  event: 'product.created' | 'product.updated' | 'product.deleted' | 'product.status_changed' | 'product.stock_updated';
  product_id: string;
  timestamp: string;
  user_id?: string;
  changes?: Record<string, any>;
}

// Queue system for debouncing sync requests
const syncQueue = new Map<string, NodeJS.Timeout>();
const SYNC_DEBOUNCE_MS = 5000; // Wait 5 seconds after last change before syncing

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
    
    // Get the specific product that changed
    // For delta sync, we need to know which product changed
    // This is simplified - in production, you'd store the changed product IDs
    
    console.log('Algolia sync triggered via webhook');
  } catch (err) {
    console.error('Webhook sync failed:', err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as ProductChangeWebhook;
    
    // Validate webhook secret (for security)
    const webhookSecret = req.headers.get('x-webhook-secret');
    if (webhookSecret !== process.env.PRODUCT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Log the webhook event
    console.log(`Product webhook received: ${body.event} for product ${body.product_id}`);
    
    // Record the change in database for delta sync
    const sql = getDb();
    await sql`
      INSERT INTO product_change_queue (product_id, event_type, created_at, processed)
      VALUES (${body.product_id}, ${body.event}, NOW(), false)
    `;
    
    // Debounce sync to avoid multiple rapid syncs
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
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET endpoint to check pending sync items
export async function GET(req: NextRequest) {
  try {
    const sql = getDb();
    const pendingItems = await sql`
      SELECT COUNT(*) as count FROM product_change_queue WHERE processed = false
    `;
    
    return NextResponse.json({
      pendingSyncCount: parseInt((pendingItems[0] as any)?.count || '0', 10),
      debounceActive: syncQueue.has('sync'),
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
