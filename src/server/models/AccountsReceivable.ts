import mongoose, { Schema, Document } from 'mongoose';

export type AgingBucket = 'CURRENT' | '1-30_DAYS' | '31-60_DAYS' | '61-90_DAYS' | '90+_DAYS';
export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';

export interface IAccountsReceivable extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  customerName: string;
  invoiceId?: mongoose.Types.ObjectId;
  invoiceNumber: string;
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

const AccountsReceivableSchema = new Schema<IAccountsReceivable>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerName: { type: String, required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    invoiceNumber: { type: String, required: true, index: true },
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

export const AccountsReceivable = mongoose.model<IAccountsReceivable>(
  'AccountsReceivable',
  AccountsReceivableSchema
);
