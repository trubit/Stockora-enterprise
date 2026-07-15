import mongoose, { Schema, type Document } from 'mongoose';

export interface ISupplierInvoice extends Document {
  invoiceNumber: string;
  poId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  amount: number;
  dueDate: Date;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  paymentTerms: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierInvoiceSchema = new Schema<ISupplierInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'],
      default: 'UNPAID',
      required: true,
      index: true,
    },
    paymentTerms: { type: String, required: true, default: 'NET 30' },
    notes: { type: String },
  },
  { timestamps: true }
);

export const SupplierInvoice = mongoose.model<ISupplierInvoice>('SupplierInvoice', SupplierInvoiceSchema);
