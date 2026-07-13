import mongoose, { Schema, type Document } from 'mongoose';

export interface IBranch extends Document {
  companyId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerId?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BranchSchema = new Schema<IBranch>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    address: { type: String },
    phone: { type: String },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
