import { Account, type AccountType } from '../models/Account.js';
import { JournalEntry, type IJournalLine } from '../models/JournalEntry.js';
import { FiscalPeriod } from '../models/FiscalPeriod.js';
import { eventBus } from '../events/eventBus.js';
import { logger } from '../logger.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';

export interface PostJournalPayload {
  description: string;
  source: string;
  referenceId?: string;
  currency?: string;
  lines: Array<{
    accountCode: string;
    debit: number;
    credit: number;
    memo?: string;
  }>;
  tenantId?: string;
  userId?: string;
}

export class FinanceService {
  /**
   * Initializes standard enterprise Chart of Accounts for a tenant if not existing.
   */
  public static async initializeChartOfAccounts(tenantId?: string): Promise<void> {
    const defaultAccounts: Array<{ code: string; name: string; type: AccountType }> = [
      { code: '1000', name: 'Cash on Hand', type: 'ASSET' },
      { code: '1010', name: 'Operating Bank Account', type: 'ASSET' },
      { code: '1200', name: 'Accounts Receivable', type: 'ASSET' },
      { code: '1300', name: 'Merchandise Inventory', type: 'ASSET' },
      { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
      { code: '2100', name: 'Sales Tax / VAT Payable', type: 'LIABILITY' },
      { code: '3000', name: 'Owner / Retained Equity', type: 'EQUITY' },
      { code: '4000', name: 'Product Sales Revenue', type: 'REVENUE' },
      { code: '4100', name: 'Service Revenue', type: 'REVENUE' },
      { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'COGS' },
      { code: '6000', name: 'Operating & Administrative Expenses', type: 'EXPENSE' },
      { code: '6100', name: 'Rent & Lease Expense', type: 'EXPENSE' },
      { code: '6200', name: 'Utilities & Power Expense', type: 'EXPENSE' },
      { code: '6300', name: 'Salaries & Payroll Expense', type: 'EXPENSE' },
    ];

    for (const acc of defaultAccounts) {
      const exists = await Account.findOne({ code: acc.code, tenantId: tenantId || null });
      if (!exists) {
        await Account.create({
          tenantId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          currentBalance: 0,
          currency: 'USD',
          isActive: true,
          isSystem: true,
        });
      }
    }
  }

  /**
   * Posts a double-entry journal entry with strict debit == credit balance enforcement.
   */
  public static async postJournalEntry(payload: PostJournalPayload): Promise<any> {
    return await ResilientExecutor.execute(
      { name: 'Finance-PostJournal', isIdempotent: true },
      async () => {
        // 1. Check open fiscal period if current date is covered
        const now = new Date();
        const closedPeriod = await FiscalPeriod.findOne({
          status: 'CLOSED',
          startDate: { $lte: now },
          endDate: { $gte: now },
          tenantId: payload.tenantId || null,
        });

        if (closedPeriod) {
          throw new Error(
            `Posting Rejected: Fiscal period ${closedPeriod.periodCode} is CLOSED. Direct posting prohibited.`
          );
        }

        // 2. Resolve accounts
        const resolvedLines: IJournalLine[] = [];
        for (const line of payload.lines) {
          const account = await Account.findOne({
            code: line.accountCode,
            tenantId: payload.tenantId || null,
          });

          if (!account) {
            throw new Error(`Account code '${line.accountCode}' not found in Chart of Accounts.`);
          }

          resolvedLines.push({
            accountId: account._id as any,
            accountCode: account.code,
            accountName: account.name,
            debit: Math.max(line.debit || 0, 0),
            credit: Math.max(line.credit || 0, 0),
            memo: line.memo,
          });
        }

        const entryNumber = `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 3. Save journal entry (pre-save hook validates totalDebit === totalCredit)
        const journal = new JournalEntry({
          tenantId: payload.tenantId,
          entryNumber,
          postingDate: now,
          description: payload.description,
          source: payload.source,
          referenceId: payload.referenceId,
          currency: payload.currency || 'USD',
          lines: resolvedLines,
          status: 'POSTED',
          postedBy: payload.userId as any,
        });

        await journal.save();

        // 4. Update account balances
        for (const line of journal.lines) {
          const account = await Account.findById(line.accountId);
          if (account) {
            if (['ASSET', 'COGS', 'EXPENSE'].includes(account.type)) {
              account.currentBalance += line.debit - line.credit;
            } else {
              account.currentBalance += line.credit - line.debit;
            }
            await account.save();
          }
        }

        // 5. Emit event via eventBus
        eventBus.emit('finance.journal.posted', {
          entryNumber: journal.entryNumber,
          source: journal.source,
          totalAmount: journal.totalDebit,
          tenantId: payload.tenantId,
        });

        logger.info(
          `[Finance] Posted Journal Entry ${journal.entryNumber} ($${journal.totalDebit})`
        );
        return journal;
      }
    );
  }

  /**
   * Generates Trial Balance and verifies zero-sum equality.
   */
  public static async getTrialBalance(tenantId?: string) {
    const accounts = await Account.find({ tenantId: tenantId || null, isActive: true }).lean();

    let totalDebit = 0;
    let totalCredit = 0;

    const reportLines = accounts.map((a) => {
      let debit = 0;
      let credit = 0;

      if (['ASSET', 'COGS', 'EXPENSE'].includes(a.type)) {
        if (a.currentBalance >= 0) debit = a.currentBalance;
        else credit = Math.abs(a.currentBalance);
      } else {
        if (a.currentBalance >= 0) credit = a.currentBalance;
        else debit = Math.abs(a.currentBalance);
      }

      totalDebit += debit;
      totalCredit += credit;

      return {
        accountCode: a.code,
        accountName: a.name,
        accountType: a.type,
        debit,
        credit,
      };
    });

    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return {
      isBalanced,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
      lines: reportLines,
    };
  }

  /**
   * Generates Income Statement (Profit & Loss).
   */
  public static async getProfitAndLoss(tenantId?: string) {
    const accounts = await Account.find({ tenantId: tenantId || null }).lean();

    let grossRevenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;

    for (const a of accounts) {
      if (a.type === 'REVENUE') grossRevenue += a.currentBalance;
      else if (a.type === 'COGS') cogs += a.currentBalance;
      else if (a.type === 'EXPENSE') operatingExpenses += a.currentBalance;
    }

    const netRevenue = grossRevenue; // Net of discounts/returns
    const grossProfit = netRevenue - cogs;
    const grossMarginPercentage = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    const operatingProfit = grossProfit - operatingExpenses;

    return {
      grossRevenue,
      netRevenue,
      cogs,
      grossProfit,
      grossMarginPercentage: Math.round(grossMarginPercentage * 10) / 10,
      operatingExpenses,
      operatingProfit,
    };
  }

  /**
   * Generates Balance Sheet statement (Assets = Liabilities + Equity).
   */
  public static async getBalanceSheet(tenantId?: string) {
    const accounts = await Account.find({ tenantId: tenantId || null }).lean();

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;

    for (const a of accounts) {
      if (a.type === 'ASSET') totalAssets += a.currentBalance;
      else if (a.type === 'LIABILITY') totalLiabilities += a.currentBalance;
      else if (a.type === 'EQUITY') totalEquity += a.currentBalance;
    }

    // Add net income from P&L to Equity
    const pnl = await this.getProfitAndLoss(tenantId);
    totalEquity += pnl.operatingProfit;

    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01;

    return {
      isBalanced,
      totalAssets,
      totalLiabilities,
      totalEquity,
      netIncomeIncluded: pnl.operatingProfit,
    };
  }
}
