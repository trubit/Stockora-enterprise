import mongoose, { Schema, type Document } from 'mongoose';

export interface ILoyaltyHistoryEntry {
  date: Date;
  points: number; // Positive = earned, negative = spent/expired
  reason: string;
  referenceId?: string; // Transaction or promo reference
}

export type ChurnRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ICustomer extends Document {
  tenantId?: string;
  companyId?: string;
  branchId?: mongoose.Types.ObjectId;
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
  // Phase 30 CRM Extensions
  totalSpending: number;
  totalOrders: number;
  avgOrderValue: number;
  lastPurchaseDate?: Date;
  firstPurchaseDate?: Date;
  returnsCount: number;
  refundsTotal: number;
  clvScore: number; // Customer Lifetime Value
  engagementScore: number; // 0 - 100
  churnRiskScore: number; // 0 - 100
  churnRiskLevel: ChurnRiskLevel;
  tags: string[];
  optInMarketing: boolean;
  optInSms: boolean;
  optInWhatsapp: boolean;
  consentDate?: Date;
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
    tenantId: { type: String, index: true, default: 'default' },
    companyId: { type: String, index: true, default: 'default' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
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
    // Phase 30 CRM Extensions
    totalSpending: { type: Number, default: 0, min: 0 },
    totalOrders: { type: Number, default: 0, min: 0 },
    avgOrderValue: { type: Number, default: 0, min: 0 },
    lastPurchaseDate: { type: Date },
    firstPurchaseDate: { type: Date },
    returnsCount: { type: Number, default: 0, min: 0 },
    refundsTotal: { type: Number, default: 0, min: 0 },
    clvScore: { type: Number, default: 0, min: 0 },
    engagementScore: { type: Number, default: 75, min: 0, max: 100 },
    churnRiskScore: { type: Number, default: 15, min: 0, max: 100 },
    churnRiskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
      index: true,
    },
    tags: [{ type: String, index: true }],
    optInMarketing: { type: Boolean, default: true },
    optInSms: { type: Boolean, default: true },
    optInWhatsapp: { type: Boolean, default: true },
    consentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

CustomerSchema.index({ loyaltyTier: 1, churnRiskLevel: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
