import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import mongoose from 'mongoose';
import { config } from '../config/environment.js';
import { logger } from './logger.js';
import { connectDB } from './db.js';
import { securityMiddleware } from './middleware/security.js';
import { isRedisReady } from './redis.js';
import type { Product, Transaction } from '../shared/types.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Mock database store for immediate UX functionality (falls back if DB connection is offline)
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

// Socket connections handler
io.on('connection', (socket) => {
  logger.info(`Client connected to WebSocket: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Client disconnected from WebSocket: ${socket.id}`);
  });
});

// Apply Security Middlewares
app.use(securityMiddleware);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log HTTP requests via Morgan/Winston wrapper
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// API Routes

// 1. Health check (SRE & DevOps diagnostics endpoint)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    uptime: process.uptime(),
    dbConnected: mongoose.connection.readyState === 1,
    redisConnected: isRedisReady(),
  });
});

// 2. Products Endpoint
app.get('/api/products', (req: Request, res: Response) => {
  res.json(mockProducts);
});

app.post('/api/products', (req: Request, res: Response) => {
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

  // Real-time notification to all connected clients
  io.emit('product:created', newProduct);

  res.status(201).json(newProduct);
});

// 3. Transactions / POS Checkout Endpoint
app.post('/api/transactions', (req: Request, res: Response) => {
  const { items, paymentMethod, discount, tax, subtotal, total, cashierName, branchName } =
    req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'Invalid transaction: must contain items.' });
    return;
  }

  // Deduct inventory quantities (Local/In-Memory logic for instantaneous feedback)
  for (const item of items) {
    const product = mockProducts.find((p) => p.id === item.productId || p.sku === item.sku);
    if (product) {
      product.quantity = Math.max(0, product.quantity - item.quantity);

      // Real-time notify clients of inventory level drop
      io.emit('product:stock-updated', { productId: product.id, quantity: product.quantity });

      // Stock warning check
      if (product.quantity <= product.lowStockAlert) {
        io.emit('notification:low-stock', {
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

  // Notify client dashboards of new sale
  io.emit('transaction:completed', newTransaction);

  res.status(201).json(newTransaction);
});

app.get('/api/transactions', (req: Request, res: Response) => {
  res.json(mockTransactions);
});

// Serve Frontend in Production Mode
if (config.isProduction) {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));

  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Graceful welcome message for API root in development
  app.get('/', (req: Request, res: Response) => {
    res.json({
      message:
        'Welcome to the Stockora Enterprise API Server (Development Mode). Please navigate to the frontend port.',
      endpoints: {
        health: '/api/health',
        products: '/api/products',
        transactions: '/api/transactions',
      },
    });
  });
}

// Centralized Error Handling Middleware (OWASP Secure Coding standard)
/* eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Server Error: ${err.message || err}`);

  // Prevent stack traces from leaking to clients in production
  res.status(err.status || 500).json({
    error: {
      message: config.isProduction ? 'An unexpected server error occurred.' : err.message,
      status: err.status || 500,
    },
  });
});

// Start Database & Server
async function startServer() {
  await connectDB();

  httpServer.listen(config.port, () => {
    logger.info(
      `Stockora Server running in [${config.env}] mode on http://localhost:${config.port}`
    );
  });
}

startServer();
