import mongoose, { Schema, type Document } from 'mongoose';

export type ReorderStatus = 'RECOMMENDED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';

export interface IReorderRecommendation extends Document {
  tenantId?: string;
  companyId?: string;
  branchId?: mongoose.Types.ObjectId;
  warehouseId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  productSku?: string;
  productName?: string;
  currentStock: number;
  reorderPoint: number;
  safetyStock: number;
  expectedDemandLeadTime: number;
  recommendedQuantity: number;
  moq: number; // Minimum Order Quantity
  supplierId?: mongoose.Types.ObjectId;
  supplierName?: string;
  leadTimeDays: number;
  estimatedCost: number;
  status: ReorderStatus;
  overrideReason?: string;
  overriddenBy?: mongoose.Types.ObjectId;
  overriddenAt?: Date;
  overrideQuantity?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReorderRecommendationSchema = new Schema<IReorderRecommendation>(
  {
    tenantId: { type: String, index: true, default: 'default' },
    companyId: { type: String, index: true, default: 'default' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productSku: { type: String, index: true },
    productName: { type: String },
    currentStock: { type: Number, required: true, default: 0 },
    reorderPoint: { type: Number, required: true, default: 0 },
    safetyStock: { type: Number, required: true, default: 0 },
    expectedDemandLeadTime: { type: Number, required: true, default: 0 },
    recommendedQuantity: { type: Number, required: true, min: 0 },
    moq: { type: Number, default: 1 },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplierName: { type: String },
    leadTimeDays: { type: Number, default: 7 },
    estimatedCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['RECOMMENDED', 'PENDING', 'APPROVED', 'REJECTED', 'OVERRIDDEN'],
      default: 'RECOMMENDED',
      index: true,
    },
    overrideReason: { type: String },
    overriddenBy: { type: Schema.Types.ObjectId, ref: 'User' },
    overriddenAt: { type: Date },
    overrideQuantity: { type: Number },
  },
  { timestamps: true }
);

ReorderRecommendationSchema.index({ productId: 1, status: 1 });

export const ReorderRecommendation = mongoose.model<IReorderRecommendation>(
  'ReorderRecommendation',
  ReorderRecommendationSchema
);
