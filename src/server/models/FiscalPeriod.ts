import mongoose, { Schema, Document } from 'mongoose';

export type PeriodStatus = 'OPEN' | 'CLOSED';

export interface IFiscalPeriod extends Document {
  tenantId?: string;
  companyId?: mongoose.Types.ObjectId;
  periodCode: string;
  year: number;
  month: number;
  startDate: Date;
  endDate: Date;
  status: PeriodStatus;
  closedBy?: mongoose.Types.ObjectId;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FiscalPeriodSchema = new Schema<IFiscalPeriod>(
  {
    tenantId: { type: String, index: true },
    companyId: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    periodCode: { type: String, required: true, unique: true, index: true },
    year: { type: Number, required: true, index: true },
    month: { type: Number, required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      required: true,
      default: 'OPEN',
      index: true,
    },
    closedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

export const FiscalPeriod = mongoose.model<IFiscalPeriod>('FiscalPeriod', FiscalPeriodSchema);
