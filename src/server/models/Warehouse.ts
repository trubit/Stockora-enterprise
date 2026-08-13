import mongoose, { Schema, type Document } from 'mongoose';

export type WarehouseType =
  | 'MAIN'
  | 'DISTRIBUTION_CENTER'
  | 'RETAIL_STORE'
  | 'FULFILLMENT_CENTER'
  | 'RETURNS_CENTER'
  | 'TRANSIT';

export interface IOperatingHours {
  dayOfWeek: number; // 0=Sun … 6=Sat
  openTime: string; // 'HH:MM'
  closeTime: string;
  isClosed: boolean;
}

export interface IWarehouse extends Document {
  companyId: mongoose.Types.ObjectId;
  branchId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  warehouseType: WarehouseType;
  address?: string;
  city?: string;
  country?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  managerId?: mongoose.Types.ObjectId;
  timezone: string;
  operatingHours: IOperatingHours[];
  capacityUnits?: number;
  capacityWeight?: number; // kg
  capacityVolume?: number; // m³
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OperatingHoursSchema = new Schema<IOperatingHours>(
  {
    dayOfWeek: { type: Number, min: 0, max: 6, required: true },
    openTime: { type: String, default: '08:00' },
    closeTime: { type: String, default: '18:00' },
    isClosed: { type: Boolean, default: false },
  },
  { _id: false }
);

const WarehouseSchema = new Schema<IWarehouse>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    warehouseType: {
      type: String,
      enum: [
        'MAIN',
        'DISTRIBUTION_CENTER',
        'RETAIL_STORE',
        'FULFILLMENT_CENTER',
        'RETURNS_CENTER',
        'TRANSIT',
      ],
      default: 'MAIN',
    },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    contactPerson: { type: String, trim: true },
    contactEmail: { type: String, trim: true, lowercase: true },
    contactPhone: { type: String, trim: true },
    managerId: { type: Schema.Types.ObjectId, ref: 'User' },
    timezone: { type: String, default: 'UTC' },
    operatingHours: { type: [OperatingHoursSchema], default: [] },
    capacityUnits: { type: Number, min: 0 },
    capacityWeight: { type: Number, min: 0 },
    capacityVolume: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

WarehouseSchema.index({ companyId: 1, code: 1 }, { unique: true });

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
