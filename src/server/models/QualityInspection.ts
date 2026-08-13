import mongoose, { Schema, type Document } from 'mongoose';

export type InspectionResultStatus = 'ACCEPTED' | 'REJECTED' | 'DAMAGED' | 'DEFECTIVE' | 'PENDING';

export interface IQualityInspectionItem {
  productId: mongoose.Types.ObjectId;
  quantityInspected: number;
  quantityPassed: number;
  quantityFailed: number;
  failureReason?: string;
  resultStatus: InspectionResultStatus;
}

export interface IQualityInspection extends Document {
  tenantId?: string;
  inspectionNumber: string;
  grnId: mongoose.Types.ObjectId;
  poId: mongoose.Types.ObjectId;
  items: IQualityInspectionItem[];
  overallStatus: InspectionResultStatus;
  inspectorId: mongoose.Types.ObjectId;
  notes?: string;
  attachments?: string[];
  inspectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const QualityInspectionItemSchema = new Schema<IQualityInspectionItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantityInspected: { type: Number, required: true, min: 0 },
  quantityPassed: { type: Number, required: true, min: 0 },
  quantityFailed: { type: Number, required: true, min: 0 },
  failureReason: { type: String },
  resultStatus: {
    type: String,
    enum: ['ACCEPTED', 'REJECTED', 'DAMAGED', 'DEFECTIVE', 'PENDING'],
    required: true,
  },
});

const QualityInspectionSchema = new Schema<IQualityInspection>(
  {
    tenantId: { type: String, index: true },
    inspectionNumber: { type: String, required: true, unique: true, index: true },
    grnId: { type: Schema.Types.ObjectId, ref: 'GoodsReceipt', required: true, index: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    items: [QualityInspectionItemSchema],
    overallStatus: {
      type: String,
      enum: ['ACCEPTED', 'REJECTED', 'DAMAGED', 'DEFECTIVE', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    inspectorId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String },
    attachments: [{ type: String }],
    inspectedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const QualityInspection =
  mongoose.models.QualityInspection ||
  mongoose.model<IQualityInspection>('QualityInspection', QualityInspectionSchema);
