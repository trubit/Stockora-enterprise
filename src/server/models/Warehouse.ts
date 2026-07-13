import mongoose, { Schema, type Document } from 'mongoose';

export interface IWarehouse extends Document {
  branchId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  zones: string[];
  capacity?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    zones: [{ type: String }],
    capacity: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
