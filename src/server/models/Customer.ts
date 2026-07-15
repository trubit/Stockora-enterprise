import mongoose, { Schema, type Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  code: string;
  email: string;
  phone?: string;
  group: string;
  creditLimit: number;
  loyaltyPoints: number;
  billingAddress?: string;
  shippingAddress?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    group: { type: String, required: true, default: 'RETAIL', index: true },
    creditLimit: { type: Number, required: true, default: 0, min: 0 },
    loyaltyPoints: { type: Number, required: true, default: 0, min: 0 },
    billingAddress: { type: String, trim: true },
    shippingAddress: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
