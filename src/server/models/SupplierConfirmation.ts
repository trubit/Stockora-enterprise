import mongoose, { Schema, type Document } from 'mongoose';

export type ConfirmationStatus =
  'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED' | 'COUNTER_PROPOSED';

export interface ISupplierConfirmationItem {
  productId: mongoose.Types.ObjectId;
  orderedQuantity: number;
  confirmedQuantity: number;
  confirmedCostPrice?: number;
}

export interface ISupplierConfirmation extends Document {
  tenantId?: string;
  poId: mongoose.Types.ObjectId;
  status: ConfirmationStatus;
  responseDate: Date;
  supplierMessage?: string;
  items: ISupplierConfirmationItem[];
  revisedDeliveryDate?: Date;
  confirmedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierConfirmationItemSchema = new Schema<ISupplierConfirmationItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  orderedQuantity: { type: Number, required: true, min: 0 },
  confirmedQuantity: { type: Number, required: true, min: 0 },
  confirmedCostPrice: { type: Number, min: 0 },
});

const SupplierConfirmationSchema = new Schema<ISupplierConfirmation>(
  {
    tenantId: { type: String, index: true },
    poId: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    status: {
      type: String,
      enum: ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'COUNTER_PROPOSED'],
      required: true,
      index: true,
    },
    responseDate: { type: Date, default: Date.now },
    supplierMessage: { type: String },
    items: [SupplierConfirmationItemSchema],
    revisedDeliveryDate: { type: Date },
    confirmedBy: { type: String },
  },
  { timestamps: true }
);

export const SupplierConfirmation =
  mongoose.models.SupplierConfirmation ||
  mongoose.model<ISupplierConfirmation>('SupplierConfirmation', SupplierConfirmationSchema);
