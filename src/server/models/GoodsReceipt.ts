import mongoose, { Schema, type Document } from 'mongoose';

export interface IGoodsReceiptItem {
  productId: mongoose.Types.ObjectId;
  quantityOrdered?: number;
  quantityReceived: number;
  quantityRejected?: number;
  unitCost?: number;
  batchNumber?: string;
  serialNumbers?: string[];
  expiryDate?: Date;
  barcodeScanned?: boolean;
}

export interface IGoodsReceipt extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  warehouseId?: mongoose.Types.ObjectId;
  grnNumber: string;
  poId: mongoose.Types.ObjectId;
  items: IGoodsReceiptItem[];
  receivedBy: mongoose.Types.ObjectId;
  inspectionStatus: 'NOT_REQUIRED' | 'PENDING' | 'PASSED' | 'FAILED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const GoodsReceiptItemSchema = new Schema<IGoodsReceiptItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityOrdered: { type: Number, min: 0 },
  quantityReceived: { type: Number, required: true, min: 0 },
  quantityRejected: { type: Number, default: 0, min: 0 },
  unitCost: { type: Number, min: 0 },
  batchNumber: { type: String, trim: true },
  serialNumbers: [{ type: String, trim: true }],
  expiryDate: { type: Date },
  barcodeScanned: { type: Boolean, default: false },
});

const GoodsReceiptSchema = new Schema<IGoodsReceipt>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
    grnNumber: { type: String, required: true, unique: true, index: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    items: [GoodsReceiptItemSchema],
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    inspectionStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'PASSED', 'FAILED'],
      default: 'NOT_REQUIRED',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const GoodsReceipt =
  mongoose.models.GoodsReceipt || mongoose.model<IGoodsReceipt>('GoodsReceipt', GoodsReceiptSchema);
