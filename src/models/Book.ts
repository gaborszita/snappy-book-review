import mongoose, { Schema } from 'mongoose';

export interface IBook extends Document {
  isbn: string,
  author: string,
  title: string,
  rating: number
}

const bookSchema = new Schema<IBook>({
  isbn: { type: String, required: true },
  author: { type: String, required: true },
  title: { type: String, required: true },
  rating: { type: Number, required: true }
});

export const Book = mongoose.model<IBook>('book', bookSchema);