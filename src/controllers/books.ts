import { Request, Response, NextFunction } from 'express';
import { Book, IBook } from '../models/Book';
import https from 'https';
import { Review } from '../models/Review';
import { IUser, User } from '../models/User';
import { check, validationResult } from 'express-validator';

// search page
export const search = async (req: Request, res: Response, next: NextFunction) => {
  await check('q').isString().notEmpty().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }
  const query = req.query.q as string;
  const words = query.trim().split(/\s+/);
  const regexps = [];
  for (const word of words) {
    // escape special characters in regex
    const escapedWord = word.replace(/(\[|\]|\(|\)|\{|\}|\*|\+|\?|\||\^|\$|\.|\\)/g, '\\$&');
    const re = new RegExp(`( ${escapedWord} |^${escapedWord}|${escapedWord}$)`, 'i');
    regexps.push(re);
  }
  const filter = { $or: [ {author: { $in: regexps }}, {title: { $in: regexps }} ] };
  Book.find(filter, 'author title isbn', { limit: 10 }, function(err, books) {
    if (err) { return next(err) }
    const results = [];
    for (const book of books) {
      results.push({ isbn: book.isbn, fullTitle: book.author + ': ' + book.title });
    }
    res.render('search', { query: query, results: results });
  });
};

// book page
export const book = (req: Request, res: Response, next: NextFunction) => {
  const isbn = req.params.bookISBN;
  Book.findOne({ isbn: isbn }, function(err, book) {
    if (err) { return next(err) }
    if (book) {
      const bookRating = book.rating.toFixed(1);
      const bookFullTitle = book.author + ': ' + book.title;
      Review.find({ book: book }, 'rating comment user', function(err, reviews) {
        if (err) { return next(err) }
        // get user of each review
        const userWaits = [];
        for (const review of reviews) {
          userWaits.push(User.findById(review.user.toString(), 'firstName lastName fullName'));
        }
        Promise.all(userWaits).then((users) => {
          const reviewsResponse = [];
          let currentUser;
          if (req.isAuthenticated()) {
            currentUser = req.user as IUser;
          }
          let userReview = null;
          for (let i=0; i<reviews.length; i++) {
            if (users[i] == null) {
              return next(new Error('User null when getting user name of rating'));
            }
            const review = { name: users[i].fullName, 
              rating: reviews[i].rating, comment: reviews[i].comment }
            if (req.isAuthenticated() && users[i].id === currentUser.id) {
              // store review of user in a different variable as it will be 
              // displayed separately from other reviews
              userReview = review;
            } else {
              reviewsResponse.push(review);
            }
          }
          const responseData = {
            title: bookFullTitle,
            isbn: isbn,
            rating: bookRating,
            userReview: userReview,
            reviews: reviewsResponse
          }
          res.render('book/book', responseData);
        }).catch((err) => {
          next(err);
        });
      });
    } else {
      // 404 error, book doesn't exist
      next();
    }
  });
};

// post review page
export const postReview = (req: Request, res: Response): void => {
  res.render('books/post-review');
};

// post review submit
export const postReviewSubmit = async(req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await check('isbn').isString().notEmpty().matches(/^\d+$/).run(req);
  await check('rating').isInt({ min: 1, max: 5 }).run(req);
  await check('comment').custom(value => {
    if (value != null && typeof value !== 'string') {
      return Promise.reject('Comment invalid');
    }
    return true;
  }).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }
  
  const isbn = req.body.isbn;
  const rating = req.body.rating;
  let comment = req.body.comment;

  if (comment==='') {
    comment = null;
  }

  const user = req.user as IUser;

  const createReview = (book) => {
    const review = new Review({
      user: user,
      book: book,
      rating: rating,
      comment: comment
    });
  
    Review.findOne({ book: book, user: user }, '', function(err, existingReview) {
      if (err) { return next(err) }
      if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.save((err) => {
          if (err) { return next(err); }
          updateBookRating(book, (err) => {
            if (err) { return next(err); }
            res.send('Review updated');
          });
        });
        return;
      }
      review.save((err) => {
        if (err) { return next(err); }
        updateBookRating(book, (err) => {
          if (err) { return next(err); }
          res.send('Review saved');
        });
      })
    });
  }

  Book.findOne({ isbn: isbn }, '', function(err, existingBook) {
    if (err) { return next(err) }
    if (existingBook == null) {
      checkIsbnAuthorTitleIsbn(isbn, (err, data) => {
        if (err) { return next(err) }
        if (data == null) {
          res.status(400).send('Invalid data');
          return;
        }

        const book = new Book({
          isbn: data.isbn,
          author: data.author,
          title: data.title,
          rating: 0
        });

        book.save((err) => {
          if (err) { return next(err); }
          createReview(book);
        });
      });
      return;
    }
    createReview(existingBook);
  });
};

// delete review submit
export const deleteReviewSubmit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await check('isbn').isString().notEmpty().matches(/^\d+$/).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const user = req.user as IUser;
  const isbn = req.body.isbn;

  Book.findOne({isbn: isbn}, '', function(err, book) {
    if (err) { return next(err) }
    if (book == null) {
      res.status(400).send('Invalid data');
      return;
    }
    Review.findOneAndDelete({book: book, user: user}, function(err, deletedReview) {
      if (err) { return next(err) }
      if (deletedReview===null) {
        res.status(400).send('Invalid data');
      } else {
        updateBookRating(book, (err) => {
          if (err) { return next(err) }
          res.send('OK');
        });
      }
    });
  });
};

// isbn validator
export const isbnValidator = async (req: Request, res: Response, next: NextFunction) => {
  await check('isbn').isString().notEmpty().matches(/^\d+$/).run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const isbn = req.query.isbn as string;

  try {
    checkIsbn(isbn, (err, fullTitle) => {
      if (err) { return next(err); }
      if (fullTitle === null) {
        res.send(JSON.stringify({ found: false }));
      } else {
        res.send(JSON.stringify({ found: true, title: fullTitle }));
      }
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Checks if an ISBN is valid. If yes, it calls the callback function with the 
 * full book title as the argument (including both author and title). 
 * Otherwise, calls the callback function with null as the argument.
 * @param isbn Book isbn
 * @param callback Callback function
 */
function checkIsbn(isbn: string, callback: (err: Error, fullTitle: string) => void) {
  checkIsbnAuthorTitleIsbn(isbn, (err, data) => {
    if (err) { callback(err, null); return; }
    if (data == null) {
      callback(null, null);
    } else {
      callback(null, data.author + ': ' + data.title);
    }
  });
}

/**
 * Checks if an ISBN is valid. If yes, it calls the callback function with the 
 * following JSON {author, title, isbn}. It returns the ISBN, because it 
 * attempts to use ISBN-13 as the preferred method of stroing books in the db.
 * Otherwise, calls the callback function with null as the argument.
 * @param isbn Book isbn
 * @param callback Callback function
 */
function checkIsbnAuthorTitleIsbn(isbn: string, callback: (err: Error, 
  data: { author: string, title: string, isbn: string }) => void) {
  if (!/^\d+$/.test(isbn)) {
    callback(null, null);
    return;
  }

  const url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn;
  https.get(url, (isbnRes) => {
    if (isbnRes.statusCode !== 200) {
      callback(new Error('Google book API status code ' + isbnRes.statusCode), null);
      return;
    }

    let data = '';
    isbnRes.on('data', (chunk) => {
        data = data + chunk.toString();
    });

    isbnRes.on('end', () => {
      let body;
      try {
        body = JSON.parse(data);
      } catch (e) {
        const err = new Error('Google book API response couldn\'t be parsed as JSON', { cause: e });
        callback(err, null);
        return;
      }
      const badFormatErrMsg = 'Google book API bad response format';

      if (typeof body.totalItems !== 'number') {
        callback(new Error(badFormatErrMsg), null);
        return;
      }
      if (body.totalItems>0) {
        if (!Array.isArray(body.items) || body.items.length<1 || 
          body.items[0].volumeInfo == null || 
          body.items[0].volumeInfo.authors == null || 
          !Array.isArray(body.items[0].volumeInfo.authors) || 
          !body.items[0].volumeInfo.authors.every(elem => (typeof elem === 
            'string')) || 
          body.items[0].volumeInfo.industryIdentifiers == null || 
          !Array.isArray(body.items[0].volumeInfo.industryIdentifiers)) {
            callback(new Error(badFormatErrMsg), null);
            return;
        }
        const authors = body.items[0].volumeInfo.authors;
        let authorsStr = '';
        for (let i=0; i<authors.length; i++) {
          authorsStr += authors[i];
          if (i+1<authors.length) {
            authorsStr += ', ';
          }
        }

        // Use ISBN-13 if possible
        const industryIdentifiers = body.items[0].volumeInfo.industryIdentifiers;
        let isbn10, isbn13;
        for (const identifier of industryIdentifiers) {
          if (identifier.type === 'ISBN_13') {
            if (typeof identifier.identifier !== 'string') {
              callback(new Error(badFormatErrMsg), null);
              return;
            }
            isbn13 = identifier.identifier;
          } else if (identifier.type === 'ISBN_10') {
            if (typeof identifier.identifier !== 'string') {
              callback(new Error(badFormatErrMsg), null);
              return;
            }
            isbn10 = identifier.identifier;
          }
        }

        let retIsbn;
        if (isbn13 != null) {
          retIsbn = isbn13;
        } else if (isbn10 != null) {
          retIsbn = isbn10;
        } else {
          retIsbn = isbn;
        }
        
        const title = body.items[0].volumeInfo.title;
        callback(null, { author: authorsStr, title: title, isbn: retIsbn });
      } else {
        callback(null, null);
      }
    });
  });
}

/**
 * Recalculates book rating. If there is an error, it calls the callback 
 * function with the error as the argument. If no errors are present, it 
 * calls the callback function with no arguments.
 * @param isbn Book isbn
 * @param callback Callback function
 */
function updateBookRating(book, callback: (err) => void) {
  Review.find({ book: book }, 'rating', function(err, reviews) {
    if (err) { return callback(err) }
    let totalRating = 0;
    for (const review of reviews) {
      totalRating += review.rating;
    }
    if (reviews.length > 0) {
      totalRating /= reviews.length;
    }
    book.rating = totalRating;
    book.save((err) => {
      if (err) { return callback(err) }
      callback(null);
    });
  });
}