import mongoose, { Schema, Types } from 'mongoose';

export interface ISummary extends Document {
  user: Types.ObjectId,
  book: Types.ObjectId,
  summary: string
}

const summarySchema = new Schema<ISummary>({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  book: { type: Schema.Types.ObjectId, ref: 'book', required: true },
  summary: { type: String, required: true }
});

export const Summary = mongoose.model<ISummary>('summary', summarySchema);