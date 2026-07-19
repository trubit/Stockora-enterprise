import mongoose, { Schema, type Document } from 'mongoose';

export interface ITransactionItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface ITransaction extends Document {
  transactionNumber: string;
  type: 'SALE' | 'RETURN' | 'TRANSFER';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  items: ITransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE' | 'SPLIT';
  currencyCode: string;
  exchangeRate: number;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionItemSchema = new Schema<ITransactionItem>({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  sku: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  discount: { type: Number, required: true, default: 0 },
  total: { type: Number, required: true },
});

const TransactionSchema = new Schema<ITransaction>(
  {
    transactionNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true, enum: ['SALE', 'RETURN', 'TRANSFER'], default: 'SALE' },
    status: { type: String, required: true, enum: ['COMPLETED', 'PENDING', 'CANCELLED'], default: 'COMPLETED', index: true },
    items: [TransactionItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0, default: 0 },
    discount: { type: Number, required: true, min: 0, default: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, required: true, enum: ['CASH', 'CARD', 'MOBILE', 'SPLIT'], default: 'CASH' },
    currencyCode: { type: String, default: 'USD', uppercase: true },
    exchangeRate: { type: Number, default: 1.0 },
    cashierId: { type: String, required: true, index: true },
    cashierName: { type: String, required: true },
    branchId: { type: String, required: true, index: true },
    branchName: { type: String, required: true },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
