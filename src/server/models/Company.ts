import mongoose, { Schema, type Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  logoUrl?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  currency: string;
  timeZone: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String },
    taxId: { type: String, trim: true },
    address: { type: String },
    phone: { type: String },
    currency: { type: String, default: 'USD' },
    timeZone: { type: String, default: 'UTC' },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
