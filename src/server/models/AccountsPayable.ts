import mongoose, { Schema, Document } from 'mongoose';
import type { AgingBucket, PaymentStatus } from './AccountsReceivable.js';

export interface IAccountsPayable extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  supplierName: string;
  supplierInvoiceId?: mongoose.Types.ObjectId;
  invoiceNumber: string;
  purchaseOrderId?: mongoose.Types.ObjectId;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  agingBucket: AgingBucket;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AccountsPayableSchema = new Schema<IAccountsPayable>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierName: { type: String, required: true },
    supplierInvoiceId: { type: Schema.Types.ObjectId, ref: 'SupplierInvoice' },
    invoiceNumber: { type: String, required: true, index: true },
    purchaseOrderId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, default: 0, min: 0 },
    balanceDue: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    issueDate: { type: Date, required: true, default: Date.now, index: true },
    dueDate: { type: Date, required: true, index: true },
    agingBucket: {
      type: String,
      enum: ['CURRENT', '1-30_DAYS', '31-60_DAYS', '61-90_DAYS', '90+_DAYS'],
      required: true,
      default: 'CURRENT',
      index: true,
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      required: true,
      default: 'UNPAID',
      index: true,
    },
  },
  { timestamps: true }
);

export const AccountsPayable = mongoose.model<IAccountsPayable>(
  'AccountsPayable',
  AccountsPayableSchema
);
