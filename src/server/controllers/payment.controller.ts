import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Transaction, type ITransaction } from '../models/Transaction.js';
import { Product } from '../models/Product.js';
import { PaymentService, type PaymentProvider } from '../services/payment.service.js';
import { ValidationError, NotFoundError } from '../errors/AppError.js';
import { logger } from '../logger.js';
import { Branch } from '../models/Branch.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { SocketManager } from '../sockets/manager.js';
import { redis } from '../database/redis.js';

const io = SocketManager.getInstance();

// Schemas for checkout validation
const initializeCheckoutSchema = z.object({
  email: z.string().email('Invalid customer email address'),
  provider: z.enum(['PAYSTACK', 'STRIPE']),
  paymentMethod: z.enum(['CARD', 'MOBILE']),
  items: z
    .array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        sku: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().nonnegative(),
        discount: z.number().nonnegative().default(0),
        total: z.number().nonnegative(),
      })
    )
    .min(1, 'At least one item is required in the cart'),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  subtotal: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: z.string().default('USD'),
});

const verifyCheckoutSchema = z.object({
  provider: z.enum(['PAYSTACK', 'STRIPE']),
  reference: z.string().min(3, 'Reference is required'),
});

const refundCheckoutSchema = z.object({
  reference: z.string().min(3, 'Reference is required'),
  amount: z.number().positive('Refund amount must be positive'),
});

export class PaymentController {
  /**
   * Safe transaction checkout initialization. Creates a pending transaction record
   * and initializes gateway session.
   */
  public static async initializeCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const payload = initializeCheckoutSchema.parse(req.body);

      // Verify stock levels before initiating payment session
      for (const item of payload.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new ValidationError(
            `Product ${item.productName} (ID: ${item.productId}) not found.`
          );
        }
        if (product.quantity < item.quantity) {
          throw new ValidationError(
            `Insufficient inventory for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}`
          );
        }
      }

      // Generate a unique reference number
      const reference = `TX-PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

      // Dynamically resolve cashier and branch information
      const authReq = req as AuthenticatedRequest;
      const user = authReq.user;
      const cashierId = user?.id || 'cashier-1';
      const cashierName = user?.username || 'POS Cashier';

      const activeBranch = await Branch.findOne({ isActive: true });
      const branchId = activeBranch?._id?.toString() || 'branch-1';
      const branchName = activeBranch?.name || 'Primary Branch';

      // Create standard transaction but mark it as PENDING
      const transaction = await Transaction.create({
        transactionNumber: reference,
        type: 'SALE',
        status: 'PENDING',
        items: payload.items,
        subtotal: payload.subtotal,
        tax: payload.tax,
        discount: payload.discount,
        total: payload.total,
        paymentMethod: payload.paymentMethod,
        currencyCode: payload.currency.toUpperCase(),
        exchangeRate: 1.0,
        cashierId,
        cashierName,
        branchId,
        branchName,
      });

      // Determine frontend origin for redirecting back to user interface
      const referer = req.headers.referer || '';
      let frontendOrigin = `${req.protocol}://${req.get('host')}`;
      if (referer) {
        try {
          const urlObj = new URL(referer);
          frontendOrigin = urlObj.origin;
        } catch {
          // ignore
        }
      }

      // Call payment service with resiliency protection
      const paymentResult = await PaymentService.initialize(payload.provider, {
        email: payload.email,
        amount: payload.total,
        currency: payload.currency,
        reference,
        callbackUrl: `${frontendOrigin}/pos?provider=${payload.provider}&reference=${reference}`,
      });

      res.status(200).json({
        success: true,
        transactionId: transaction._id,
        reference: paymentResult.reference,
        amount: paymentResult.amount,
        authorizationUrl: paymentResult.authorizationUrl, // For Paystack redirection
        clientSecret: paymentResult.clientSecret, // For Stripe card elements mounting
        gatewayTransactionId: paymentResult.gatewayTransactionId,
      });
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Refined static payment verification method. Connects directly to the provider,
   * performs amount/currency checks, manages stock level decreases, and commits status.
   */
  public static async verifyAndProcessPayment(
    provider: PaymentProvider,
    reference: string
  ): Promise<{
    success: boolean;
    status: string;
    transaction: ITransaction;
    gatewayResponse?: string;
  }> {
    const transaction = await Transaction.findOne({ transactionNumber: reference });
    if (!transaction) {
      throw new NotFoundError(`Transaction record not found for reference: ${reference}`);
    }

    // Idempotency: Avoid double inventory deductions or re-processing completed payments
    if (transaction.status === 'COMPLETED') {
      logger.info(`[PaymentController] Reference ${reference} already marked as COMPLETED.`);
      return { success: true, status: 'COMPLETED', transaction };
    }

    const expectedAmount = transaction.total;
    const expectedCurrency = transaction.currencyCode || 'USD';

    const verification = await PaymentService.verify(
      provider,
      reference,
      expectedAmount,
      expectedCurrency
    );

    if (verification.success && verification.status === 'COMPLETED') {
      // Safely decrease stock levels
      for (const item of transaction.items) {
        const product = await Product.findById(item.productId);
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

      transaction.status = 'COMPLETED';
      await transaction.save();

      // Clear cache layer
      await redis.del(['products:all', 'transactions:all']);

      // Socket notification
      io.emitGlobal('transaction:completed', transaction);

      return {
        success: true,
        status: 'COMPLETED',
        transaction,
        gatewayResponse: verification.gatewayResponse,
      };
    } else {
      transaction.status = 'CANCELLED';
      await transaction.save();

      return {
        success: false,
        status: 'FAILED',
        transaction,
        gatewayResponse: verification.gatewayResponse,
      };
    }
  }

  /**
   * Strict verification of checkout payment session directly with the gateway.
   */
  public static async verifyCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const input = {
        provider: (req.body && req.body.provider) || req.query.provider,
        reference: (req.body && req.body.reference) || req.query.reference,
      };

      const { provider, reference } = verifyCheckoutSchema.parse(input);

      const result = await PaymentController.verifyAndProcessPayment(
        provider as PaymentProvider,
        reference
      );

      if (result.success) {
        res.json(result);
      } else {
        // Return 200 so the client can inspect result.success cleanly without Axios throwing.
        // A 400 here fires the global error interceptor and swallows the useful gatewayResponse.
        res.status(200).json({
          ...result,
          message: result.gatewayResponse || 'Payment not yet confirmed by gateway.',
        });
      }
    } catch (err: unknown) {
      next(err);
    }
  }

  /**
   * Refunding an initialized transaction via standard admin permissions.
   */
  public static async refundCheckout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { reference, amount } = refundCheckoutSchema.parse(req.body);

      const transaction = await Transaction.findOne({ transactionNumber: reference });
      if (!transaction) {
        throw new NotFoundError(`Transaction for reference ${reference} not found.`);
      }

      if (transaction.status !== 'COMPLETED') {
        throw new ValidationError('Only successfully completed transactions can be refunded.');
      }

      const provider: PaymentProvider =
        transaction.paymentMethod === 'MOBILE' ? 'PAYSTACK' : 'STRIPE';

      // Perform gateway refund
      const refundResult = await PaymentService.refund(provider, reference, amount);

      if (refundResult.success) {
        // Return products to inventory stock ledger
        for (const item of transaction.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            product.quantity += item.quantity;
            await product.save();
            io.emitGlobal('product:stock-updated', {
              productId: product._id,
              quantity: product.quantity,
            });
          }
        }

        // Update database state
        transaction.status = 'CANCELLED';
        await transaction.save();
        await redis.del(['products:all', 'transactions:all']);

        res.json({
          success: true,
          message: `Successfully refunded $${amount} via ${provider}. Restored catalog stocks.`,
          refundId: refundResult.refundId,
        });
      } else {
        throw new Error('Gateway rejected refund request');
      }
    } catch (err: unknown) {
      next(err);
    }
  }
}
