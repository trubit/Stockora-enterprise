import mongoose, { Schema, type Document } from 'mongoose';

export interface IPickItem {
  productId: mongoose.Types.ObjectId;
  sku: string;
  name: string;
  locationId: mongoose.Types.ObjectId;
  locationCode: string;
  quantityRequired: number;
  quantityPicked: number;
  quantityShort: number;
  lotNumber?: string;
  expiryDate?: Date;
  serialNumber?: string;
  status: 'PENDING' | 'PARTIAL' | 'PICKED' | 'SHORT' | 'SKIPPED';
  shortReason?: string;
  pickedAt?: Date;
  scannedSku?: string;
  scannedLocationCode?: string;
}

export interface IPickList extends Document {
  pickListNumber: string;
  companyId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  allocationId?: mongoose.Types.ObjectId;
  waveId?: mongoose.Types.ObjectId;
  pickingStrategy: 'SINGLE_ORDER' | 'BATCH' | 'ZONE' | 'WAVE';
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'PARTIAL' | 'PICKED' | 'CANCELLED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  assignedPickerId?: mongoose.Types.ObjectId;
  assignedPickerName?: string;
  items: IPickItem[];
  totalItems: number;
  totalPicked: number;
  totalShort: number;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  idempotencyKey?: string;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PickItemSchema = new Schema<IPickItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    locationId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation', required: true },
    locationCode: { type: String, required: true },
    quantityRequired: { type: Number, required: true, min: 1 },
    quantityPicked: { type: Number, default: 0, min: 0 },
    quantityShort: { type: Number, default: 0, min: 0 },
    lotNumber: { type: String },
    expiryDate: { type: Date },
    serialNumber: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'PARTIAL', 'PICKED', 'SHORT', 'SKIPPED'],
      default: 'PENDING',
    },
    shortReason: { type: String },
    pickedAt: { type: Date },
    scannedSku: { type: String },
    scannedLocationCode: { type: String },
  },
  { _id: true }
);

const PickListSchema = new Schema<IPickList>(
  {
    pickListNumber: { type: String, required: true, unique: true, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    orderId: { type: Schema.Types.ObjectId, required: true, index: true },
    orderNumber: { type: String, required: true, index: true },
    allocationId: { type: Schema.Types.ObjectId, ref: 'InventoryAllocation' },
    waveId: { type: Schema.Types.ObjectId, ref: 'PickingWave' },
    pickingStrategy: {
      type: String,
      enum: ['SINGLE_ORDER', 'BATCH', 'ZONE', 'WAVE'],
      default: 'SINGLE_ORDER',
    },
    status: {
      type: String,
      enum: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'PARTIAL', 'PICKED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    assignedPickerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    assignedPickerName: { type: String },
    items: [PickItemSchema],
    totalItems: { type: Number, default: 0 },
    totalPicked: { type: Number, default: 0 },
    totalShort: { type: Number, default: 0 },
    assignedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
    idempotencyKey: { type: String, index: true, sparse: true },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

PickListSchema.index({ warehouseId: 1, status: 1, priority: -1 });
PickListSchema.index({ orderId: 1, status: 1 });

export const PickList = mongoose.model<IPickList>('PickList', PickListSchema);
