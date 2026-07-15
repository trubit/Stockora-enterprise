import mongoose, { Schema, type Document } from 'mongoose';

export interface IStockAdjustment extends Document {
  productId: mongoose.Types.ObjectId;
  adjustmentNumber: string;
  type: 'ADD' | 'REMOVE' | 'SET';
  reason: 'COUNT_MISMATCH' | 'DAMAGED' | 'EXPIRED' | 'THEFT' | 'PROMOTION';
  quantity: number;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    adjustmentNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['ADD', 'REMOVE', 'SET'], required: true },
    reason: { type: String, enum: ['COUNT_MISMATCH', 'DAMAGED', 'EXPIRED', 'THEFT', 'PROMOTION'], required: true },
    quantity: { type: Number, required: true },
    notes: { type: String },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

export const StockAdjustment = mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema);
