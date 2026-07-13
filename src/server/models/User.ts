import mongoose, { Schema, type Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  roleName: string;
  isActive: boolean;
  isVerified: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  themePreference: 'light' | 'dark';
  preferredLanguage: string;
  timeZone: string;
  avatarUrl?: string;
  comparePassword: (password: string) => Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, trim: true, minlength: 3 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    roleName: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    themePreference: { type: String, enum: ['light', 'dark'], default: 'dark' },
    preferredLanguage: { type: String, default: 'en' },
    timeZone: { type: String, default: 'UTC' },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (err: unknown) {
    next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
