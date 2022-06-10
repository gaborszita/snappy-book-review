import { Request, Response, NextFunction } from 'express';
import { Book } from '../models/Book';
import https from 'https';
import { Rating } from '../models/Rating';
import { IUser } from '../models/User';

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
    Rating.find({ isbn: isbn }, 'rating', function(err, ratings) {
      if (err) { return next(err) }
      let totalRating = 0;
      for (const rating of ratings) {
        totalRating += rating.rating;
      }
      totalRating /= ratings.length;
      Book.findOneAndUpdate({ isbn: isbn }, { rating: totalRating }, function(err) {
        if (err) { return next(err) }
        callback();
      });
    });
  }

  const createRating = () => {
    const ratingObj = new Rating({
      user: user._id,
      rating: rating,
      comment: comment
    });
  
    Rating.findOne({ user: user._id }, '', function(err, existingRating) {
      if (err) { return next(err) }
      if (existingRating) {
        existingRating.rating = rating;
        existingRating.comment = comment;
        existingRating.save((err) => {
          if (err) { return next(err); }
          updateBookRating(() => res.send('Rating updated'));
        });
        return;
      }
      ratingObj.save((err) => {
        if (err) { return next(err); }
        updateBookRating(() => res.send('Rating saved'));
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
            createRating();
          });
        });
        return;
      }
      createRating();
    });
  });
}

export const isbnValidator = (req: Request, res: Response, next: NextFunction): void => {
  const isbn = req.query.isbn;
  if (isbn==='' || isNaN(Number(isbn))) {
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