import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'POSTED' | 'REJECTED';

export interface IExpense extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  expenseNumber: string;
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  vendorName?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  expenseDate: Date;
  paymentMethod: string;
  notes?: string;
  receiptAttachmentUrl?: string;
  status: ExpenseStatus;
  approvedBy?: mongoose.Types.ObjectId;
  journalEntryId?: mongoose.Types.ObjectId;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    expenseNumber: { type: String, required: true, unique: true, index: true },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseCategory',
      required: true,
      index: true,
    },
    categoryName: { type: String, required: true },
    vendorName: { type: String },
    amount: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, required: true, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    expenseDate: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: { type: String, required: true, default: 'CASH' },
    notes: { type: String },
    receiptAttachmentUrl: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'POSTED', 'REJECTED'],
      required: true,
      default: 'DRAFT',
      index: true,
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    journalEntryId: { type: Schema.Types.ObjectId, ref: 'JournalEntry' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
