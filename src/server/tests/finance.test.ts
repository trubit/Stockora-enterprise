import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Supplier } from '../models/Supplier.js';
import { SupplierInvoice } from '../models/SupplierInvoice.js';
import { Transaction } from '../models/Transaction.js';
import { StockMovement } from '../models/StockMovement.js';

describe('Corporate Finance & GAAP Reporting Integration', () => {
  let supplierId: mongoose.Types.ObjectId;
  let productId: string;
  let userId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/stockora_test_finance');
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await SupplierInvoice.deleteMany({});
    await Transaction.deleteMany({});
    await StockMovement.deleteMany({});

    userId = new mongoose.Types.ObjectId();

    // Register supplier
    const sup = await Supplier.create({
      name: 'Central Manufacturing Corp',
      code: 'CMC-VEND',
      contactPerson: 'Frank Manufacturer',
      email: 'frank@centralmfg.com',
      phone: '+1-555-888-9999',
      address: '777 Factory Lane, Austin TX',
    });
    supplierId = sup._id as mongoose.Types.ObjectId;

    // Create product
    const prod = await Product.create({
      sku: 'SKU-FIN-1',
      name: 'Financial Ledger Binder',
      category: 'Stationery',
      costPrice: 4.0,
      sellingPrice: 10.0,
      price: 10.0,
      cost: 4.0,
      quantity: 150,
      lowStockAlert: 5,
    });
    productId = prod._id.toString();
  });

  afterAll(async () => {
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await SupplierInvoice.deleteMany({});
    await Transaction.deleteMany({});
    await StockMovement.deleteMany({});
    await mongoose.connection.close();
  });

  it('should accurately calculate P&L, balance sheets, and cash flows', async () => {
    // 1. Log a completed sale of 10 binders @ $10.00 each
    // Total sale = $100. Tax = $8. Subtotal = $92.
    const tx = await Transaction.create({
      transactionNumber: 'TX-FIN-001',
      type: 'SALE',
      status: 'COMPLETED',
      items: [{
        productId,
        productName: 'Financial Ledger Binder',
        sku: 'SKU-FIN-1',
        quantity: 10,
        price: 10.0,
        discount: 0,
        total: 100.0,
      }],
      subtotal: 92.0,
      tax: 8.0,
      discount: 0,
      total: 100.0,
      paymentMethod: 'CASH',
      cashierId: userId.toString(),
      cashierName: 'Cashier Joe',
      branchId: new mongoose.Types.ObjectId().toString(),
      branchName: 'Austin Station',
    });

    // 2. Log corresponding stock movement for the sale
    await StockMovement.create({
      productId,
      type: 'SALE',
      quantity: -10,
      costPrice: 4.0,
      sellingPrice: 10.0,
      referenceId: tx.transactionNumber,
      userId,
    });

    // 3. Log a paid supplier invoice of $200
    await SupplierInvoice.create({
      invoiceNumber: 'INV-FIN-PAID',
      poId: new mongoose.Types.ObjectId(),
      supplierId,
      amount: 200.0,
      dueDate: new Date(),
      status: 'PAID',
    });

    // 4. Log an unpaid supplier invoice of $350
    await SupplierInvoice.create({
      invoiceNumber: 'INV-FIN-UNPAID',
      poId: new mongoose.Types.ObjectId(),
      supplierId,
      amount: 350.0,
      dueDate: new Date(),
      status: 'UNPAID',
    });

    // Run aggregations inside test
    // Revenue & Tax
    const salesTransactions = await Transaction.find({ type: 'SALE', status: 'COMPLETED' }).lean();
    const revenue = salesTransactions.reduce((acc, t) => acc + (t.total || 0), 0);
    const taxCollected = salesTransactions.reduce((acc, t) => acc + (t.tax || 0), 0);

    expect(revenue).toBe(100.0);
    expect(taxCollected).toBe(8.0);

    // COGS
    const salesMovements = await StockMovement.find({ type: 'SALE' }).lean();
    const cogs = salesMovements.reduce((acc, m) => {
      const qty = Math.abs(m.quantity || 0);
      const cost = m.costPrice || 0;
      return acc + qty * cost;
    }, 0);

    // 10 units * $4.00 cost = $40.00 COGS
    expect(cogs).toBe(40.0);

    const grossProfit = revenue - taxCollected - cogs; // 100 - 8 - 40 = 52
    expect(grossProfit).toBe(52.0);

    // Balance Sheet Assets
    const products = await Product.find({ isActive: true }).lean();
    const inventoryValuation = products.reduce((acc, p) => acc + (p.quantity || 0) * (p.costPrice || p.cost || 0), 0);
    // 150 units * $4.00 = $600.00
    expect(inventoryValuation).toBe(600.0);

    const cashOnHand = revenue; // $100.00
    const totalAssets = inventoryValuation + cashOnHand; // $700.00
    expect(totalAssets).toBe(700.0);

    // Liabilities
    const unpaidInvoices = await SupplierInvoice.find({ status: { $ne: 'PAID' } }).lean();
    const accountsPayable = unpaidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
    expect(accountsPayable).toBe(350.0);

    // Equity
    const equity = totalAssets - accountsPayable; // 700 - 350 = 350
    expect(equity).toBe(350.0);

    // Cash Flows
    const paidInvoices = await SupplierInvoice.find({ status: 'PAID' }).lean();
    const cashOutflow = paidInvoices.reduce((acc, inv) => acc + (inv.amount || 0), 0);
    expect(cashOutflow).toBe(200.0);

    const netCashFlow = cashOnHand - cashOutflow; // 100 - 200 = -100
    expect(netCashFlow).toBe(-100.0);
  });
});
