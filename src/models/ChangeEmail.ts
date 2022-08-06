import mongoose, { Schema, Types } from 'mongoose';

// This model stores user email change requests. Every document automatically
// expires and gets deleted after 24 hours (the email cange link expires after
// 24 hours).

export interface IChangeEmail extends Document {
  user: Types.ObjectId,
  email: string,
  hash: string,
  emailChangeExpire: Date
}

const changeEmailSchema = new Schema<IChangeEmail>({
  user: { type: Schema.Types.ObjectId, required: true },
  email: { type: String, required: true },
  hash: { type: String, required: true },
  emailChangeExpire: { type: Date, expires: '24h', default: new Date() }
});

export const ChangeEmail = mongoose.model<IChangeEmail>(
    'change_email', changeEmailSchema);