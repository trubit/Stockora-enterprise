/**
 * jobs.worker.ts
 * Background job processors for the Stockora automation engine.
 *
 * Registered jobs:
 *  1. CHECK_LOW_STOCK          — Alert when products dip below threshold
 *  2. DB_CLEANUP               — Rotate old audit logs (>90 days)
 *  3. EXPIRE_PROMOTIONS        — Deactivate expired promo codes
 *  4. EXPIRE_GIFT_CARDS        — Deactivate expired gift cards
 *  5. REORDER_SUGGESTIONS      — Notify manager of items needing PO
 *  6. LOYALTY_TIER_RECALC      — Recalculate all customer loyalty tiers
 *  7. FLUSH_SCHEDULED_NOTIFS   — Deliver any due scheduled notifications
 *  8. SYNC_OFFLINE_STATS       — Aggregate offline sync metrics to DB
 *  9. GENERATE_DAILY_REPORT    — Compute daily sales summary
 * 10. WARRANTY_EXPIRY_ALERT    — Alert for warranties expiring in 30 days
 *
 * Cron schedules (registered after workers are wired):
 *  CHECK_LOW_STOCK          → every 1 hour
 *  DB_CLEANUP               → daily at 02:00
 *  EXPIRE_PROMOTIONS        → daily at 00:30
 *  EXPIRE_GIFT_CARDS        → daily at 00:45
 *  REORDER_SUGGESTIONS      → Mon-Fri 08:00
 *  LOYALTY_TIER_RECALC      → Sunday 03:00
 *  FLUSH_SCHEDULED_NOTIFS   → every 5 minutes
 *  GENERATE_DAILY_REPORT    → daily at 23:55
 *  WARRANTY_EXPIRY_ALERT    → daily at 09:00
 */

import type { Job } from 'bullmq';
import { QueueManager } from './bullmq.js';
import { Product } from '../models/Product.js';
import { AuditLog } from '../models/AuditLog.js';
import { Promotion } from '../models/Promotion.js';
import { GiftCard } from '../models/GiftCard.js';
import { Customer } from '../models/Customer.js';
import { NotificationService } from '../services/notification.service.js';
import { logger } from '../logger.js';

const QUEUE = 'system-automation';

// ---------------------------------------------------------------------------
// Job type registry
// ---------------------------------------------------------------------------

type TaskType =
  | 'CHECK_LOW_STOCK'
  | 'DB_CLEANUP'
  | 'EXPIRE_PROMOTIONS'
  | 'EXPIRE_GIFT_CARDS'
  | 'REORDER_SUGGESTIONS'
  | 'LOYALTY_TIER_RECALC'
  | 'FLUSH_SCHEDULED_NOTIFS'
  | 'SYNC_OFFLINE_STATS'
  | 'GENERATE_DAILY_REPORT'
  | 'WARRANTY_EXPIRY_ALERT';

// Loyalty tier thresholds (mirrors promo.service.ts)
const TIER_THRESHOLDS = { PLATINUM: 5000, GOLD: 2000, SILVER: 500, BRONZE: 0 };

function recalcTier(pts: number): 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  if (pts >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (pts >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (pts >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

// ---------------------------------------------------------------------------
// Processor implementations
// ---------------------------------------------------------------------------

async function processLowStockCheck(): Promise<void> {
  const products = await Product.find({ isActive: true });
  let alertCount = 0;
  for (const p of products) {
    if (p.quantity <= p.lowStockAlert) {
      alertCount++;
      await NotificationService.send({
        type: 'WARNING',
        title: `⚠️ Low Stock: ${p.name}`,
        body: `SKU [${p.sku}] is at ${p.quantity} units (threshold: ${p.lowStockAlert}). Reorder immediately.`,
        channels: ['IN_APP'],
      });
    }
  }
  logger.info(`[Job] CHECK_LOW_STOCK: ${alertCount} alerts generated.`);
}

async function processLogRotation(): Promise<void> {
  const cutoff = new Date(Date.now() - 90 * 86400000);
  const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
  logger.info(`[Job] DB_CLEANUP: Deleted ${result.deletedCount} audit log records older than 90 days.`);
}

async function processExpirePromotions(): Promise<void> {
  const result = await Promotion.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
  logger.info(`[Job] EXPIRE_PROMOTIONS: Deactivated ${result.modifiedCount} expired promotions.`);
}

async function processExpireGiftCards(): Promise<void> {
  const result = await GiftCard.updateMany(
    { expiresAt: { $lte: new Date() }, isActive: true },
    { $set: { isActive: false } }
  );
  logger.info(`[Job] EXPIRE_GIFT_CARDS: Deactivated ${result.modifiedCount} expired gift cards.`);
}

async function processReorderSuggestions(): Promise<void> {
  const products = await Product.find({ isActive: true, quantity: { $lte: 0 } });
  if (products.length === 0) return;
  await NotificationService.send({
    type: 'TASK',
    title: `📦 Reorder Required: ${products.length} item(s) out of stock`,
    body: `Products with zero stock: ${products.map((p) => p.name).slice(0, 5).join(', ')}${products.length > 5 ? ' …and more' : ''}.`,
    channels: ['IN_APP'],
    targetRole: 'manager',
  });
  logger.info(`[Job] REORDER_SUGGESTIONS: Notified about ${products.length} zero-stock items.`);
}

async function processLoyaltyTierRecalc(): Promise<void> {
  const customers = await Customer.find({ isActive: true });
  let updated = 0;
  for (const c of customers) {
    const newTier = recalcTier(c.loyaltyPoints);
    if (c.loyaltyTier !== newTier) {
      c.loyaltyTier = newTier;
      await c.save();
      updated++;
    }
  }
  logger.info(`[Job] LOYALTY_TIER_RECALC: Updated tier for ${updated} customers.`);
}

async function processFlushScheduledNotifs(): Promise<void> {
  await NotificationService.flushScheduled();
  logger.info(`[Job] FLUSH_SCHEDULED_NOTIFS: Scheduled notifications flushed.`);
}

async function processSyncOfflineStats(): Promise<void> {
  // Placeholder — in production, aggregate metrics from Redis or a dedicated model
  logger.info(`[Job] SYNC_OFFLINE_STATS: Offline stat aggregation placeholder.`);
}

async function processGenerateDailyReport(): Promise<void> {
  // Import lazily to avoid circular deps at module load time
  const { Transaction } = await import('../models/Transaction.js');
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(); endOfDay.setHours(23, 59, 59, 999);

  const [txCount, revenue] = await Promise.all([
    Transaction.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay }, status: 'COMPLETED' }),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: startOfDay, $lte: endOfDay }, status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  const totalRevenue = revenue[0]?.total ?? 0;
  await NotificationService.send({
    type: 'INFO',
    title: `📊 Daily Report — ${new Date().toLocaleDateString()}`,
    body: `Transactions: ${txCount} | Revenue: $${totalRevenue.toFixed(2)}`,
    channels: ['IN_APP'],
    targetRole: 'admin',
  });
  logger.info(`[Job] GENERATE_DAILY_REPORT: ${txCount} txns, $${totalRevenue.toFixed(2)} revenue.`);
}

async function processWarrantyExpiryAlert(): Promise<void> {
  const { Warranty } = await import('../models/Warranty.js');
  const in30Days = new Date(Date.now() + 30 * 86400000);
  const expiring = await Warranty.find({ expiresAt: { $lte: in30Days, $gte: new Date() } }).limit(50);
  if (expiring.length === 0) return;
  await NotificationService.send({
    type: 'WARNING',
    title: `🛡️ ${expiring.length} warranty(ies) expiring within 30 days`,
    body: `Earliest: ${expiring[0].productName} — expires ${new Date(expiring[0].expiresAt).toLocaleDateString()}.`,
    channels: ['IN_APP'],
    targetRole: 'admin',
  });
  logger.info(`[Job] WARRANTY_EXPIRY_ALERT: ${expiring.length} warranties expiring within 30 days.`);
}

// ---------------------------------------------------------------------------
// Interval-based fallback scheduler (used when Redis < 5 is detected)
// ---------------------------------------------------------------------------

const MS = {
  MINUTE:  60_000,
  HOUR:    3_600_000,
  DAY:    86_400_000,
};

function scheduleInterval(name: TaskType, intervalMs: number, dispatchFn: (name: TaskType) => Promise<void>): void {
  const fn = async () => {
    try {
      logger.info(`[Scheduler] Running fallback interval job: ${name}`);
      await dispatchFn(name);
    } catch (err) {
      logger.error(`[Scheduler] Fallback job [${name}] failed:`, err);
    }
  };
  setInterval(fn, intervalMs);
  logger.info(`[Scheduler] Fallback setInterval registered: [${name}] every ${intervalMs / 1000}s`);
}

function startFallbackScheduler(): void {
  logger.warn('[Scheduler] BullMQ cron unsupported (Redis < 5). Starting Node.js setInterval fallback for all background jobs.');
  scheduleInterval('CHECK_LOW_STOCK',        MS.HOUR,              directDispatch);
  scheduleInterval('DB_CLEANUP',             MS.DAY,               directDispatch);
  scheduleInterval('EXPIRE_PROMOTIONS',      MS.DAY,               directDispatch);
  scheduleInterval('EXPIRE_GIFT_CARDS',      MS.DAY,               directDispatch);
  scheduleInterval('REORDER_SUGGESTIONS',    8 * MS.HOUR,          directDispatch);
  scheduleInterval('LOYALTY_TIER_RECALC',    7  * MS.DAY,          directDispatch);
  scheduleInterval('FLUSH_SCHEDULED_NOTIFS', 5  * MS.MINUTE,       directDispatch);
  scheduleInterval('GENERATE_DAILY_REPORT',  MS.DAY,               directDispatch);
  scheduleInterval('WARRANTY_EXPIRY_ALERT',  MS.DAY,               directDispatch);
}

// ---------------------------------------------------------------------------
// Direct dispatcher (used by fallback, avoids BullMQ Job wrapper dependency)
// ---------------------------------------------------------------------------

async function directDispatch(task: TaskType): Promise<void> {
  switch (task) {
    case 'CHECK_LOW_STOCK':         return processLowStockCheck();
    case 'DB_CLEANUP':              return processLogRotation();
    case 'EXPIRE_PROMOTIONS':       return processExpirePromotions();
    case 'EXPIRE_GIFT_CARDS':       return processExpireGiftCards();
    case 'REORDER_SUGGESTIONS':     return processReorderSuggestions();
    case 'LOYALTY_TIER_RECALC':     return processLoyaltyTierRecalc();
    case 'FLUSH_SCHEDULED_NOTIFS':  return processFlushScheduledNotifs();
    case 'SYNC_OFFLINE_STATS':      return processSyncOfflineStats();
    case 'GENERATE_DAILY_REPORT':   return processGenerateDailyReport();
    case 'WARRANTY_EXPIRY_ALERT':   return processWarrantyExpiryAlert();
    default:
      logger.warn(`[Scheduler] Unknown task: ${task}`);
  }
}

// ---------------------------------------------------------------------------
// Router (BullMQ job wrapper → directDispatch)
// ---------------------------------------------------------------------------

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
async function dispatchTask(job: Job<any>): Promise<void> {
  const task: TaskType = job.data?.task ?? job.name;
  return directDispatch(task);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export async function initializeBackgroundWorkers(): Promise<void> {
  const manager = QueueManager.getInstance();

  // Register queue + worker — always safe even on Redis 3.x
  manager.registerQueue(QUEUE);
  manager.registerWorker(QUEUE, dispatchTask);

  // Attempt BullMQ cron registration; fall back to setInterval if Redis Streams
  // are unsupported (Redis < 5 returns ERR on XADD inside Lua scripts)
  try {
    await Promise.all([
      manager.registerCronJob({ queueName: QUEUE, jobName: 'CHECK_LOW_STOCK',         cron: '0 * * * *'     }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'DB_CLEANUP',              cron: '0 2 * * *'     }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'EXPIRE_PROMOTIONS',       cron: '30 0 * * *'    }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'EXPIRE_GIFT_CARDS',       cron: '45 0 * * *'    }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'REORDER_SUGGESTIONS',     cron: '0 8 * * 1-5'   }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'LOYALTY_TIER_RECALC',     cron: '0 3 * * 0'     }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'FLUSH_SCHEDULED_NOTIFS',  cron: '*/5 * * * *'   }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'GENERATE_DAILY_REPORT',   cron: '55 23 * * *'   }),
      manager.registerCronJob({ queueName: QUEUE, jobName: 'WARRANTY_EXPIRY_ALERT',   cron: '0 9 * * *'     }),
    ]);
    logger.info('[BullMQ] All background workers and cron schedules registered (10 jobs total).');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Unknown Redis command') || msg.includes('XADD') || msg.includes('XREAD') || msg.includes('ERR Error running script')) {
      startFallbackScheduler();
    } else {
      // Re-throw unexpected errors
      throw err;
    }
  }
}

