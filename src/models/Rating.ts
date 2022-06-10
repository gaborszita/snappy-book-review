import mongoose, { Schema, Types } from 'mongoose';

export interface IRating extends Document {
  user: Types.ObjectId,
  rating: number,
  comment?: string
}

const ratingSchema = new Schema<IRating>({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String
});

export const Rating = mongoose.model<IRating>('rating', ratingSchema);