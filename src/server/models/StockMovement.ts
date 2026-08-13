import mongoose, { Schema, type Document } from 'mongoose';

/**
 * Extended StockMovement with warehouse location traceability.
 * Every inventory quantity change generates an immutable record here.
 * Do NOT delete or silently edit records; use reversal/adjustment movements.
 */
export type StockMovementType =
  | 'OPENING_STOCK'
  | 'RECEIPT' // Goods received from supplier
  | 'PUT_AWAY' // Stock moved from receiving to storage location
  | 'PICK' // Stock picked for an order
  | 'PACK' // Stock confirmed packed
  | 'DISPATCH' // Stock dispatched to customer
  | 'TRANSFER_OUT' // Stock leaving a warehouse (transfer)
  | 'TRANSFER_IN' // Stock arriving at a warehouse (transfer)
  | 'ADJUSTMENT' // Manual stock adjustment
  | 'CYCLE_COUNT' // Cycle count adjustment
  | 'RETURN' // Customer return
  | 'SUPPLIER_RETURN' // Return to supplier
  | 'DAMAGE' // Stock moved to damaged location
  | 'QUARANTINE' // Stock moved to quarantine
  | 'QUARANTINE_RELEASE' // Stock released from quarantine
  | 'WRITE_OFF' // Stock written off
  | 'SALE' // Legacy POS sale
  | 'PURCHASE'; // Legacy purchase

export interface IStockMovement extends Document {
  companyId?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  type: StockMovementType;
  quantity: number; // positive = in, negative = out
  costPrice: number;
  sellingPrice: number;
  /** Source location (null if receiving from supplier) */
  fromLocationId?: mongoose.Types.ObjectId;
  fromWarehouseId?: mongoose.Types.ObjectId;
  /** Destination location (null if dispatching to customer) */
  toLocationId?: mongoose.Types.ObjectId;
  toWarehouseId?: mongoose.Types.ObjectId;
  referenceId?: string;
  referenceType?: string; // 'PurchaseOrder' | 'OmnichannelOrder' | 'CycleCount' | ...
  lotNumber?: string;
  serialNumber?: string;
  expiryDate?: Date;
  userId: mongoose.Types.ObjectId;
  notes?: string;
  isReversal: boolean;
  reversalOfId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    type: {
      type: String,
      enum: [
        'OPENING_STOCK',
        'RECEIPT',
        'PUT_AWAY',
        'PICK',
        'PACK',
        'DISPATCH',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'ADJUSTMENT',
        'CYCLE_COUNT',
        'RETURN',
        'SUPPLIER_RETURN',
        'DAMAGE',
        'QUARANTINE',
        'QUARANTINE_RELEASE',
        'WRITE_OFF',
        'SALE',
        'PURCHASE',
      ],
      required: true,
      index: true,
    },
    quantity: { type: Number, required: true },
    costPrice: { type: Number, required: true, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0, default: 0 },
    fromLocationId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation', index: true },
    fromWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
    toLocationId: { type: Schema.Types.ObjectId, ref: 'WarehouseLocation', index: true },
    toWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', index: true },
    referenceId: { type: String, index: true },
    referenceType: { type: String },
    lotNumber: { type: String, trim: true, index: true },
    serialNumber: { type: String, trim: true, index: true },
    expiryDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    notes: { type: String },
    isReversal: { type: Boolean, default: false },
    reversalOfId: { type: Schema.Types.ObjectId, ref: 'StockMovement' },
  },
  { timestamps: true }
);

StockMovementSchema.index({ productId: 1, createdAt: -1 });
StockMovementSchema.index({ companyId: 1, type: 1, createdAt: -1 });

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
