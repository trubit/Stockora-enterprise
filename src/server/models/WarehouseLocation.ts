import mongoose, { Schema, type Document } from 'mongoose';

export interface IWarehouseLocation extends Document {
  companyId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  zoneId: mongoose.Types.ObjectId;
  /** Human-readable location code e.g. "A-01-02-03-B4" */
  locationCode: string;
  /** Descriptive label for UI display */
  label?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  locationType:
    | 'RECEIVING'
    | 'STORAGE'
    | 'PICKING'
    | 'PACKING'
    | 'QUARANTINE'
    | 'DAMAGED'
    | 'RETURNS'
    | 'DISPATCH'
    | 'TRANSIT';
  /** Max quantity of units this location can hold */
  capacityUnits?: number;
  /** Max weight in kg */
  capacityWeight?: number;
  /** Max volume in litres */
  capacityVolume?: number;
  /** Current occupancy counts updated atomically */
  currentUnits: number;
  currentWeight: number;
  currentVolume: number;
  isActive: boolean;
  isRestricted: boolean;
  allowedProductIds?: mongoose.Types.ObjectId[];
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseLocationSchema = new Schema<IWarehouseLocation>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    zoneId: { type: Schema.Types.ObjectId, ref: 'WarehouseZone', required: true, index: true },
    locationCode: { type: String, required: true, uppercase: true, trim: true },
    label: { type: String, trim: true },
    aisle: { type: String, trim: true, index: true },
    rack: { type: String, trim: true },
    shelf: { type: String, trim: true },
    bin: { type: String, trim: true },
    locationType: {
      type: String,
      enum: [
        'RECEIVING',
        'STORAGE',
        'PICKING',
        'PACKING',
        'QUARANTINE',
        'DAMAGED',
        'RETURNS',
        'DISPATCH',
        'TRANSIT',
      ],
      default: 'STORAGE',
      index: true,
    },
    capacityUnits: { type: Number, min: 0 },
    capacityWeight: { type: Number, min: 0 },
    capacityVolume: { type: Number, min: 0 },
    currentUnits: { type: Number, default: 0, min: 0 },
    currentWeight: { type: Number, default: 0, min: 0 },
    currentVolume: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isRestricted: { type: Boolean, default: false },
    allowedProductIds: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Unique location code per warehouse
WarehouseLocationSchema.index({ warehouseId: 1, locationCode: 1 }, { unique: true });
WarehouseLocationSchema.index({ warehouseId: 1, zoneId: 1, locationType: 1 });

export const WarehouseLocation = mongoose.model<IWarehouseLocation>(
  'WarehouseLocation',
  WarehouseLocationSchema
);
