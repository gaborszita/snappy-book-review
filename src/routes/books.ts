import { Router } from 'express';
import * as books from '../controllers/books';

export const router = Router();

// GET request for search page
router.get('/search/', books.search);

// GET request for a book's page
router.get('/book/:bookISBN', books.book);

// GET request for post review page
router.get('/books/post-review', books.postReview);

// POST request for post review submit
router.post('/books/post-review/submit', books.postReviewSubmit);

// GET request for isbn validator
router.get('/books/isbn-validator', books.isbnValidator);

// POST request for delete review submit
router.post('/books/delete-review/submit', books.deleteReviewSubmit);