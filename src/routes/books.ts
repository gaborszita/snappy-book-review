import { Router } from 'express';
import * as books from '../controllers/books';

export const router = Router();

router.get('/search/', books.search);
router.get('/book/:bookISBN', books.book);
router.get('/books/post-review', books.postReview);
router.post('/books/post-review/submit', books.postReviewSubmit);
router.get('/books/isbn-validator', books.isbnValidator);
router.post('/books/delete-review/submit', books.deleteReviewSubmit);