import { Request, Response, NextFunction } from 'express';
import { Book } from '../models/Book';
import https from 'https';
import { Review } from '../models/Review';
import { IUser, User } from '../models/User';

export const search = (req: Request, res: Response, next: NextFunction): void => {
  const query = req.query.q as string;
  if (query==null || query==='') {
    res.status(400).send('Bad request');
    return;
  }
  const words = query.trim().split(/\s+/);
  const regexps = [];
  for (const word of words) {
    const re = new RegExp(`\\b${word}\\b`, 'i');
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

export const book = (req: Request, res: Response, next: NextFunction) => {
  const isbn = req.params.bookISBN;
  Book.findOne({ isbn: isbn }, function(err, book) {
    if (err) { return next(err) }
    if (book) {
      const bookRating = book.rating;
      const bookFullTitle = book.author + ': ' + book.title;
      Review.find({ isbn: isbn }, 'rating comment user', function(err, reviews) {
        if (err) { return next(err) }
        const userWaits = [];
        for (const review of reviews) {
          userWaits.push(User.findById(review.user.toString(), 'firstName lastName fullName'));
        }
        Promise.all(userWaits).then((users) => {
          const reviewsResponse = [];
          const currentUser = req.user as IUser;
          let userReview = null;
          for (const i in reviews) {
            if (users[i] == null) {
              return next(new Error('User null when getting user name of rating'));
            }
            const review = { name: users[i].fullName, 
              rating: reviews[i].rating, comment: reviews[i].comment }
            if (users[i].id === currentUser.id) {
              userReview = review;
            } else {
              reviewsResponse.push(review);
            }
          }
          console.log(reviewsResponse);
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

export const postReview = (req: Request, res: Response): void => {
  res.render('books/post-review');
};

export const postReviewSubmit = (req: Request, res: Response, next: NextFunction): void => {
  const isbn = req.body.isbn;
  const rating = req.body.rating;
  let comment = req.body.comment;

  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  if (comment==='') {
    comment = null;
  }

  const ratingNum = Number(rating);
  if (rating==='' || isNaN(ratingNum) || ratingNum<1 || ratingNum>5) {
    res.status(400).send('Invalid data');
    return;
  }

  const user = req.user as IUser;

  const updateBookRating = (callback) => {
    Review.find({ isbn: isbn }, 'rating', function(err, reviews) {
      if (err) { return next(err) }
      let totalRating = 0;
      for (const review of reviews) {
        totalRating += review.rating;
      }
      totalRating /= reviews.length;
      Book.findOneAndUpdate({ isbn: isbn }, { rating: totalRating }, function(err) {
        if (err) { return next(err) }
        callback();
      });
    });
  }

  const createReview = () => {
    const ratingObj = new Review({
      user: user._id,
      rating: rating,
      comment: comment
    });
  
    Review.findOne({ user: user._id }, '', function(err, existingReview) {
      if (err) { return next(err) }
      if (existingReview) {
        existingReview.rating = rating;
        existingReview.comment = comment;
        existingReview.save((err) => {
          if (err) { return next(err); }
          updateBookRating(() => res.send('Review updated'));
        });
        return;
      }
      ratingObj.save((err) => {
        if (err) { return next(err); }
        updateBookRating(() => res.send('Review saved'));
      })
    });
  }

  checkIsbn(isbn, (title) => {
    if (title==null) {
      res.status(400).send('Invalid data');
      return;
    }

    Book.findOne({ isbn: isbn }, '', function(err, existingBook) {
      if (err) { return next(err) }
      if (existingBook == null) {
        checkIsbnAuthorTitle(isbn, (ret) => {
          const book = new Book({
            isbn: isbn,
            author: ret.author,
            title: ret.title,
            rating: 0
          });

          book.save((err) => {
            if (err) { return next(err); }
            createReview();
          });
        });
        return;
      }
      createReview();
    });
  });
}

export const isbnValidator = (req: Request, res: Response, next: NextFunction): void => {
  const isbn = req.query.isbn;
  if (isbn==null || isbn==='' || isNaN(Number(isbn))) {
    res.status(400).send('Malformed request');
    return;
  }

  try {
    checkIsbn(isbn, (title) => {
      if (title === null) {
        res.send(JSON.stringify({ found: false }));
      } else {
        res.send(JSON.stringify({ found: true, title: title }));
      }
    });
  } catch (e) {
    next(e);
  }
};

function checkIsbn(isbn, callback) {
  checkIsbnAuthorTitle(isbn, (ret) => {
    if (ret == null) {
      callback(null);
    } else {
      callback(ret.author + ': ' + ret.title);
    }
  });
}

function checkIsbnAuthorTitle(isbn, callback) {
  if (isbn==='' || isNaN(Number(isbn))) {
    callback(null);
  }

  const url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn;
  https.get(url, (isbnRes) => {
    if (isbnRes.statusCode !== 200) {
      throw new Error('Google book API status code ' + isbnRes.statusCode);
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
        return new Error('Google book API response couldn\'t be parsed as JSON');
      }
      if (body.totalItems>0) {
        const authors = body.items[0].volumeInfo.authors;
        let authorsStr = '';
        for (let i=0; i<authors.length; i++) {
          authorsStr += authors[i];
          if (i+1<authors.length) {
            authorsStr += ', ';
          }
        }
        
        const title = body.items[0].volumeInfo.title;
        callback({ author: authorsStr, title: title });
      } else {
        callback(null);
      }
    });
  });
}