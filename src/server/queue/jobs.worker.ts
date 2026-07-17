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
 * Scheduling strategy:
 *  - Redis ≥ 5: Uses BullMQ queues + cron repeat jobs (full feature set).
 *  - Redis < 5: All BullMQ is skipped. Falls back to Node.js setInterval timers.
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

export type TaskType =
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

// ---------------------------------------------------------------------------
// Job processors
// ---------------------------------------------------------------------------

async function processLowStockCheck(): Promise<void> {
  const products = await Product.find({ quantity: { $lte: 5 }, isActive: true }).limit(20);
  if (products.length === 0) return;
  await NotificationService.send({
    type: 'WARNING',
    title: `⚠️ Low Stock Alert — ${products.length} item(s)`,
    body: `Items critically low: ${products.slice(0, 3).map(p => p.name).join(', ')}${products.length > 3 ? '…' : ''}`,
    channels: ['IN_APP'],
    targetRole: 'admin',
  });
  logger.info(`[Job] CHECK_LOW_STOCK: ${products.length} items below threshold.`);
}

async function processLogRotation(): Promise<void> {
  const cutoff = new Date(Date.now() - 90 * 86400000);
  const result = await AuditLog.deleteMany({ createdAt: { $lt: cutoff } });
  logger.info(`[Job] DB_CLEANUP: Deleted ${result.deletedCount} audit log entries older than 90 days.`);
}

async function processExpirePromotions(): Promise<void> {
  const now = new Date();
  const result = await Promotion.updateMany(
    { isActive: true, endDate: { $lt: now } },
    { $set: { isActive: false } }
  );
  logger.info(`[Job] EXPIRE_PROMOTIONS: Deactivated ${result.modifiedCount} expired promotions.`);
}

async function processExpireGiftCards(): Promise<void> {
  const now = new Date();
  const result = await GiftCard.updateMany(
    { status: 'ACTIVE', expiresAt: { $lt: now } },
    { $set: { status: 'EXPIRED' } }
  );
  logger.info(`[Job] EXPIRE_GIFT_CARDS: Expired ${result.modifiedCount} gift cards.`);
}

async function processReorderSuggestions(): Promise<void> {
  const items = await Product.find({
    isActive: true,
    $expr: { $lte: ['$quantity', '$reorderPoint'] },
  }).limit(10);
  if (items.length === 0) return;
  await NotificationService.send({
    type: 'INFO',
    title: `📦 Reorder Suggestions — ${items.length} item(s)`,
    body: `Consider restocking: ${items.slice(0, 3).map(p => p.name).join(', ')}${items.length > 3 ? '…' : ''}`,
    channels: ['IN_APP'],
    targetRole: 'admin',
  });
  logger.info(`[Job] REORDER_SUGGESTIONS: ${items.length} items at or below reorder point.`);
}

async function processLoyaltyTierRecalc(): Promise<void> {
  const customers = await Customer.find({ isActive: true });
  let updated = 0;
  for (const customer of customers) {
    const pts = customer.loyaltyPoints ?? 0;
    const tier =
      pts >= 5000 ? 'PLATINUM' :
      pts >= 2000 ? 'GOLD'     :
      pts >= 500  ? 'SILVER'   : 'BRONZE';
    if (customer.loyaltyTier !== tier) {
      customer.loyaltyTier = tier as 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
      await customer.save();
      updated++;
    }
  }
  logger.info(`[Job] LOYALTY_TIER_RECALC: ${updated} customer tiers updated.`);
}

async function processFlushScheduledNotifs(): Promise<void> {
  const { Notification } = await import('../models/Notification.js');
  const now = new Date();
  const due = await Notification.find({ scheduledAt: { $lte: now }, status: 'UNREAD' }).limit(50);
  for (const notif of due) {
    notif.status = 'READ';
    await notif.save();
  }
  if (due.length > 0) logger.info(`[Job] FLUSH_SCHEDULED_NOTIFS: Dispatched ${due.length} scheduled notifications.`);
}

async function processSyncOfflineStats(): Promise<void> {
  logger.info('[Job] SYNC_OFFLINE_STATS: Offline stats sync triggered (no-op in dev).');
}

async function processGenerateDailyReport(): Promise<void> {
  const { Transaction } = await import('../models/Transaction.js');
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const end   = new Date(); end.setHours(23, 59, 59, 999);
  const txCount = await Transaction.countDocuments({ createdAt: { $gte: start, $lte: end } });
  const revenue = await Transaction.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end }, status: 'COMPLETED' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
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
// Direct dispatcher (used by both BullMQ wrapper and fallback scheduler)
// ---------------------------------------------------------------------------

export async function directDispatch(task: TaskType): Promise<void> {
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
// BullMQ job wrapper (only used when Redis ≥ 5)
// ---------------------------------------------------------------------------

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
async function dispatchTask(job: Job<any>): Promise<void> {
  const task: TaskType = job.data?.task ?? job.name;
  return directDispatch(task);
}

// ---------------------------------------------------------------------------
// Node.js setInterval fallback (used when Redis < 5)
// ---------------------------------------------------------------------------

const MS = {
  MINUTE:  60_000,
  HOUR:    3_600_000,
  DAY:    86_400_000,
};

function scheduleInterval(name: TaskType, intervalMs: number): void {
  const fn = async () => {
    try {
      logger.info(`[Scheduler] Running fallback interval job: ${name}`);
      await directDispatch(name);
    } catch (err) {
      logger.error(`[Scheduler] Fallback job [${name}] failed:`, err);
    }
  };
  setInterval(fn, intervalMs);
  logger.info(`[Scheduler] Fallback setInterval registered: [${name}] every ${Math.round(intervalMs / 1000)}s`);
}

function startFallbackScheduler(): void {
  logger.warn('[Scheduler] Redis < 5 detected — BullMQ disabled. Starting Node.js setInterval fallback.');
  scheduleInterval('CHECK_LOW_STOCK',        MS.HOUR);
  scheduleInterval('DB_CLEANUP',             MS.DAY);
  scheduleInterval('EXPIRE_PROMOTIONS',      MS.DAY);
  scheduleInterval('EXPIRE_GIFT_CARDS',      MS.DAY);
  scheduleInterval('REORDER_SUGGESTIONS',    8  * MS.HOUR);
  scheduleInterval('LOYALTY_TIER_RECALC',    7  * MS.DAY);
  scheduleInterval('FLUSH_SCHEDULED_NOTIFS', 5  * MS.MINUTE);
  scheduleInterval('GENERATE_DAILY_REPORT',  MS.DAY);
  scheduleInterval('WARRANTY_EXPIRY_ALERT',  MS.DAY);
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

export async function initializeBackgroundWorkers(): Promise<void> {
  // Step 1: Probe Redis version — this must run before ANY BullMQ instantiation
  const compatible = await QueueManager.checkRedisCompatibility();

  if (!compatible) {
    // Redis < 5: skip BullMQ entirely, use setInterval fallback
    startFallbackScheduler();
    return;
  }

  // Step 2: Redis ≥ 5 path — register BullMQ queue + worker + cron jobs
  const manager = QueueManager.getInstance();
  manager.registerQueue(QUEUE);
  manager.registerWorker(QUEUE, dispatchTask);

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

  logger.info('[BullMQ] All background workers and cron schedules registered (9 jobs total).');
}
