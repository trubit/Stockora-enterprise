import { Router } from 'express';
import mongoose from 'mongoose';
import type { Product, Transaction } from '../../shared/types.js';
import { SocketManager } from '../sockets/manager.js';

const io = SocketManager.getInstance();

export const apiRouter = Router();

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'SKU-APP-001',
    name: 'Fuji Apples (Organic)',
    description: 'Fresh organic imported Fuji apples.',
    category: 'Produce',
    price: 4.99,
    cost: 2.2,
    quantity: 150,
    lowStockAlert: 20,
    barcode: '40012011',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-2',
    sku: 'SKU-MILK-002',
    name: 'Whole Milk 1L',
    description: 'Pasteurized homogenized whole milk.',
    category: 'Dairy',
    price: 2.49,
    cost: 1.1,
    quantity: 80,
    lowStockAlert: 15,
    barcode: '40012022',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-3',
    sku: 'SKU-BREAD-003',
    name: 'Sourdough Bread',
    description: 'Freshly baked artisanal sourdough bread.',
    category: 'Bakery',
    price: 3.99,
    cost: 1.8,
    quantity: 12,
    lowStockAlert: 10,
    barcode: '40012033',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-4',
    sku: 'SKU-COF-004',
    name: 'Espresso Coffee Beans 500g',
    description: 'Medium roast Arabica coffee beans.',
    category: 'Pantry',
    price: 12.99,
    cost: 6.5,
    quantity: 45,
    lowStockAlert: 8,
    barcode: '40012044',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockTransactions: Transaction[] = [];

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1,
    redisConnected: true,
    uptime: process.uptime(),
  });
});

apiRouter.get('/products', (_req, res) => {
  res.json(mockProducts);
});

apiRouter.post('/products', (req, res) => {
  const { name, SKU, price, cost, quantity, category, lowStockAlert, barcode } = req.body;

  if (!name || !price || !quantity) {
    res.status(400).json({ error: 'Missing required parameters: name, price, quantity' });
    return;
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    sku: SKU || `SKU-${Date.now()}`,
    name,
    category: category || 'General',
    price: Number(price),
    cost: Number(cost || 0),
    quantity: Number(quantity),
    lowStockAlert: Number(lowStockAlert || 5),
    barcode,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockProducts.push(newProduct);
  io.emitGlobal('product:created', newProduct);

  res.status(201).json(newProduct);
});

apiRouter.get('/transactions', (_req, res) => {
  res.json(mockTransactions);
});

apiRouter.post('/transactions', (req, res) => {
  const { items, paymentMethod, discount, tax, subtotal, total, cashierName, branchName } =
    req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Invalid transaction: must contain items.' });
    return;
  }

  for (const item of items) {
    const product = mockProducts.find((p) => p.id === item.productId || p.sku === item.sku);
    if (product) {
      product.quantity = Math.max(0, product.quantity - item.quantity);
      io.emitGlobal('product:stock-updated', { productId: product.id, quantity: product.quantity });

      if (product.quantity <= product.lowStockAlert) {
        io.emitGlobal('notification:low-stock', {
          productId: product.id,
          name: product.name,
          quantity: product.quantity,
          lowStockAlert: product.lowStockAlert,
        });
      }
    }
  }

  const newTransaction: Transaction = {
    id: `tx-${Date.now()}`,
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockTransactions.push(newTransaction);
  io.emitGlobal('transaction:completed', newTransaction);

  res.status(201).json(newTransaction);
});
