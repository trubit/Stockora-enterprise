import mongoose, { Schema, type Document } from 'mongoose';

export interface IStockMovement extends Document {
  productId: mongoose.Types.ObjectId;
  type: 'OPENING_STOCK' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'TRANSFER' | 'RETURN';
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  referenceId?: string;
  userId: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: ['OPENING_STOCK', 'ADJUSTMENT', 'SALE', 'PURCHASE', 'TRANSFER', 'RETURN'],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    costPrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    referenceId: { type: String, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
