import { createAlgoliaSyncWorker, getAlgoliaSyncQueue } from './algolia-queue';

let isWorkerRunning = false;
let algoliaSyncQueue: ReturnType<typeof getAlgoliaSyncQueue> | null = null;

export async function initializeQueueWorker() {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set. Queue worker disabled.');
    return null;
  }

  if (isWorkerRunning) {
    return null;
  }

  algoliaSyncQueue = getAlgoliaSyncQueue();
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
    if (algoliaSyncQueue) await algoliaSyncQueue.close();
  });

  process.on('SIGINT', async () => {
    await worker.close();
    if (algoliaSyncQueue) await algoliaSyncQueue.close();
  });

  return worker;
}

export async function getQueueHealth() {
  return {
    running: isWorkerRunning,
    configured: !!process.env.REDIS_URL,
    queueName: algoliaSyncQueue?.name || 'not-initialized',
  };
}
