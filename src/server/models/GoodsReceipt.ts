import mongoose, { Schema, type Document } from 'mongoose';

export interface IGoodsReceiptItem {
  productId: mongoose.Types.ObjectId;
  quantityReceived: number;
}

export interface IGoodsReceipt extends Document {
  grnNumber: string;
  poId: mongoose.Types.ObjectId;
  items: IGoodsReceiptItem[];
  receivedBy: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoodsReceiptItemSchema = new Schema<IGoodsReceiptItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityReceived: { type: Number, required: true, min: 1 },
});

const GoodsReceiptSchema = new Schema<IGoodsReceipt>(
  {
    grnNumber: { type: String, required: true, unique: true, index: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    items: [GoodsReceiptItemSchema],
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const GoodsReceipt = mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
