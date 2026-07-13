import { Queue, Worker } from 'bullmq';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';

export class QueueManager {
  private static instance: QueueManager | null = null;
  private queues: Map<string, Queue> = new Map();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private workers: Map<string, Worker<any, any, string>> = new Map();

  private constructor() {}

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public registerQueue(name: string): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, {
      connection: {
        url: config.redisUrl,
      },
    });

    this.queues.set(name, queue);
    logger.info(`BullMQ Queue registered: [${name}]`);
    return queue;
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public registerWorker(name: string, handler: (job: any) => Promise<void>): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker(
      name,
      async (job) => {
        logger.info(`Processing BullMQ job [${job.id}] in queue [${name}]`);
        await handler(job);
      },
      {
        connection: {
          url: config.redisUrl,
        },
        concurrency: 5,
      }
    );

    worker.on('failed', (job, err) => {
      logger.error(`BullMQ job [${job?.id}] failed in worker [${name}]:`, err);
    });

    worker.on('completed', (job) => {
      logger.info(`BullMQ job [${job.id}] completed successfully in worker [${name}]`);
    });

    this.workers.set(name, worker);
    logger.info(`BullMQ Worker active for queue: [${name}]`);
    return worker;
  }

  public async shutdown(): Promise<void> {
    logger.info('Closing all BullMQ queues and workers...');
    for (const [name, queue] of this.queues.entries()) {
      await queue.close();
      logger.info(`Queue [${name}] closed.`);
    }
    for (const [name, worker] of this.workers.entries()) {
      await worker.close();
      logger.info(`Worker [${name}] closed.`);
    }
  }
}
