import mongoose, { Schema, type Document } from 'mongoose';

export interface ISupplierProduct extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  supplierSku: string;
  purchaseCost: number;
  currency: string;
  minimumOrderQuantity: number;
  leadTimeDays: number;
  isPreferred: boolean;
  lastPurchasePrice?: number;
  lastPurchaseDate?: Date;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  createdAt: Date;
  updatedAt: Date;
}

const SupplierProductSchema = new Schema<ISupplierProduct>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    supplierSku: { type: String, required: true, trim: true },
    purchaseCost: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD', uppercase: true, trim: true },
    minimumOrderQuantity: { type: Number, required: true, default: 1, min: 1 },
    leadTimeDays: { type: Number, required: true, default: 7, min: 0 },
    isPreferred: { type: Boolean, default: false, index: true },
    lastPurchasePrice: { type: Number, min: 0 },
    lastPurchaseDate: { type: Date },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  { timestamps: true }
);

SupplierProductSchema.index({ supplierId: 1, productId: 1 }, { unique: true });

export const SupplierProduct =
  mongoose.models.SupplierProduct ||
  mongoose.model<ISupplierProduct>('SupplierProduct', SupplierProductSchema);
