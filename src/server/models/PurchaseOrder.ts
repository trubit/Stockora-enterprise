import mongoose, { Schema, type Document } from 'mongoose';

export interface IPurchaseOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  costPrice: number;
  receivedQuantity: number;
}

export interface IPurchaseOrder extends Document {
  poNumber: string;
  requisitionId?: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  totalAmount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'BILLED' | 'CANCELLED';
  approvedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  costPrice: { type: Number, required: true, min: 0 },
  receivedQuantity: { type: Number, required: true, default: 0, min: 0 },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    requisitionId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    items: [PurchaseOrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'BILLED', 'CANCELLED'],
      default: 'PENDING_APPROVAL',
      required: true,
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
