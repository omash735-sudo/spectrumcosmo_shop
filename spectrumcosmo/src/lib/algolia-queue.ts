// lib/algolia-queue.ts
import { Queue, Worker } from 'bullmq';
import algoliasearch from 'algoliasearch';
import { getDb, queryOne, queryMany } from './db';

interface SyncJobData {
  type: 'full_sync' | 'delta_sync' | 'single_product';
  productId?: string;
}

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
  category_name?: string;
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
}

// Redis connection configuration (avoids ioredis instance type conflict)
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
};

const QUEUE_NAME = 'algolia-sync-queue';

export const algoliaSyncQueue = new Queue<SyncJobData>(QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
  },
});

export function createAlgoliaSyncWorker() {
  return new Worker<SyncJobData>(
    QUEUE_NAME,
    async (job) => {
      const { type, productId } = job.data;

      const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
      const apiKey = process.env.ALGOLIA_ADMIN_KEY;

      if (!appId || !apiKey) {
        throw new Error('Algolia credentials not configured');
      }

      const client = algoliasearch(appId, apiKey);
      const index = client.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'products');
      const sql = getDb();

      if (type === 'single_product' && productId) {
        const product = await queryOne<Product>`
          SELECT 
            p.id, p.name, p.description, p.price, p.currency,
            p.image_url, p.category_id, p.status, p.stock_quantity,
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.id = ${productId}
        `;

        if (product) {
          await index.saveObject({
            objectID: product.id,
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            currency: product.currency || 'MWK',
            image_url: product.image_url || '',
            category_id: product.category_id,
            category_name: product.category_name || null,
            stock_quantity: product.stock_quantity,
            is_available: product.status === 'in_stock' && product.stock_quantity > 0,
          });
        } else {
          await index.deleteObject(productId);
        }

        return { synced: 1 };
      }

      if (type === 'delta_sync') {
        const products = await queryMany<Product>`
          SELECT 
            p.id, p.name, p.description, p.price, p.currency,
            p.image_url, p.category_id, p.status, p.stock_quantity,
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.updated_at > NOW() - INTERVAL '1 hour'
        `;

        const objects: AlgoliaProduct[] = products.map((p) => ({
          objectID: p.id,
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          currency: p.currency || 'MWK',
          image_url: p.image_url || '',
          category_id: p.category_id,
          category_name: p.category_name || null,
          stock_quantity: p.stock_quantity,
          is_available: p.status === 'in_stock' && p.stock_quantity > 0,
        }));

        for (let i = 0; i < objects.length; i += 100) {
          await index.saveObjects(objects.slice(i, i + 100));
        }

        return { synced: objects.length };
      }

      if (type === 'full_sync') {
        const products = await queryMany<Product>`
          SELECT 
            p.id, p.name, p.description, p.price, p.currency,
            p.image_url, p.category_id, p.status, p.stock_quantity,
            c.name as category_name
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          WHERE p.status = 'in_stock'
        `;

        const objects: AlgoliaProduct[] = products.map((p) => ({
          objectID: p.id,
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: p.price,
          currency: p.currency || 'MWK',
          image_url: p.image_url || '',
          category_id: p.category_id,
          category_name: p.category_name || null,
          stock_quantity: p.stock_quantity,
          is_available: true,
        }));

        await index.replaceAllObjects(objects);
        return { synced: objects.length };
      }

      return { synced: 0 };
    },
    {
      connection: redisConfig,
      concurrency: 1,
    }
  );
}

export async function addSyncJob(type: SyncJobData['type'], productId?: string): Promise<string> {
  const job = await algoliaSyncQueue.add(`sync-${type}`, { type, productId });
  return job.id;
}
