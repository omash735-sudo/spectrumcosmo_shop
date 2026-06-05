// lib/algolia-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { algoliasearch } from 'algoliasearch';
import { getDb } from './db';

// Types
interface SyncJobData {
  type: 'full_sync' | 'delta_sync' | 'single_product';
  productId?: string;
  userId?: string;
}

interface SyncResult {
  success: boolean;
  syncedCount: number;
  deletedCount: number;
  error?: string;
}

// Redis connection
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Queue name
const ALGOLIA_SYNC_QUEUE = 'algolia-sync-queue';

// Create queue
export const algoliaSyncQueue = new Queue<SyncJobData>(ALGOLIA_SYNC_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Worker to process jobs
export function createAlgoliaSyncWorker() {
  return new Worker<SyncJobData, SyncResult>(
    ALGOLIA_SYNC_QUEUE,
    async (job) => {
      const { type, productId } = job.data;
      console.log(`Processing sync job ${job.id}: type=${type}, productId=${productId}`);
      
      const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
      const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY;
      
      if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
        throw new Error('Algolia not configured');
      }
      
      const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
      const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'products');
      const sql = getDb();
      
      try {
        if (type === 'single_product' && productId) {
          // Sync single product
          const [product] = await sql`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.price,
              p.currency,
              p.image_url,
              p.category_id,
              p.status,
              p.stock_quantity,
              p.updated_at,
              p.created_at,
              c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ${productId}
          `;
          
          if (product) {
            const algoliaProduct = {
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
              updated_at: new Date().toISOString(),
            };
            
            await index.saveObject(algoliaProduct);
            return { success: true, syncedCount: 1, deletedCount: 0 };
          } else {
            // Product was deleted, remove from Algolia
            await index.deleteObject(productId);
            return { success: true, syncedCount: 0, deletedCount: 1 };
          }
        } 
        else if (type === 'delta_sync') {
          // Delta sync - get products changed in last hour
          const products = await sql`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.price,
              p.currency,
              p.image_url,
              p.category_id,
              p.status,
              p.stock_quantity,
              p.updated_at,
              p.created_at,
              c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.updated_at > NOW() - INTERVAL '1 hour'
          `;
          
          const algoliaObjects = products.map((p: any) => ({
            objectID: p.id,
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price,
            currency: p.currency || 'MWK',
            image_url: p.image_url || '',
            category_id: p.category_id,
            category_name: p.category_name,
            stock_quantity: p.stock_quantity,
            is_available: p.status === 'in_stock' && p.stock_quantity > 0,
            in_stock: p.status === 'in_stock',
            updated_at: new Date().toISOString(),
          }));
          
          const BATCH_SIZE = 100;
          for (let i = 0; i < algoliaObjects.length; i += BATCH_SIZE) {
            const batch = algoliaObjects.slice(i, i + BATCH_SIZE);
            await index.saveObjects(batch);
          }
          
          return { success: true, syncedCount: algoliaObjects.length, deletedCount: 0 };
        }
        else if (type === 'full_sync') {
          // Full sync - get all active products
          const products = await sql`
            SELECT 
              p.id,
              p.name,
              p.description,
              p.price,
              p.currency,
              p.image_url,
              p.category_id,
              p.status,
              p.stock_quantity,
              p.updated_at,
              p.created_at,
              c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.status = 'in_stock'
          `;
          
          const algoliaObjects = products.map((p: any) => ({
            objectID: p.id,
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.price,
            currency: p.currency || 'MWK',
            image_url: p.image_url || '',
            category_id: p.category_id,
            category_name: p.category_name,
            stock_quantity: p.stock_quantity,
            is_available: p.status === 'in_stock' && p.stock_quantity > 0,
            in_stock: p.status === 'in_stock',
            updated_at: new Date().toISOString(),
          }));
          
          // Replace all objects
          await index.replaceAllObjects(algoliaObjects);
          
          return { success: true, syncedCount: algoliaObjects.length, deletedCount: 0 };
        }
        
        return { success: false, syncedCount: 0, deletedCount: 0, error: 'Invalid job type' };
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error(`Job ${job.id} failed:`, errorMessage);
        throw err;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1, // Process one sync at a time
      limiter: {
        max: 10,
        duration: 60000, // 10 jobs per minute
      },
    }
  );
}

// Helper function to add sync job
export async function addSyncJob(type: SyncJobData['type'], productId?: string): Promise<string> {
  const job = await algoliaSyncQueue.add(`sync-${type}`, {
    type,
    productId,
  }, {
    priority: type === 'single_product' ? 1 : type === 'delta_sync' ? 2 : 3,
  });
  
  return job.id ?? '';
}

// Get queue status
export async function getQueueStatus() {
  const counts = await algoliaSyncQueue.getJobCounts();
  const jobs = await algoliaSyncQueue.getJobs(['waiting', 'active', 'completed', 'failed'], 0, 10);
  
  return {
    counts,
    recentJobs: jobs.map(job => ({
      id: job.id,
      name: job.name,
      data: job.data,
      status: await job.getState(),
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
    })),
  };
}

// Cleanup function
export async function closeQueue() {
  await algoliaSyncQueue.close();
  await redisConnection.quit();
}
