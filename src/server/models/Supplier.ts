import mongoose, { Schema, type Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  creditLimit: number;
  taxId?: string;
  rating: number;
  documents: string[];
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    paymentTerms: { type: String, required: true, default: 'NET 30' },
    creditLimit: { type: Number, required: true, default: 0, min: 0 },
    taxId: { type: String, trim: true },
    rating: { type: Number, required: true, default: 5, min: 1, max: 5 },
    documents: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
