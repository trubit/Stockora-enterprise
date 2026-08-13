import mongoose, { Schema, type Document } from 'mongoose';

export interface IPurchaseOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  costPrice: number;
  receivedQuantity: number;
  taxRate?: number;
  lineTotal?: number;
}

export type POStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'SENT'
  | 'SUPPLIER_CONFIRMED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'BILLED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface IPurchaseOrder extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  warehouseId?: mongoose.Types.ObjectId;
  poNumber: string;
  requisitionId?: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  items: IPurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  expectedDeliveryDate?: Date;
  paymentTerms?: string;
  status: POStatus;
  version: number;
  termsAndConditions?: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseOrderItemSchema = new Schema<IPurchaseOrderItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  costPrice: { type: Number, required: true, min: 0 },
  receivedQuantity: { type: Number, required: true, default: 0, min: 0 },
  taxRate: { type: Number, default: 0, min: 0 },
  lineTotal: { type: Number, default: 0, min: 0 },
});

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
    poNumber: { type: String, required: true, unique: true, index: true },
    requisitionId: { type: Schema.Types.ObjectId, ref: 'PurchaseRequisition' },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    items: [PurchaseOrderItemSchema],
    subtotal: { type: Number, required: true, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD', uppercase: true, trim: true },
    expectedDeliveryDate: { type: Date, index: true },
    paymentTerms: { type: String, default: 'NET 30' },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING_APPROVAL',
        'APPROVED',
        'SENT',
        'SUPPLIER_CONFIRMED',
        'PARTIALLY_RECEIVED',
        'RECEIVED',
        'BILLED',
        'CLOSED',
        'REJECTED',
        'CANCELLED',
        'EXPIRED',
      ],
      default: 'PENDING_APPROVAL',
      required: true,
      index: true,
    },
    version: { type: Number, default: 1, min: 1 },
    termsAndConditions: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

export const PurchaseOrder =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
