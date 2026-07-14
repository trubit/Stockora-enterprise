import mongoose, { Schema, type Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  lowStockAlert: number;
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String },
    category: { type: String, required: true, index: true, default: 'General' },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, required: true, min: 0, default: 0 },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockAlert: { type: Number, required: true, min: 0, default: 5 },
    barcode: { type: String, index: true },
    qrCode: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
