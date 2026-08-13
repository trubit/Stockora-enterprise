import type { Response, NextFunction } from 'express';
import { FinanceService } from '../services/finance.service.js';
import { TaxReconciliationService } from '../services/tax-reconciliation.service.js';
import { Account } from '../models/Account.js';
import { JournalEntry } from '../models/JournalEntry.js';
import { FiscalPeriod } from '../models/FiscalPeriod.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class FinanceController {
  public static async getFinancialReport(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;
      await FinanceService.initializeChartOfAccounts(tenantId);

      const pnl = await FinanceService.getProfitAndLoss(tenantId);
      const balanceSheet = await FinanceService.getBalanceSheet(tenantId);
      const trialBalance = await FinanceService.getTrialBalance(tenantId);
      const taxSummary = await TaxReconciliationService.getTaxSummary(tenantId);

      res.json({
        success: true,
        data: {
          revenue: pnl.netRevenue,
          cogs: pnl.cogs,
          grossProfit: pnl.grossProfit,
          grossMarginPercentage: pnl.grossMarginPercentage,
          operatingExpenses: pnl.operatingExpenses,
          operatingProfit: pnl.operatingProfit,
          balanceSheet,
          trialBalance,
          taxSummary,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getChartOfAccounts(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;
      await FinanceService.initializeChartOfAccounts(tenantId);
      const query = tenantId
        ? { $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }] }
        : {};
      const accounts = await Account.find(query).sort({ code: 1 });
      res.json({ success: true, data: accounts });
    } catch (err) {
      next(err);
    }
  }

  public static async createAccount(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;
      const { code, name, type, parentAccountId, description } = req.body;

      const account = await Account.create({
        tenantId,
        code,
        name,
        type,
        parentAccountId,
        description,
        currentBalance: 0,
        currency: 'USD',
        isActive: true,
      });

      res.status(201).json({ success: true, data: account });
    } catch (err) {
      next(err);
    }
  }

  public static async postJournalEntry(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;
      const userId = (req.user as any)?.id;

      const journal = await FinanceService.postJournalEntry({
        ...req.body,
        tenantId,
        userId,
      });

      res.status(201).json({ success: true, data: journal });
    } catch (err) {
      next(err);
    }
  }

  public static async getJournalEntries(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;
      const query = tenantId
        ? { $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }] }
        : {};
      const entries = await JournalEntry.find(query).sort({ postingDate: -1 }).limit(100);
      res.json({ success: true, data: entries });
    } catch (err) {
      next(err);
    }
  }

  public static async getFiscalPeriods(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;
      const query = tenantId
        ? { $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }] }
        : {};
      const periods = await FiscalPeriod.find(query).sort({ year: -1, month: -1 });
      res.json({ success: true, data: periods });
    } catch (err) {
      next(err);
    }
  }

  public static async closeFiscalPeriod(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { periodCode } = req.body;
      const userId = (req.user as any)?.id;
      const tenantId = (req.user as any)?.tenantId || (req.user as any)?.companyId;

      const query = tenantId
        ? { periodCode, $or: [{ tenantId }, { tenantId: null }, { tenantId: { $exists: false } }] }
        : { periodCode };

      const period = await FiscalPeriod.findOne(query);
      if (!period) {
        res.status(404).json({ success: false, message: `Fiscal period ${periodCode} not found.` });
        return;
      }

      period.status = 'CLOSED';
      period.closedBy = userId as any;
      period.closedAt = new Date();
      await period.save();

      res.json({ success: true, data: period });
    } catch (err) {
      next(err);
    }
  }
}
