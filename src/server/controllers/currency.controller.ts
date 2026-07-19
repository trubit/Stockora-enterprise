import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { ExchangeRate } from '../models/ExchangeRate.js';
import { SystemConfig } from '../models/SystemConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { ValidationError } from '../errors/AppError.js';
import mongoose from 'mongoose';

export class CurrencyController {
  public static async listRates(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const rates = await ExchangeRate.find({ isActive: true });
      res.json(rates);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async updateRate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { code, symbol, rate } = req.body;
    if (!code || !symbol || rate === undefined) {
      return next(new ValidationError('Code, symbol, and rate value are required.'));
    }

    try {
      const upperCode = code.toUpperCase();
      let rateDoc = await ExchangeRate.findOne({ code: upperCode });
      let prev: Record<string, unknown> | null = null;
      let action: 'CREATE' | 'UPDATE' = 'CREATE';

      if (rateDoc) {
        prev = rateDoc.toObject() as unknown as Record<string, unknown>;
        rateDoc.symbol = symbol;
        rateDoc.rate = Number(rate);
        action = 'UPDATE';
        await rateDoc.save();
      } else {
        rateDoc = await ExchangeRate.create({
          code: upperCode,
          symbol,
          rate: Number(rate),
          isActive: true,
        });
      }

      await AuditLog.create({
        userId: new mongoose.Types.ObjectId(req.user?.id),
        action,
        targetModel: 'ExchangeRate',
        targetId: rateDoc._id.toString(),
        previousValues: prev ?? undefined,
        newValues: rateDoc.toObject() as unknown as Record<string, unknown>,
      });

      res.status(action === 'CREATE' ? 201 : 200).json(rateDoc);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async getTaxConfig(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      let config = await SystemConfig.findOne();
      if (!config) {
        config = await SystemConfig.create({
          maintenanceMode: false,
          featureFlags: new Map(),
          allowedIPs: [],
          taxRate: 8.0,
          taxType: 'GST',
        });
      }
      res.json({
        taxRate: config.taxRate,
        taxType: config.taxType,
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async updateTaxConfig(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { taxRate, taxType } = req.body;
    if (taxRate === undefined || !taxType) {
      return next(new ValidationError('Tax rate and tax type are required.'));
    }

    try {
      let config = await SystemConfig.findOne();
      if (!config) {
        config = new SystemConfig();
      }

      const prev = config.toObject() as unknown as Record<string, unknown>;
      config.taxRate = Number(taxRate);
      config.taxType = taxType;
      config.updatedBy = new mongoose.Types.ObjectId(req.user?.id);
      await config.save();

      await AuditLog.create({
        userId: new mongoose.Types.ObjectId(req.user?.id),
        action: 'UPDATE',
        targetModel: 'SystemConfig',
        targetId: config._id.toString(),
        previousValues: prev,
        newValues: config.toObject() as unknown as Record<string, unknown>,
      });

      res.json({
        taxRate: config.taxRate,
        taxType: config.taxType,
      });
    } catch (err: unknown) {
      next(err);
    }
  }
}
