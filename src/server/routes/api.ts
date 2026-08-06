import { Router } from 'express';
import mongoose from 'mongoose';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { SocketManager } from '../sockets/manager.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { orgRouter } from './org.routes.js';
import { productRouter } from './product.routes.js';
import { supplierRouter } from './supplier.routes.js';
import { customerRouter } from './customer.routes.js';
import { uploadRouter } from './upload.routes.js';
import { inventoryRouter } from './inventory.routes.js';
import { transferRouter } from './transfer.routes.js';
import { requisitionRouter } from './requisition.routes.js';
import { purchaseOrderRouter } from './purchaseOrder.routes.js';
import { invoiceRouter } from './invoice.routes.js';
import { quoteRouter } from './quote.routes.js';
import { salesOrderRouter } from './salesOrder.routes.js';
import { salesReturnRouter } from './salesReturn.routes.js';
import { financeRouter } from './finance.routes.js';
import { returnsRouter } from './returns.routes.js';
import { promoRouter } from './promo.routes.js';
import { notificationRouter } from './notification.routes.js';
import { branchSyncRouter } from './branchSync.routes.js';
import { automationRouter } from './automation.routes.js';
import { adminRouter } from './admin.routes.js';
import { securityRouter } from './security.routes.js';
import { resiliencyRouter } from './resiliency.routes.js';
import { aiRouter } from './ai.routes.js';
import { currencyRouter } from './currency.routes.js';
import { integrationRouter } from './integration.routes.js';
import { checkoutRouter } from './checkout.routes.js';
import { reportingRouter } from './reporting.routes.js';
import { workflowRouter } from './workflow.routes.js';
import { observabilityRouter } from './observability.routes.js';
import { copilotRouter } from './copilot.routes.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { Branch } from '../models/Branch.js';
import { Receipt } from '../models/Receipt.js';
import { redis } from '../database/redis.js';
import { authenticate } from '../middleware/auth.js';

const io = SocketManager.getInstance();

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res) => {
  let redisConnected: boolean;
  try {
    const ping = await redis.ping();
    redisConnected = ping === 'PONG';
  } catch {
    redisConnected = false;
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
    redisConnected,
    uptime: process.uptime(),
  });
});

apiRouter.get('/transactions', async (_req, res, next) => {
  try {
    const cached = await redis.get('transactions:all');
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const transactions = await Transaction.find().sort({ createdAt: -1 }).limit(100).lean();
    await redis.setex('transactions:all', 60, JSON.stringify(transactions));
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/transactions', async (req, res, next) => {
  const { items, paymentMethod, discount, tax, subtotal, total, cashierName, branchName } =
    req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Invalid transaction: must contain items.' });
    return;
  }

  try {
    for (const item of items) {
      const isObjectId = mongoose.Types.ObjectId.isValid(item.productId);
      const query = isObjectId
        ? { $or: [{ _id: item.productId }, { sku: item.sku }] }
        : { sku: item.sku };

      const product = await Product.findOne(query);
      if (product) {
        product.quantity = Math.max(0, product.quantity - item.quantity);
        await product.save();
        io.emitGlobal('product:stock-updated', {
          productId: product._id,
          quantity: product.quantity,
        });

        if (product.quantity <= product.lowStockAlert) {
          io.emitGlobal('notification:low-stock', {
            productId: product._id,
            name: product.name,
            quantity: product.quantity,
            lowStockAlert: product.lowStockAlert,
          });
        }
      }
    }

    const user = (req as AuthenticatedRequest).user;
    const resolvedCashierId = user?.id || 'cashier-1';
    const resolvedCashierName = cashierName || user?.username || 'POS Cashier';

    const activeBranch = await Branch.findOne({ isActive: true });
    const resolvedBranchId = activeBranch?._id?.toString() || 'branch-1';
    const resolvedBranchName = branchName || activeBranch?.name || 'Primary Branch';

    const newTransaction = await Transaction.create({
      transactionNumber: `TX-${Date.now().toString().slice(-6)}`,
      type: 'SALE',
      status: 'COMPLETED',
      items,
      subtotal: Number(subtotal),
      tax: Number(tax),
      discount: Number(discount || 0),
      total: Number(total),
      paymentMethod: paymentMethod || 'CASH',
      cashierId: resolvedCashierId,
      cashierName: resolvedCashierName,
      branchId: resolvedBranchId,
      branchName: resolvedBranchName,
    });

    await redis.del(['products:all', 'transactions:all']);
    await Receipt.create({
      transactionId: newTransaction._id,
      transactionNumber: newTransaction.transactionNumber,
      customerEmail: newTransaction.customerEmail,
      branchId: newTransaction.branchId,
      cashierId: newTransaction.cashierId,
      data: {
        transactionNumber: newTransaction.transactionNumber,
        items: newTransaction.items,
        subtotal: newTransaction.subtotal,
        tax: newTransaction.tax,
        discount: newTransaction.discount,
        total: newTransaction.total,
        paymentMethod: newTransaction.paymentMethod,
        cashierName: newTransaction.cashierName,
        branchName: newTransaction.branchName,
        createdAt: newTransaction.createdAt,
      },
    });

    io.emitGlobal('transaction:completed', newTransaction);

    res.status(201).json(newTransaction);
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/receipts', authenticate, async (_req, res, next) => {
  try {
    const receipts = await Receipt.find().sort({ createdAt: -1 }).limit(100).lean();
    res.json(receipts);
  } catch (err) {
    next(err);
  }
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/org', orgRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/suppliers', supplierRouter);
apiRouter.use('/customers', customerRouter);
apiRouter.use('/upload', uploadRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/transfers', transferRouter);
apiRouter.use('/requisitions', requisitionRouter);
apiRouter.use('/purchase-orders', purchaseOrderRouter);
apiRouter.use('/invoices', invoiceRouter);
apiRouter.use('/quotes', quoteRouter);
apiRouter.use('/sales-orders', salesOrderRouter);
apiRouter.use('/sales-returns', salesReturnRouter);
apiRouter.use('/finance', financeRouter);
apiRouter.use('/returns', returnsRouter);
apiRouter.use('/marketing', promoRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/sync', branchSyncRouter);
apiRouter.use('/automation', automationRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/security', securityRouter);
apiRouter.use('/resiliency', resiliencyRouter);
apiRouter.use('/ai', aiRouter);
apiRouter.use('/currency', currencyRouter);
apiRouter.use('/integrations', integrationRouter);
apiRouter.use('/checkout', checkoutRouter);
apiRouter.use('/reports', reportingRouter);
apiRouter.use('/workflows', workflowRouter);
apiRouter.use('/observability', observabilityRouter);
apiRouter.use('/copilot', copilotRouter);
