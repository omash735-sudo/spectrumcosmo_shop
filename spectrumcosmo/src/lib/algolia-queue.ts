import { Queue, Worker } from 'bullmq';

let queueInstance: Queue | null = null;
let workerInstance: Worker | null = null;

async function syncProductToAlgolia(data: any) {
  // Replace with your actual Algolia sync logic
  console.log('Syncing to Algolia:', data);
}

export function getAlgoliaSyncQueue() {
  if (!queueInstance) {
    queueInstance = new Queue('algolia-sync', {
      connection: { url: process.env.REDIS_URL },
    });
  }
  return queueInstance;
}

export function createAlgoliaSyncWorker() {
  if (!workerInstance) {
    workerInstance = new Worker(
      'algolia-sync',
      async (job) => {
        await syncProductToAlgolia(job.data);
      },
      {
        connection: { url: process.env.REDIS_URL },
      }
    );
  }
  return workerInstance;
}

export const algoliaSyncQueue = getAlgoliaSyncQueue();
