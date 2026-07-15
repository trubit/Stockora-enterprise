import type { Response, NextFunction } from 'express';
import { Product } from '../models/Product.js';
import { AuditLog } from '../models/AuditLog.js';
import { redis } from '../database/redis.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

export class ProductController {
  public static async getProducts(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const cached = await redis.get('products:all');
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      const products = await Product.find().lean();
      await redis.setex('products:all', 300, JSON.stringify(products));
      res.json(products);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async getProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    try {
      const product = await Product.findById(id).lean();
      if (!product) {
        return next(new NotFoundError('Product not found.'));
      }
      res.json(product);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async createProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { name, category, costPrice, sellingPrice, price, cost, sku, barcode, ...rest } = req.body;

    const finalCostPrice = Number(costPrice !== undefined ? costPrice : (cost !== undefined ? cost : 0));
    const finalSellingPrice = Number(sellingPrice !== undefined ? sellingPrice : (price !== undefined ? price : 0));

    if (!name || !category) {
      return next(new ValidationError('Name and category are required.'));
    }

    try {
      let finalSku = sku;
      if (!finalSku) {
        const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
        const cleanCat = category.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
        finalSku = `PRD-${cleanCat}-${cleanName}-${Math.round(Math.random() * 1e5)}`;
      }

      const existingSku = await Product.findOne({ sku: finalSku });
      if (existingSku) {
        return next(new ValidationError(`Product SKU [${finalSku}] already exists.`));
      }

      const finalBarcode = barcode || `BAR-${Math.round(Math.random() * 1e12)}`;

      const product = await Product.create({
        name,
        category,
        costPrice: finalCostPrice,
        sellingPrice: finalSellingPrice,
        price: finalSellingPrice,
        cost: finalCostPrice,
        sku: finalSku,
        barcode: finalBarcode,
        ...rest,
      });

      await redis.del('products:all');

      await AuditLog.create({
        userId: req.user?.id,
        action: 'CREATE',
        targetModel: 'Product',
        targetId: product._id.toString(),
        newValues: product.toObject(),
      });

      res.status(201).json(product);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async updateProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    try {
      const product = await Product.findById(id);
      if (!product) {
        return next(new NotFoundError('Product not found.'));
      }

      const oldValues = product.toObject();

      const { sku, costPrice, sellingPrice, cost, price } = req.body;
      const updatableData = { ...req.body };
      delete updatableData.sku;
      delete updatableData.costPrice;
      delete updatableData.sellingPrice;
      delete updatableData.cost;
      delete updatableData.price;
      delete updatableData._id;
      delete updatableData.id;
      delete updatableData.createdAt;
      delete updatableData.updatedAt;
      delete updatableData.__v;
      
      if (sku && sku !== product.sku) {
        const existingSku = await Product.findOne({ sku });
        if (existingSku) {
          return next(new ValidationError(`SKU [${sku}] is already assigned to another product.`));
        }
        product.sku = sku;
      }

      if (costPrice !== undefined) {
        product.costPrice = Number(costPrice);
        product.cost = Number(costPrice);
      } else if (cost !== undefined) {
        product.costPrice = Number(cost);
        product.cost = Number(cost);
      }

      if (sellingPrice !== undefined) {
        product.sellingPrice = Number(sellingPrice);
        product.price = Number(sellingPrice);
      } else if (price !== undefined) {
        product.sellingPrice = Number(price);
        product.price = Number(price);
      }

      Object.assign(product, updatableData);
      await product.save();

      await redis.del('products:all');

      await AuditLog.create({
        userId: req.user?.id,
        action: 'UPDATE',
        targetModel: 'Product',
        targetId: product._id.toString(),
        priorValues: oldValues,
        newValues: product.toObject(),
      });

      res.json(product);
    } catch (err: unknown) {
      next(err);
    }
  }

  public static async deleteProduct(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const { id } = req.params;
    try {
      const product = await Product.findById(id);
      if (!product) {
        return next(new NotFoundError('Product not found.'));
      }

      const oldValues = product.toObject();
      product.isActive = false;
      product.status = 'INACTIVE';
      await product.save();

      await redis.del('products:all');

      await AuditLog.create({
        userId: req.user?.id,
        action: 'DELETE',
        targetModel: 'Product',
        targetId: product._id.toString(),
        priorValues: oldValues,
        newValues: product.toObject(),
      });

      res.json({ message: 'Product deactivated successfully.', product });
    } catch (err: unknown) {
      next(err);
    }
  }
}
