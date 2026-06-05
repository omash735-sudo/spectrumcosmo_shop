// lib/queue-worker.ts
import { createAlgoliaSyncWorker, algoliaSyncQueue, getQueueStatus } from './algolia-queue';

let isWorkerRunning = false;

export async function initializeQueueWorker() {
  if (isWorkerRunning) {
    console.log('Queue worker already running');
    return;
  }
  
  console.log('Initializing Algolia sync queue worker...');
  
  const worker = createAlgoliaSyncWorker();
  
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });
  
  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });
  
  isWorkerRunning = true;
  console.log('Algolia sync queue worker initialized');
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Shutting down queue worker...');
    await worker.close();
    await algoliaSyncQueue.close();
    process.exit(0);
  });
  
  return worker;
}

// API endpoint to check queue status (add to your API routes)
export async function getQueueStatusAPI() {
  return await getQueueStatus();
}
