import mongoose, { Schema, type Document } from 'mongoose';

export interface ISegmentRule {
  field:
    | 'totalSpending'
    | 'totalOrders'
    | 'avgOrderValue'
    | 'loyaltyTier'
    | 'churnRiskLevel'
    | 'daysSinceLastPurchase';
  operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN';
  value: unknown;
}

export interface ICustomerSegment extends Document {
  tenantId?: string;
  companyId?: string;
  name: string;
  code: string;
  description?: string;
  isDynamic: boolean;
  rules: ISegmentRule[];
  memberCount: number;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SegmentRuleSchema = new Schema<ISegmentRule>({
  field: {
    type: String,
    enum: [
      'totalSpending',
      'totalOrders',
      'avgOrderValue',
      'loyaltyTier',
      'churnRiskLevel',
      'daysSinceLastPurchase',
    ],
    required: true,
  },
  operator: {
    type: String,
    enum: ['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'LESS_THAN', 'IN'],
    required: true,
  },
  value: { type: Schema.Types.Mixed, required: true },
});

const CustomerSegmentSchema = new Schema<ICustomerSegment>(
  {
    tenantId: { type: String, index: true, default: 'default' },
    companyId: { type: String, index: true, default: 'default' },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    description: { type: String },
    isDynamic: { type: Boolean, default: true },
    rules: [SegmentRuleSchema],
    memberCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const CustomerSegment = mongoose.model<ICustomerSegment>(
  'CustomerSegment',
  CustomerSegmentSchema
);
