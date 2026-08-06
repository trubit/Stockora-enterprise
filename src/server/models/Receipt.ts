import mongoose, { Schema, type Document } from 'mongoose';

export interface IReceipt extends Document {
  transactionId: mongoose.Types.ObjectId;
  transactionNumber: string;
  data: Record<string, unknown>;
  customerEmail?: string;
  branchId?: string;
  cashierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptSchema = new Schema(
  {
    transactionId: { type: Schema.Types.ObjectId, ref: 'Transaction', required: true, index: true },
    transactionNumber: { type: String, required: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    customerEmail: { type: String },
    branchId: { type: String, index: true },
    cashierId: { type: String, index: true },
  },
  { timestamps: true }
);

export const Receipt = mongoose.model<IReceipt>('Receipt', ReceiptSchema);
