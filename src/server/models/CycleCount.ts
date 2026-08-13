import mongoose, { Schema, type Document } from 'mongoose';

export type CountType = 'SCHEDULED' | 'RANDOM' | 'ABC' | 'LOCATION' | 'PRODUCT';

export interface ICycleCountItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  locationId: mongoose.Types.ObjectId;
  locationCode: string;
  lotNumber?: string;
  serialNumber?: string;
  expectedQuantity: number;
  countedQuantity?: number;
  variance?: number; // countedQuantity - expectedQuantity
  varianceValue?: number; // variance * unitCost
  unitCost?: number;
  status: 'PENDING' | 'COUNTED' | 'VERIFIED' | 'ADJUSTED' | 'REJECTED';
  countedAt?: Date;
  counterId?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ICycleCount extends Document {
  countNumber: string;
  companyId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  countType: CountType;
  zoneId?: mongoose.Types.ObjectId;
  isBlindCount: boolean; // Hide expected quantity from counter
  status:
    | 'DRAFT'
    | 'ASSIGNED'
    | 'IN_PROGRESS'
    | 'REVIEW_REQUIRED'
    | 'APPROVED'
    | 'COMPLETED'
    | 'CANCELLED';
  assignedCounterId?: mongoose.Types.ObjectId;
  assignedCounterName?: string;
  items: ICycleCountItem[];
  totalExpectedItems: number;
  totalCountedItems: number;
  totalVarianceCount: number;
  totalVarianceValue: number;
  approvalRequired: boolean;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  completedAt?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CycleCountItemSchema = new Schema<ICycleCountItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation', required: true },
    locationCode: { type: String, required: true },
    lotNumber: { type: String },
    serialNumber: { type: String },
    expectedQuantity: { type: Number, required: true, min: 0 },
    countedQuantity: { type: Number, min: 0 },
    variance: { type: Number },
    varianceValue: { type: Number },
    unitCost: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'COUNTED', 'VERIFIED', 'ADJUSTED', 'REJECTED'],
      default: 'PENDING',
    },
    countedAt: { type: Date },
    counterId: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  },
  { _id: true }
);

const CycleCountSchema = new Schema<ICycleCount>(
  {
    countNumber: { type: String, required: true, unique: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    countType: {
      type: String,
      enum: ['SCHEDULED', 'RANDOM', 'ABC', 'LOCATION', 'PRODUCT'],
      required: true,
    },
    zoneId: { type: Schema.Types.ObjectId, ref: 'WarehouseZone' },
    isBlindCount: { type: Boolean, default: true },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'ASSIGNED',
        'IN_PROGRESS',
        'REVIEW_REQUIRED',
        'APPROVED',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'DRAFT',
      index: true,
    },
    assignedCounterId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedCounterName: { type: String },
    items: [CycleCountItemSchema],
    totalExpectedItems: { type: Number, default: 0 },
    totalCountedItems: { type: Number, default: 0 },
    totalVarianceCount: { type: Number, default: 0 },
    totalVarianceValue: { type: Number, default: 0 },
    approvalRequired: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const CycleCount = mongoose.model<ICycleCount>('CycleCount', CycleCountSchema);
