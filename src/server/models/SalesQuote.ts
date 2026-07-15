import mongoose, { Schema, type Document } from 'mongoose';

export interface ISalesQuoteItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface ISalesQuote extends Document {
  quoteNumber: string;
  customerId?: mongoose.Types.ObjectId;
  items: ISalesQuoteItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'DRAFT' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  validUntil: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SalesQuoteItemSchema = new Schema<ISalesQuoteItem>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
});

const SalesQuoteSchema = new Schema<ISalesQuote>(
  {
    quoteNumber: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', index: true },
    items: [SalesQuoteItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    validUntil: { type: Date, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const SalesQuote = mongoose.model<ISalesQuote>('SalesQuote', SalesQuoteSchema);
