import mongoose, { Schema, type Document } from 'mongoose';

export type CampaignType =
  'PROMOTIONAL' | 'PRODUCT_ANNOUNCEMENT' | 'LOYALTY' | 'RE_ENGAGEMENT' | 'SEASONAL' | 'CLEARANCE';

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export type CampaignChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';

export interface IMarketingCampaign extends Document {
  tenantId?: string;
  companyId?: string;
  title: string;
  type: CampaignType;
  status: CampaignStatus;
  channel: CampaignChannel;
  targetSegmentId?: mongoose.Types.ObjectId;
  targetSegmentName?: string;
  messageTemplate: string;
  couponCode?: string;
  scheduledAt?: Date;
  sentAt?: Date;
  stats: {
    targetCount: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    convertedCount: number;
    totalRevenue: number;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MarketingCampaignSchema = new Schema<IMarketingCampaign>(
  {
    tenantId: { type: String, index: true, default: 'default' },
    companyId: { type: String, index: true, default: 'default' },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'PROMOTIONAL',
        'PRODUCT_ANNOUNCEMENT',
        'LOYALTY',
        'RE_ENGAGEMENT',
        'SEASONAL',
        'CLEARANCE',
      ],
      required: true,
      default: 'PROMOTIONAL',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'],
      required: true,
      default: 'EMAIL',
    },
    targetSegmentId: { type: Schema.Types.ObjectId, ref: 'CustomerSegment' },
    targetSegmentName: { type: String },
    messageTemplate: { type: String, required: true },
    couponCode: { type: String },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    stats: {
      targetCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      openedCount: { type: Number, default: 0 },
      clickedCount: { type: Number, default: 0 },
      convertedCount: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const MarketingCampaign = mongoose.model<IMarketingCampaign>(
  'MarketingCampaign',
  MarketingCampaignSchema
);
