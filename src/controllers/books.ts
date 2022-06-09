import { Request, Response, NextFunction } from 'express';
import { Book } from '../models/Book';

export const search = (req: Request, res: Response): void => {
  res.send('Search page');
};

export const book = (req: Request, res: Response, next: NextFunction): void => {
  Book.findOne({ isbn: req.params.bookISBN }, function(err, book) {
    if (err) { return next(err) }
    if (book) {
      res.send('Book exists')
    } else {
      // 404 error, book doesn't exist
      next();
    }
  });
};

export const postReview = (req: Request, res: Response): void => {
  res.render('books/post-review');
};