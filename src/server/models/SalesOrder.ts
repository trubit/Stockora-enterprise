import mongoose, { Schema, type Document } from 'mongoose';

export interface ISalesOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  shippedQuantity: number;
}

export interface ISalesOrder extends Document {
  orderNumber: string;
  quoteId?: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  items: ISalesOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'APPROVED' | 'PARTIALLY_SHIPPED' | 'SHIPPED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalesOrderItemSchema = new Schema<ISalesOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  shippedQuantity: { type: Number, required: true, default: 0, min: 0 },
});

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    quoteId: { type: Schema.Types.ObjectId, ref: 'SalesQuote' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    items: [SalesOrderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'PARTIALLY_SHIPPED', 'SHIPPED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const SalesOrder = mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
