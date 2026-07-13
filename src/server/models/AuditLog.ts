import mongoose, { Schema, type Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  targetModel: string;
  targetId: string;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  previousValues?: Record<string, any>;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  newValues?: Record<string, any>;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    targetModel: { type: String, required: true },
    targetId: { type: String, required: true },
    previousValues: { type: Schema.Types.Map, of: Schema.Types.Mixed },
    newValues: { type: Schema.Types.Map, of: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
