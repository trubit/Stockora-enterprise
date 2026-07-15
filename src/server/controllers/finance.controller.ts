import type { Response, NextFunction } from 'express';
import { Transaction } from '../models/Transaction.js';
import { StockMovement } from '../models/StockMovement.js';
import { Product } from '../models/Product.js';
import { SupplierInvoice } from '../models/SupplierInvoice.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class FinanceController {
  public static async getFinancialReport(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Revenue
      const salesTransactions = await Transaction.find({ type: 'SALE', status: 'COMPLETED' }).lean();
      const revenue = salesTransactions.reduce((acc, t) => acc + (t.total || 0), 0);
      const taxCollected = salesTransactions.reduce((acc, t) => acc + (t.tax || 0), 0);

      // 2. Cost of Goods Sold (COGS)
      const salesMovements = await StockMovement.find({ type: 'SALE' }).lean();
      // Since stock movements for sales have negative quantity:
      const cogs = salesMovements.reduce((acc, m) => {
        const qty = Math.abs(m.quantity || 0);
        const cost = m.costPrice || 0;
        return acc + qty * cost;
      }, 0);

      const grossProfit = revenue - taxCollected - cogs;

      // 3. Balance Sheet Assets: Inventory Valuation
      const products = await Product.find({ isActive: true }).lean();
      const inventoryValuation = products.reduce((acc, p) => acc + (p.quantity || 0) * (p.costPrice || p.cost || 0), 0);
      const cashOnHand = revenue; // Simplifying cash on hand as total completed revenues
      const totalAssets = inventoryValuation + cashOnHand;

      // 4. Liabilities: Accounts Payable (unpaid vendor invoices)
      const unpaidInvoices = await SupplierInvoice.find({ status: { $ne: 'PAID' } }).lean();
      const accountsPayable = unpaidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);

      // 5. Equity
      const equity = totalAssets - accountsPayable;

      // 6. Cash Flow
      const paidInvoices = await SupplierInvoice.find({ status: 'PAID' }).lean();
      const cashOutflow = paidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
      const netCashFlow = cashOnHand - cashOutflow;

      // 7. Best Selling Products
      const productSalesMap: { [key: string]: { name: string; sku: string; qty: number; revenue: number } } = {};
      for (const t of salesTransactions) {
        for (const item of t.items) {
          if (!productSalesMap[item.productId]) {
            productSalesMap[item.productId] = {
              name: item.productName,
              sku: item.sku,
              qty: 0,
              revenue: 0,
            };
          }
          productSalesMap[item.productId].qty += item.quantity || 0;
          productSalesMap[item.productId].revenue += item.total || 0;
        }
      }
      const bestSellers = Object.values(productSalesMap)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

      // 8. Revenue by Payment Method
      const paymentMethods = salesTransactions.reduce((acc: { [key: string]: number }, t) => {
        const method = t.paymentMethod || 'CASH';
        acc[method] = (acc[method] || 0) + (t.total || 0);
        return acc;
      }, {});

      res.json({
        revenue,
        cogs,
        grossProfit,
        salesTaxCollected: taxCollected,
        balanceSheet: {
          inventoryValuation,
          cashOnHand,
          totalAssets,
          accountsPayable,
          equity,
        },
        cashFlow: {
          inflow: cashOnHand,
          outflow: cashOutflow,
          netCashFlow,
        },
        bestSellers,
        paymentMethods,
      });
    } catch (err: unknown) {
      next(err);
    }
  }
}
