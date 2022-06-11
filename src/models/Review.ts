import mongoose, { Schema, Types } from 'mongoose';

export interface IReview extends Document {
  user: Types.ObjectId,
  rating: number,
  comment?: string
}

const reviewSchema = new Schema<IReview>({
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String
});

export const Review = mongoose.model<IReview>('review', reviewSchema);