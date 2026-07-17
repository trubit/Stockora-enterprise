import mongoose, { Schema, type Document } from 'mongoose';

export interface ILoyaltyHistoryEntry {
  date: Date;
  points: number; // Positive = earned, negative = spent/expired
  reason: string;
  referenceId?: string; // Transaction or promo reference
}

export interface ICustomer extends Document {
  name: string;
  code: string;
  email: string;
  phone?: string;
  group: string;
  creditLimit: number;
  loyaltyPoints: number;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  loyaltyHistory: ILoyaltyHistoryEntry[];
  birthday?: Date;
  referralCode?: string;
  billingAddress?: string;
  shippingAddress?: string;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LoyaltyHistorySchema = new Schema<ILoyaltyHistoryEntry>({
  date: { type: Date, required: true, default: Date.now },
  points: { type: Number, required: true },
  reason: { type: String, required: true },
  referenceId: { type: String },
});

const CustomerSchema = new Schema<ICustomer>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true },
    group: { type: String, required: true, default: 'RETAIL', index: true },
    creditLimit: { type: Number, required: true, default: 0, min: 0 },
    loyaltyPoints: { type: Number, required: true, default: 0, min: 0 },
    loyaltyTier: {
      type: String,
      required: true,
      enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      default: 'BRONZE',
    },
    loyaltyHistory: { type: [LoyaltyHistorySchema], default: [] },
    birthday: { type: Date },
    referralCode: { type: String, unique: true, sparse: true },
    billingAddress: { type: String, trim: true },
    shippingAddress: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

CustomerSchema.index({ loyaltyTier: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

