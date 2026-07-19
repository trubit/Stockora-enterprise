import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { ERPSyncService } from '../services/integration/erpSync.service.js';
import { Transaction } from '../models/Transaction.js';
import { AuditLog } from '../models/AuditLog.js';
import { ValidationError } from '../errors/AppError.js';
import { verifyPaystackSignature } from '../utils/paystack.js';
import mongoose from 'mongoose';

export class IntegrationController {
  public static async triggerSync(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { platform } = req.body; // 'QUICKBOOKS' or 'XERO'
    if (!platform || (platform !== 'QUICKBOOKS' && platform !== 'XERO')) {
      return next(new ValidationError('Platform selection must be QUICKBOOKS or XERO.'));
    }

    try {
      const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(10);
      let successCount = 0;

      for (const tx of transactions) {
        const journal = await ERPSyncService.buildJournalEntry(tx._id.toString());
        
        let success = false;
        if (platform === 'QUICKBOOKS') {
          success = await ERPSyncService.pushToQuickBooks(journal);
        } else if (platform === 'XERO') {
          success = await ERPSyncService.pushToXero(journal);
        }

        if (success) {
          successCount++;
        }
      }

      await AuditLog.create({
        userId: new mongoose.Types.ObjectId(req.user?.id),
        action: 'UPDATE',
        targetModel: 'Transaction',
        targetId: 'BATCH-SYNC',
        newValues: { platform, successCount },
      });

      res.json({
        success: true,
        message: `Successfully batch synced ${successCount} entries to ${platform}.`,
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async stripeWebhook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { event, data } = req.body;
    if (!event || !data) {
      return next(new ValidationError('Invalid webhook event payload.'));
    }

    try {
      // Mock Stripe webhook processing (e.g., payment_intent.succeeded)
      if (event === 'payment_intent.succeeded') {
        const { metadata } = data;
        const txNum = metadata?.transactionNumber;
        if (txNum) {
          const transaction = await Transaction.findOne({ transactionNumber: txNum });
          if (transaction) {
            transaction.status = 'COMPLETED';
            await transaction.save();
          }
        }
      }

      res.json({ received: true });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async paystackWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    const signature = req.headers['x-paystack-signature'] as string;
    if (!signature) {
      return next(new ValidationError('Missing x-paystack-signature.'));
    }

    const payload = JSON.stringify(req.body);
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || 'your_paystack_webhook_secret_here';

    const isValid = verifyPaystackSignature(payload, signature, secret);
    if (!isValid) {
      return next(new ValidationError('Invalid webhook signature.'));
    }

    try {
      const { event, data } = req.body;
      if (event === 'charge.success') {
        const txNum = data?.reference;
        if (txNum) {
          const transaction = await Transaction.findOne({ transactionNumber: txNum });
          if (transaction) {
            transaction.status = 'COMPLETED';
            await transaction.save();
          }
        }
      }

      res.json({ received: true });
    } catch (err: unknown) {
      next(err);
    }
  }
}
