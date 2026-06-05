// lib/queue-worker.ts
import { createAlgoliaSyncWorker, algoliaSyncQueue } from './algolia-queue';

let isWorkerRunning = false;

export async function initializeQueueWorker() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set. Queue worker disabled.');
    return null;
  }

  if (isWorkerRunning) {
    return null;
  }

  const worker = createAlgoliaSyncWorker();

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  isWorkerRunning = true;

  process.on('SIGTERM', async () => {
    await worker.close();
    await algoliaSyncQueue.close();
  });

  process.on('SIGINT', async () => {
    await worker.close();
    await algoliaSyncQueue.close();
  });

  return worker;
}

export async function getQueueHealth() {
  return {
    running: isWorkerRunning,
    configured: !!process.env.REDIS_URL,
  };
}
