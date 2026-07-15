import type { Response, NextFunction } from 'express';
import { Product } from '../models/Product.js';
import { StockAdjustment } from '../models/StockAdjustment.js';
import { StockMovement } from '../models/StockMovement.js';
import { AuditLog } from '../models/AuditLog.js';
import { SocketManager } from '../sockets/manager.js';
import { redis } from '../database/redis.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const io = SocketManager.getInstance();

export class InventoryController {
  public static async adjustStock(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { productId, type, reason, quantity, notes } = req.body;

    if (!productId || !type || !reason || quantity === undefined) {
      return next(new ValidationError('productId, type, reason, and quantity are required.'));
    }

    const qtyNumber = Number(quantity);
    if (qtyNumber <= 0) {
      return next(new ValidationError('Quantity must be greater than zero.'));
    }

    try {
      const product = await Product.findById(productId);
      if (!product) {
        return next(new NotFoundError('Product not found.'));
      }

      const priorValues = product.toObject();
      const priorQty = product.quantity;
      let newQty = product.quantity;

      if (type === 'ADD') {
        newQty += qtyNumber;
      } else if (type === 'REMOVE') {
        if (product.quantity < qtyNumber) {
          return next(new ValidationError(`Insufficient stock. Current: ${product.quantity}, Adjust-Out: ${qtyNumber}`));
        }
        newQty -= qtyNumber;
      } else if (type === 'SET') {
        newQty = qtyNumber;
      }

      product.quantity = newQty;

      if (reason === 'DAMAGED') {
        product.damagedQuantity += qtyNumber;
      } else if (reason === 'EXPIRED') {
        product.damagedQuantity += qtyNumber;
      }

      if (product.quantity === 0) {
        product.status = 'OUT_OF_STOCK';
      } else if (product.quantity > 0 && product.status === 'OUT_OF_STOCK') {
        product.status = 'ACTIVE';
      }

      await product.save();

      const adjustmentNumber = `ADJ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const adjustment = await StockAdjustment.create({
        productId,
        adjustmentNumber,
        type,
        reason,
        quantity: qtyNumber,
        notes,
        userId: req.user?.id,
      });

      const signedQty = type === 'REMOVE' ? -qtyNumber : (type === 'SET' ? (qtyNumber - priorQty) : qtyNumber);

      const movement = await StockMovement.create({
        productId,
        type: 'ADJUSTMENT',
        quantity: signedQty,
        costPrice: product.costPrice || product.cost || 0,
        sellingPrice: product.sellingPrice || product.price || 0,
        referenceId: adjustment._id.toString(),
        userId: req.user?.id,
        notes: `Adjustment Reason: ${reason}. ${notes || ''}`,
      });

      await redis.del('products:all');

      await AuditLog.create({
        userId: req.user?.id,
        action: 'UPDATE',
        targetModel: 'Product',
        targetId: product._id.toString(),
        priorValues,
        newValues: product.toObject(),
      });

      if (product.quantity <= product.lowStockAlert) {
        io.emitGlobal('notification:low-stock', {
          name: product.name,
          quantity: product.quantity,
        });
      }

      res.status(201).json({
        message: 'Stock adjusted successfully.',
        product,
        adjustment,
        movement,
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async getMovements(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await StockMovement.find()
        .populate('productId', 'name sku brand category')
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .lean();
      res.json(movements);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async getValuation(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const products = await Product.find({ isActive: true }).lean();

      let totalWeightedAverage = 0;
      let totalFIFO = 0;
      let totalLIFO = 0;

      for (const product of products) {
        const Q = product.quantity;
        const defaultCost = product.costPrice || product.cost || 0;

        totalWeightedAverage += Q * defaultCost;

        if (Q <= 0) continue;

        const movements = await StockMovement.find({
          productId: product._id,
          quantity: { $gt: 0 },
        })
          .sort({ createdAt: -1 })
          .lean();

        let fifoVal = 0;
        let fifoRemaining = Q;
        for (const mov of movements) {
          const qty = mov.quantity;
          const cost = mov.costPrice || defaultCost;
          if (fifoRemaining <= qty) {
            fifoVal += fifoRemaining * cost;
            fifoRemaining = 0;
            break;
          } else {
            fifoVal += qty * cost;
            fifoRemaining -= qty;
          }
        }
        if (fifoRemaining > 0) {
          fifoVal += fifoRemaining * defaultCost;
        }
        totalFIFO += fifoVal;

        const lifoMovements = [...movements].reverse();
        let lifoVal = 0;
        let lifoRemaining = Q;
        for (const mov of lifoMovements) {
          const qty = mov.quantity;
          const cost = mov.costPrice || defaultCost;
          if (lifoRemaining <= qty) {
            lifoVal += lifoRemaining * cost;
            lifoRemaining = 0;
            break;
          } else {
            lifoVal += qty * cost;
            lifoRemaining -= qty;
          }
        }
        if (lifoRemaining > 0) {
          lifoVal += lifoRemaining * defaultCost;
        }
        totalLIFO += lifoVal;
      }

      res.json({
        weightedAverage: totalWeightedAverage,
        fifo: totalFIFO,
        lifo: totalLIFO,
        totalItemsCount: products.reduce((acc, p) => acc + (p.quantity || 0), 0),
        productsCount: products.length,
      });
    } catch (err: unknown) {
      next(err);
    }
  }
}
