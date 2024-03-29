import { Request, Response, NextFunction } from 'express';
import { Book } from '../models/Book';
import https from 'https';
import { Review } from '../models/Review';
import { Summary } from '../models/Summary';
import { IUser, User } from '../models/User';
import { check, validationResult } from 'express-validator';

// search page
export const search = async (req: Request, res: Response) => {
  await check('q').isString().notEmpty().run(req); // query string

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
    const escapedWord = word.replace(
        /(\[|\]|\(|\)|\{|\}|\*|\+|\?|\||\^|\$|\.|\\)/g, '\\$&');
    // regex to match word at beginning, middle, or end of string
    const re = new RegExp(`( ${escapedWord} |^${escapedWord}|${escapedWord}$)`,
                          'i');
    regexps.push(re);
  }

  // filter to match words either in author or title
  const filter = {
    $or: [
      {author: { $in: regexps }},
      {title: { $in: regexps }}
    ]
  };
  const books = await Book.find(filter, null, { limit: 10 });
  const results = [];
  for (const book of books) {
    results.push({
      isbn: book.isbn,
      fullTitle: book.author + ': ' + book.title
    });
  }
  res.render('search', { query: query, results: results });
};

// book page
export const book = async (req: Request, res: Response,
                           next: NextFunction) => {
  const isbn = req.params.bookISBN; // book isbn in url param
  const book = await Book.findOne({ isbn: isbn });
  if (!book) {
    return next(); // 404 error if book not found
  }
  const bookRating = book.rating.toFixed(1);
  const bookFullTitle = book.author + ': ' + book.title;

  const reviews = await Review.find({ book: book });
  // get user of each review
  const reviewUserWaits = [];
  for (const review of reviews) {
    reviewUserWaits.push(User.findById(review.user));
  }

  // wait for user queries
  const reviewsUsers = await Promise.all(reviewUserWaits);
  const reviewsResponse = [];
  // get current user if logged in
  let currentUser;
  if (req.isAuthenticated()) {
    currentUser = req.user as IUser;
  }
  let userReview = null;
  for (let i=0; i<reviews.length; i++) {
    if (reviewsUsers[i] == null) {
      console.warn('User null when getting user name of rating');
    }
    const review = {
      name: reviewsUsers[i] != null ? reviewsUsers[i].fullName :
          'Unknown user',
      rating: reviews[i].rating,
      comment: reviews[i].comment
    };
    if (req.isAuthenticated() && reviewsUsers[i].id === currentUser.id) {
      // store review of user in a different variable as it will be
      // displayed separately from other reviews
      userReview = review;
    } else {
      reviewsResponse.push(review);
    }
  }

  const summaries = await Summary.find({ book: book });
  // get user of each review
  const summariesUserWaits = [];
  for (const summary of summaries) {
    summariesUserWaits.push(User.findById(summary.user));
  }
  // wait for user queries
  const summariesUsers = await Promise.all(summariesUserWaits);
  const summariesResponse = [];
  let userSummary = null;
  for (let i=0; i<summaries.length; i++) {
    if (summariesUsers[i] == null) {
      console.warn('User null when getting user name of summary');
    }
    const summary = {
      name: summariesUsers[i] != null ? summariesUsers[i].fullName :
          'Unknown user',
      summary: summaries[i].summary
    };
    if (req.isAuthenticated() && summariesUsers[i].id === currentUser.id) {
      // store review of user in a different variable as it will be
      // displayed separately from other reviews
      userSummary = summary;
    } else {
      summariesResponse.push(summary);
    }
  }
  
  const responseData = {
    title: bookFullTitle,
    rating: bookRating,
    isbn: isbn,
    userReview: userReview,
    reviews: reviewsResponse,
    userSummary: userSummary,
    summaries: summariesResponse
  };
  res.render('book/book', responseData);
};

// post review page
export const postReview = (req: Request, res: Response): void => {
  res.render('books/post-review');
};

// post review submit
export const postReviewSubmit = async(req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await check('isbn').isISBN().run(req);
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

  // find book in db or create it if doesn't exist yet
  let book;
  const existingBook = await Book.findOne({ isbn: isbn });
  if (existingBook) {
    book = existingBook;
  } else {
    const data = await checkIsbn(isbn);
    if (data == null) {
      res.status(400).send('Invalid data');
      return;
    }

    const newBook = new Book({
      isbn: data.isbn,
      author: data.author,
      title: data.title,
      rating: 0
    });

    await newBook.save();
    book = newBook;
  }

  // modify existing review or create new one if it doesn't exist
  const existingReview = await Review.findOne({ user: user, book: book });
  if (existingReview) {
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();
    await updateBookRating(book);
    res.send('Review updated');
  } else {
    const review = new Review({
      user: user,
      book: book,
      rating: rating,
      comment: comment
    });
    await review.save();
    await updateBookRating(book);
    res.send('Review saved');
  }
};

// delete review submit
export const deleteReviewSubmit = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await check('isbn').isISBN().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const user = req.user as IUser;
  const isbn = req.body.isbn;

  const book = await Book.findOne({ isbn: isbn });
  if (!book) {
    res.status(400).send('Invalid data');
    return;
  } else {
    const review = await Review.findOneAndDelete({ user: user, book: book });
    if (!review) {
      res.status(400).send('Invalid data');
      return;
    }
    await updateBookRating(book);
    res.send('OK');
  }
};

// post summary submit
export const postSummarySubmit = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await check('isbn').isISBN().run(req);
  await check('summary').isString().notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const isbn = req.body.isbn;
  const summary = req.body.summary;

  const user = req.user as IUser;

  // find book in db or create it if doesn't exist yet
  let book;
  const existingBook = await Book.findOne({ isbn: isbn });
  if (existingBook) {
    book = existingBook;
  } else {
    const data = await checkIsbn(isbn);
    if (data == null) {
      res.status(400).send('Invalid data');
      return;
    }

    const newBook = new Book({
      isbn: data.isbn,
      author: data.author,
      title: data.title,
      rating: 0
    });

    await newBook.save();
    book = newBook;
  }

  // modify existing summary or create new one if it doesn't exist
  const existingSummary = await Summary.findOne({ user: user, book: book });
  if (existingSummary) {
    existingSummary.summary = summary;
    await existingSummary.save();
    res.send('Summary updated');
  } else {
    const summaryObj = new Summary({
      user: user,
      book: book,
      summary: summary
    });
    await summaryObj.save();
    res.send('Summary saved');
  }
};

// delete summary submit
export const deleteSummarySubmit = async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await check('isbn').isISBN().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const user = req.user as IUser;
  const isbn = req.body.isbn;

  const book = await Book.findOne({ isbn: isbn });
  if (!book) {
    res.status(400).send('Invalid data');
    return;
  } else {
    const summary = await Summary.findOneAndDelete({ user: user, book: book });
    if (!summary) {
      res.status(400).send('Invalid data');
      return;
    }
    res.send('OK');
  }
};

// isbn validator
export const isbnValidator = async (req: Request, res: Response) => {
  await check('isbn').isISBN().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.send(JSON.stringify({ found: false }));
    return;
  }

  const isbn = req.query.isbn as string;

  const data = await checkIsbn(isbn);
  if (!data) {
    res.send(JSON.stringify({ found: false }));
  } else {
    res.send(JSON.stringify({
      found: true,
      title: data.author + ': ' + data.title
    }));
  }
};

/**
 * Checks if an ISBN is valid. If yes, it returns the following JSON object:
 * {author, title, isbn}. It returns the ISBN, because it attempts to use
 * ISBN-13 as the preferred method of storing books in the db. Otherwise, it
 * returns null.
 * @param isbn Book isbn
 */
async function checkIsbn(isbn: string):
    Promise<{ author: string, title: string, isbn: string } | null> {
  const url = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' + isbn;

  // get isbn info using google books API using https.get
  const data = await ((): Promise<string> => {
    return new Promise((resolve, reject) => {
      https.get(url, (isbnRes) => {
        if (isbnRes.statusCode !== 200) {
          reject(new Error('Google book API status code ' +
                           isbnRes.statusCode));
        }

        let data = '';
        isbnRes.on('data', (chunk) => {
            data = data + chunk.toString();
        });

        isbnRes.on('end', () => {
          resolve(data);
        });
      });
    });
  })();

  // parse google books API response to json format
  let body;
  try {
    body = JSON.parse(data);
  } catch (e) {
    throw new Error('Google book API response couldn\'t be parsed as JSON',
        { cause: e });
  }
  const badFormatErrMsg = 'Google book API bad response format';

  // validate data
  if (typeof body.totalItems !== 'number') {
    throw new Error(badFormatErrMsg);
  }
  if (body.totalItems>0) { // check if the API found a book
    // validate data
    if (!Array.isArray(body.items) || body.items.length<1 ||
        body.items[0].volumeInfo == null ||
        body.items[0].volumeInfo.authors == null ||
        !Array.isArray(body.items[0].volumeInfo.authors) ||
        !body.items[0].volumeInfo.authors.every(elem => (typeof elem ===
        'string')) ||
        body.items[0].volumeInfo.industryIdentifiers == null ||
        !Array.isArray(body.items[0].volumeInfo.industryIdentifiers)) {
      throw new Error(badFormatErrMsg);
    }
    // get book authors
    const authors = body.items[0].volumeInfo.authors;
    let authorsStr = '';
    for (let i=0; i<authors.length; i++) {
      authorsStr += authors[i];
      if (i+1<authors.length) {
        authorsStr += ', ';
      }
    }

    // Use ISBN-13 if possible
    const industryIdentifiers =
        body.items[0].volumeInfo.industryIdentifiers;
    let isbn10, isbn13;
    for (const identifier of industryIdentifiers) {
      if (identifier.type === 'ISBN_13') {
        if (typeof identifier.identifier !== 'string') {
          throw new Error(badFormatErrMsg);
        }
        isbn13 = identifier.identifier;
      } else if (identifier.type === 'ISBN_10') {
        if (typeof identifier.identifier !== 'string') {
          throw new Error(badFormatErrMsg);
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
    return {
      author: authorsStr,
      title: title,
      isbn: retIsbn
    };
  } else {
    return null;
  }
}

/**
 * Recalculates book rating.
 * @param isbn Book isbn
 */
async function updateBookRating(book) {
  const reviews = await Review.find({book: book});
  let totalRating = 0;
  for (const review of reviews) {
    totalRating += review.rating;
  }
  if (reviews.length > 0) {
    totalRating /= reviews.length;
  }
  book.rating = totalRating;
  await book.save();
}