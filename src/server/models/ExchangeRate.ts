import mongoose, { Schema, type Document } from 'mongoose';

export interface IExchangeRate extends Document {
  code: string; // e.g. 'EUR', 'GBP', 'NGN'
  symbol: string; // e.g. '€', '£', '₦'
  rate: number; // conversion factor relative to base (USD = 1.0)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExchangeRateSchema = new Schema<IExchangeRate>(
  {
    code: { type: String, required: true, unique: true, index: true, uppercase: true, trim: true },
    symbol: { type: String, required: true },
    rate: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const ExchangeRate =
  mongoose.models.ExchangeRate || mongoose.model<IExchangeRate>('ExchangeRate', ExchangeRateSchema);
