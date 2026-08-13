import mongoose from 'mongoose';
import {
  OmnichannelOrder,
  type IOmnichannelOrder,
  type IPaymentAllocation,
} from '../models/OmnichannelOrder.js';
import { HeldSale, type IHeldSale } from '../models/HeldSale.js';
import { Product } from '../models/Product.js';
import { Transaction } from '../models/Transaction.js';
import { Receipt } from '../models/Receipt.js';
import { CRMService } from './crm.service.js';
import { LoyaltyService } from './loyalty.service.js';
import { ReservationService } from './reservation.service.js';
import { ResilientExecutor } from '../utils/resiliency/index.js';
import { logger } from '../logger.js';
import { eventBus } from '../events/eventBus.js';

export interface POSCartItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
}

export interface POSCheckoutInput {
  idempotencyKey?: string;
  branchId: string;
  warehouseId: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: POSCartItemInput[];
  payments: {
    paymentMethod: IPaymentAllocation['paymentMethod'];
    amount: number;
    referenceNumber?: string;
  }[];
  cartDiscount?: number;
  taxRate?: number; // e.g. 0.07 for 7%
  notes?: string;
}

export class POSService {
  /**
   * Calculate POS cart subtotal, tax, discounts, and total
   */
  public static calculateCart(
    items: { unitPrice: number; quantity: number; discount?: number }[],
    taxRate = 0.07,
    cartDiscount = 0
  ) {
    let subtotal = 0;
    let itemDiscounts = 0;

    for (const item of items) {
      const lineSub = item.unitPrice * item.quantity;
      const lineDisc = (item.discount || 0) * item.quantity;
      subtotal += lineSub;
      itemDiscounts += lineDisc;
    }

    const totalDiscount = itemDiscounts + cartDiscount;
    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    const taxTotal = Number((taxableAmount * taxRate).toFixed(2));
    const grandTotal = Number((taxableAmount + taxTotal).toFixed(2));

    return {
      subtotal,
      discountTotal: totalDiscount,
      taxTotal,
      grandTotal,
    };
  }

  /**
   * Process POS Checkout with split payment support, idempotency, and CRM update
   */
  public static async checkout(input: POSCheckoutInput): Promise<IOmnichannelOrder> {
    // 1. Idempotency Check
    if (input.idempotencyKey) {
      const existing = await OmnichannelOrder.findOne({ idempotencyKey: input.idempotencyKey });
      if (existing) {
        logger.info(`[POS Service] Idempotency match found for key: ${input.idempotencyKey}`);
        return existing;
      }
    }

    // 2. Validate Cart Items & Build Details
    if (!input.items || input.items.length === 0) {
      throw new Error('POS Cart cannot be empty.');
    }

    const itemDetails = [];
    for (const itemInput of input.items) {
      const product = await Product.findById(itemInput.productId);
      if (!product) {
        throw new Error(`Product ID ${itemInput.productId} not found.`);
      }
      if (product.quantity < itemInput.quantity) {
        throw new Error(
          `Insufficient stock for ${product.name} (SKU: ${product.sku}). On hand: ${product.quantity}`
        );
      }

      const unitPrice = itemInput.unitPrice ?? product.sellingPrice;
      const discount = itemInput.discount ?? 0;
      const lineTotal = Math.max(0, (unitPrice - discount) * itemInput.quantity);

      itemDetails.push({
        productId: new mongoose.Types.ObjectId(product._id.toString()),
        sku: product.sku,
        name: product.name,
        quantity: itemInput.quantity,
        unitPrice,
        discount,
        tax: 0,
        total: lineTotal,
      });
    }

    // 3. Totals calculation
    const calc = this.calculateCart(itemDetails, input.taxRate || 0.07, input.cartDiscount || 0);

    // 4. Validate Payments Sum
    const totalPayments = input.payments.reduce((acc, p) => acc + p.amount, 0);
    if (Number(totalPayments.toFixed(2)) < calc.grandTotal) {
      throw new Error(
        `Insufficient payment amount. Total due: $${calc.grandTotal}, provided: $${totalPayments.toFixed(2)}`
      );
    }

    // 5. Generate Order Number
    const orderCount = await OmnichannelOrder.countDocuments();
    const orderNumber = `POS-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${String(orderCount + 1).padStart(4, '0')}`;

    // 6. Formulate Payments Array
    const paymentAllocations: IPaymentAllocation[] = input.payments.map((p) => ({
      paymentMethod: p.paymentMethod,
      amount: p.amount,
      referenceNumber: p.referenceNumber || `REF-${Date.now()}`,
      status: 'PAID',
      paidAt: new Date(),
    }));

    // 7. Create Omnichannel Order Record
    const order = await OmnichannelOrder.create({
      orderNumber,
      channel: 'POS',
      customerId: input.customerId ? new mongoose.Types.ObjectId(input.customerId) : undefined,
      customerName: input.customerName || 'Walk-in Customer',
      customerEmail: input.customerEmail,
      branchId: new mongoose.Types.ObjectId(input.branchId),
      warehouseId: new mongoose.Types.ObjectId(input.warehouseId),
      cashierId: input.cashierId,
      cashierName: input.cashierName,
      items: itemDetails,
      subtotal: calc.subtotal,
      taxTotal: calc.taxTotal,
      discountTotal: calc.discountTotal,
      grandTotal: calc.grandTotal,
      paymentStatus: 'PAID',
      payments: paymentAllocations,
      fulfillmentStatus: 'DELIVERED',
      fulfillmentMethod: 'PICKUP',
      status: 'COMPLETED',
      idempotencyKey: input.idempotencyKey,
      notes: input.notes,
    });

    // 8. Deduct stock & create inventory movements
    for (const item of itemDetails) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: -item.quantity },
      });
    }

    // 9. Record POS Transaction for legacy compatibility
    await Transaction.create({
      transactionNumber: orderNumber,
      type: 'SALE',
      status: 'COMPLETED',
      items: itemDetails.map((i) => ({
        productId: i.productId.toString(),
        productName: i.name,
        sku: i.sku,
        quantity: i.quantity,
        price: i.unitPrice,
        discount: i.discount,
        total: i.total,
      })),
      subtotal: calc.subtotal,
      tax: calc.taxTotal,
      discount: calc.discountTotal,
      total: calc.grandTotal,
      paymentMethod: input.payments.length > 1 ? 'SPLIT' : input.payments[0].paymentMethod,
      customerEmail: input.customerEmail,
      cashierId: input.cashierId,
      cashierName: input.cashierName,
      branchId: input.branchId,
      branchName: 'Main Store',
    });

    // 10. Update Customer 360 & Loyalty
    if (input.customerId) {
      await ResilientExecutor.execute({ name: `pos-crm-update:${orderNumber}` }, async () => {
        await CRMService.recalculateCustomerMetrics(input.customerId!);
        await CRMService.recordTimelineEvent(
          input.customerId!,
          'PURCHASE',
          `POS Purchase #${orderNumber}`,
          `Total paid: $${calc.grandTotal}`,
          { orderNumber, total: calc.grandTotal }
        );
        await LoyaltyService.earnPoints(input.customerId!, calc.grandTotal, orderNumber);
      });
    }

    // 11. Emit POS event
    eventBus.emit('order.created', { orderNumber, channel: 'POS', total: calc.grandTotal });
    eventBus.emit('order.payment.completed', { orderNumber, total: calc.grandTotal });

    return order;
  }

  /**
   * Hold Sale (Park Cart)
   */
  public static async holdSale(
    cashierId: string,
    cashierName: string,
    branchId: string,
    cartItems: IHeldSale['cartItems'],
    customer?: { id?: string; name?: string },
    notes?: string
  ): Promise<IHeldSale> {
    const holdId = `HOLD-${Date.now()}`;
    const subtotal = cartItems.reduce((acc, item) => acc + item.total, 0);

    const held = await HeldSale.create({
      holdId,
      cashierId,
      cashierName,
      branchId: new mongoose.Types.ObjectId(branchId),
      customerId: customer?.id ? new mongoose.Types.ObjectId(customer.id) : undefined,
      customerName: customer?.name,
      cartItems,
      subtotal,
      notes,
    });

    logger.info(`[POS Service] Cart held with ID: ${holdId} by ${cashierName}`);
    return held;
  }

  /**
   * Resume Sale
   */
  public static async resumeSale(holdId: string): Promise<IHeldSale> {
    const held = await HeldSale.findOneAndDelete({ holdId });
    if (!held) {
      throw new Error(`Held sale ${holdId} not found.`);
    }
    return held;
  }

  /**
   * List all held sales for a cashier / branch
   */
  public static async getHeldSales(branchId: string): Promise<IHeldSale[]> {
    return HeldSale.find({ branchId: new mongoose.Types.ObjectId(branchId) }).sort({
      createdAt: -1,
    });
  }

  /**
   * Generate Receipt Metadata (58mm / 80mm printable layout)
   */
  public static async generateReceipt(orderNumber: string, paperWidth: '58mm' | '80mm' = '80mm') {
    const order = await OmnichannelOrder.findOne({ orderNumber });
    if (!order) {
      throw new Error(`Order #${orderNumber} not found.`);
    }

    const receipt = {
      receiptNumber: `REC-${order.orderNumber}`,
      paperWidth,
      businessName: 'Stockora Enterprise Superstore',
      branchName: 'Central POS Branch',
      cashierName: order.cashierName || 'Cashier',
      date: order.createdAt,
      customerName: order.customerName || 'Walk-in Customer',
      items: order.items.map((i) => ({
        name: i.name,
        sku: i.sku,
        qty: i.quantity,
        price: i.unitPrice,
        total: i.total,
      })),
      subtotal: order.subtotal,
      discount: order.discountTotal,
      tax: order.taxTotal,
      total: order.grandTotal,
      payments: order.payments.map((p) => ({
        method: p.paymentMethod,
        amount: p.amount,
      })),
      footer:
        'Thank you for shopping at Stockora Enterprise! Retain receipt for returns within 14 days.',
    };

    await Receipt.create({
      receiptNumber: receipt.receiptNumber,
      orderId: order.orderNumber,
      totalAmount: order.grandTotal,
      printedAt: new Date(),
    }).catch(() => {});

    return receipt;
  }

  /**
   * Offline Sync: Process queued offline transactions
   */
  public static async syncOfflineQueue(offlineTransactions: POSCheckoutInput[]): Promise<{
    syncedCount: number;
    errors: string[];
  }> {
    let syncedCount = 0;
    const errors: string[] = [];

    for (const tx of offlineTransactions) {
      try {
        await this.checkout(tx);
        syncedCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Offline Tx (Key: ${tx.idempotencyKey || 'N/A'}): ${msg}`);
      }
    }

    logger.info(
      `[POS Service] Offline sync complete. Synced: ${syncedCount}, Errors: ${errors.length}`
    );
    return { syncedCount, errors };
  }
}
