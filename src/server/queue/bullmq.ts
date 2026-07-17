/**
 * bullmq.ts
 * Singleton QueueManager: registers BullMQ queues, workers, and cron jobs.
 *
 * New in Phase 15:
 *  - registerCronJob(): schedule a repeating job via BullMQ's repeat options
 *  - getQueueMetrics(): return real waiting/active/failed/completed counts
 *  - pauseQueue() / resumeQueue(): operational control
 *  - listCronJobs(): enumerate all registered repeatable jobs
 */

import { Queue, Worker, type Job } from 'bullmq';
import { logger } from '../logger.js';
import { config } from '../../config/environment.js';

const REDIS_CONN = { url: config.redisUrl };

export interface QueueMetric {
  name: string;
  status: 'HEALTHY' | 'PAUSED' | 'ERROR';
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  concurrency: number;
  isPaused: boolean;
}

export interface CronJobSpec {
  queueName: string;
  jobName: string;
  cron: string;        // Standard 5-field cron expression
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  data?: Record<string, any>;
}

export class QueueManager {
  private static instance: QueueManager | null = null;
  private queues: Map<string, Queue> = new Map();
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private workers: Map<string, Worker<any, any, string>> = new Map();
  private cronSpecs: CronJobSpec[] = [];

  private constructor() {}

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  // ---- Queue ----------------------------------------------------------------

  public registerQueue(name: string): Queue {
    if (this.queues.has(name)) return this.queues.get(name)!;
    const queue = new Queue(name, { connection: REDIS_CONN });
    this.queues.set(name, queue);
    logger.info(`BullMQ Queue registered: [${name}]`);
    return queue;
  }

  // ---- Worker ---------------------------------------------------------------

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  public registerWorker(name: string, handler: (job: Job<any>) => Promise<void>): Worker {
    if (this.workers.has(name)) return this.workers.get(name)!;

    const worker = new Worker(
      name,
      async (job) => {
        logger.info(`Processing BullMQ job [${job.id}] in queue [${name}]: task=${job.data?.task ?? job.name}`);
        await handler(job);
      },
      { connection: REDIS_CONN, concurrency: 5 }
    );

    worker.on('failed', (job, err) => {
      logger.error(`BullMQ job [${job?.id}] failed in worker [${name}]:`, err);
    });

    worker.on('completed', (job) => {
      logger.info(`BullMQ job [${job.id}] completed in worker [${name}]`);
    });

    this.workers.set(name, worker);
    logger.info(`BullMQ Worker active for queue: [${name}]`);
    return worker;
  }

  // ---- Cron Jobs ------------------------------------------------------------

  /**
   * Schedule a repeating job using BullMQ's built-in repeat/cron support.
   * The job will be automatically re-queued after each execution.
   */
  public async registerCronJob(spec: CronJobSpec): Promise<void> {
    const queue = this.registerQueue(spec.queueName);
    await queue.add(
      spec.jobName,
      { task: spec.jobName, ...spec.data },
      {
        repeat: { pattern: spec.cron },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 50 },
      }
    );
    this.cronSpecs.push(spec);
    logger.info(`BullMQ CronJob registered: [${spec.jobName}] @ "${spec.cron}" on queue [${spec.queueName}]`);
  }

  /**
   * Return list of all registered cron job specifications.
   */
  public listCronJobs(): CronJobSpec[] {
    return [...this.cronSpecs];
  }

  // ---- Queue Control --------------------------------------------------------

  public async pauseQueue(name: string): Promise<boolean> {
    const queue = this.queues.get(name);
    if (!queue) return false;
    await queue.pause();
    logger.info(`BullMQ Queue paused: [${name}]`);
    return true;
  }

  public async resumeQueue(name: string): Promise<boolean> {
    const queue = this.queues.get(name);
    if (!queue) return false;
    await queue.resume();
    logger.info(`BullMQ Queue resumed: [${name}]`);
    return true;
  }

  // ---- Metrics --------------------------------------------------------------

  public async getQueueMetrics(): Promise<QueueMetric[]> {
    const results: QueueMetric[] = [];
    for (const [name, queue] of this.queues.entries()) {
      try {
        const [waiting, active, completed, failed, delayed, isPaused] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount(),
          queue.isPaused(),
        ]);
        results.push({
          name,
          status: isPaused ? 'PAUSED' : failed > 10 ? 'ERROR' : 'HEALTHY',
          waiting,
          active,
          completed,
          failed,
          delayed,
          concurrency: 5,
          isPaused,
        });
      } catch {
        results.push({ name, status: 'ERROR', waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, concurrency: 5, isPaused: false });
      }
    }
    return results;
  }

  public getWorkerNames(): string[] {
    return [...this.workers.keys()];
  }

  // ---- Shutdown -------------------------------------------------------------

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
