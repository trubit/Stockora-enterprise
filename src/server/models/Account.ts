import mongoose, { Schema, Document } from 'mongoose';

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE' | 'COGS';

export interface IAccount extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  code: string;
  name: string;
  type: AccountType;
  parentAccountId?: mongoose.Types.ObjectId;
  description?: string;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'COGS'],
      required: true,
      index: true,
    },
    parentAccountId: { type: Schema.Types.ObjectId, ref: 'Account', index: true },
    description: { type: String },
    currentBalance: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, default: 'USD' },
    isActive: { type: Boolean, required: true, default: true, index: true },
    isSystem: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

AccountSchema.index({ type: 1, isActive: 1 });

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
