import { Router } from 'express';
import mongoose from 'mongoose';
import { SocketManager } from '../sockets/manager.js';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { orgRouter } from './org.routes.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { redis } from '../database/redis.js';

const io = SocketManager.getInstance();

export const apiRouter = Router();

apiRouter.get('/health', async (_req, res) => {
  let redisConnected = false;
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

apiRouter.get('/products', async (_req, res, next) => {
  try {
    const cached = await redis.get('products:all');
    if (cached) {
      res.json(JSON.parse(cached));
      return;
    }

    const products = await Product.find({ isActive: true }).lean();
    await redis.setex('products:all', 300, JSON.stringify(products));
    res.json(products);
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/products', async (req, res, next) => {
  const { name, SKU, price, cost, quantity, category, lowStockAlert, barcode } = req.body;

  if (!name || price === undefined || quantity === undefined) {
    res.status(400).json({ error: 'Missing required parameters: name, price, quantity' });
    return;
  }

  try {
    const newProduct = await Product.create({
      sku: SKU || `SKU-${Date.now()}`,
      name,
      category: category || 'General',
      price: Number(price),
      cost: Number(cost || 0),
      quantity: Number(quantity),
      lowStockAlert: Number(lowStockAlert || 5),
      barcode,
      isActive: true,
    });

    await redis.del('products:all');
    io.emitGlobal('product:created', newProduct);

    res.status(201).json(newProduct);
  } catch (err) {
    next(err);
  }
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
        io.emitGlobal('product:stock-updated', { productId: product._id, quantity: product.quantity });

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
      cashierId: 'cashier-1',
      cashierName: cashierName || 'Jane Doe',
      branchId: 'branch-1',
      branchName: branchName || 'Main HQ',
    });

    await redis.del(['products:all', 'transactions:all']);
    io.emitGlobal('transaction:completed', newTransaction);

    res.status(201).json(newTransaction);
  } catch (err) {
    next(err);
  }
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/org', orgRouter);
