import mongoose, { Schema, Types } from 'mongoose';

// This model stores user password reset requests. Every document automatically
// expires and gets deleted after 24 hours (the password reset link expires
// after 24 hours).

export interface IPasswordReset extends Document {
  user: Types.ObjectId,
  hash: string,
  passwordResetExpire: Date
}

const passowrdResetSchema = new Schema<IPasswordReset>({
  user: { type: Schema.Types.ObjectId, required: true },
  hash: { type: String, required: true },
  passwordResetExpire: { type: Date, expires: '24h', default: new Date() }
});

export const PasswordReset = mongoose.model<IPasswordReset>(
    'password_reset', passowrdResetSchema);