import mongoose, { Schema, Document } from 'mongoose';
import type { ReconciliationStatus } from './BankTransaction.js';

export interface IPaymentReconciliation extends Document {
  tenantId?: string;
  reconciliationNumber: string;
  statementDate: Date;
  bankAccountId: mongoose.Types.ObjectId;
  openingBalance: number;
  closingBalance: number;
  matchedCount: number;
  unmatchedCount: number;
  status: ReconciliationStatus;
  notes?: string;
  reconciledBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentReconciliationSchema = new Schema<IPaymentReconciliation>(
  {
    tenantId: { type: String, index: true },
    reconciliationNumber: { type: String, required: true, unique: true, index: true },
    statementDate: { type: Date, required: true, default: Date.now, index: true },
    bankAccountId: { type: Schema.Types.ObjectId, ref: 'BankAccount', required: true, index: true },
    openingBalance: { type: Number, required: true, default: 0 },
    closingBalance: { type: Number, required: true, default: 0 },
    matchedCount: { type: Number, required: true, default: 0 },
    unmatchedCount: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ['MATCHED', 'PARTIALLY_MATCHED', 'UNMATCHED', 'EXCEPTION'],
      required: true,
      default: 'UNMATCHED',
      index: true,
    },
    notes: { type: String },
    reconciledBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const PaymentReconciliation = mongoose.model<IPaymentReconciliation>(
  'PaymentReconciliation',
  PaymentReconciliationSchema
);
