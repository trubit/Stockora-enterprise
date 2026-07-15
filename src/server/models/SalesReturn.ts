import mongoose, { Schema, type Document } from 'mongoose';

export interface ISalesReturnItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  refundAmount: number;
}

export interface ISalesReturn extends Document {
  returnNumber: string;
  orderId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  items: ISalesReturnItem[];
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdAt: Date;
  updatedAt: Date;
}

const SalesReturnItemSchema = new Schema<ISalesReturnItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  refundAmount: { type: Number, required: true, min: 0 },
});

const SalesReturnSchema = new Schema<ISalesReturn>(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    items: [SalesReturnItemSchema],
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const SalesReturn = mongoose.model<ISalesReturn>('SalesReturn', SalesReturnSchema);
