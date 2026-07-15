import mongoose, { Schema, type Document } from 'mongoose';

export interface IPurchaseRequisitionItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  estimatedCost: number;
}

export interface IPurchaseRequisition extends Document {
  requisitionNumber: string;
  requestedBy: mongoose.Types.ObjectId;
  items: IPurchaseRequisitionItem[];
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  approvedBy?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseRequisitionItemSchema = new Schema<IPurchaseRequisitionItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  estimatedCost: { type: Number, required: true, default: 0, min: 0 },
});

const PurchaseRequisitionSchema = new Schema<IPurchaseRequisition>(
  {
    requisitionNumber: { type: String, required: true, unique: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [PurchaseRequisitionItemSchema],
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'PENDING_APPROVAL',
      required: true,
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseRequisition = mongoose.model<IPurchaseRequisition>('PurchaseRequisition', PurchaseRequisitionSchema);
