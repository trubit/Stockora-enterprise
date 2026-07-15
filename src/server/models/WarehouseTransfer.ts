import mongoose, { Schema, type Document } from 'mongoose';

export interface IWarehouseTransferItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IWarehouseTransfer extends Document {
  transferNumber: string;
  fromWarehouseId: mongoose.Types.ObjectId;
  toWarehouseId: mongoose.Types.ObjectId;
  items: IWarehouseTransferItem[];
  status: 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  shippedAt?: Date;
  receivedAt?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  receivedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WarehouseTransferItemSchema = new Schema<IWarehouseTransferItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const WarehouseTransferSchema = new Schema<IWarehouseTransfer>(
  {
    transferNumber: { type: String, required: true, unique: true, index: true },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    items: [WarehouseTransferItemSchema],
    status: {
      type: String,
      enum: ['PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    shippedAt: { type: Date },
    receivedAt: { type: Date },
    notes: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receivedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const WarehouseTransfer = mongoose.model<IWarehouseTransfer>('WarehouseTransfer', WarehouseTransferSchema);
