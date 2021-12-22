import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import errorHandler from 'errorhandler';
import path from 'path';
import { config } from './util/config';
//import { } from './util/passport';
require('./util/passport');
import mongoose from 'mongoose';
import passport from 'passport';
import { default as connectMongoDBSession } from 'connect-mongodb-session';
const MongoDBStore = connectMongoDBSession(session);

// controllers
import * as pagesController from './controllers/pages';

const mongoUrl = process.env.MONGODB_URI;

mongoose.connect(mongoUrl, { useNewUrlParser: true, useCreateIndex: true, 
  useUnifiedTopology: true } ).then(
    () => {
      // mongoose ready to use
    }
  ).catch(error => {
    console.error('ERROR: Failed to connect to  MongoDB.');
    console.error(error);
    console.error('Application is now in an unstable state, please resolve ' + 
      'issue!');
  })

// Create Express server
const app = express();

// config
app.use(function(req, res, next) {
  config().then(
    (response) => {
      // check if config is set
      if (response !== null) {
        app.set('config', response);
        res.locals.config = response;
        next();
      } else {
        next('Config not set. Please setup application correctly.');
      }
    }
  ).catch(
    error => {
      next(error);
    }
  )
});

app.use(session({ 
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: new MongoDBStore ({
    uri: mongoUrl,
    collection: "sessions"
  })
}));
app.use(passport.initialize());
app.use(passport.session());

// Express configuration
app.set('port', process.env.PORT || 3000); // default port 3000
app.set('views', path.join(__dirname, './views/pages'));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, './public')));

// Primary app routes
app.get('/', pagesController.home);
app.get('/account/log-in', pagesController.login);
app.post('/account/log-in/submit', pagesController.loginSubmit);

// 404 error
app.use(function(req, res) {
  res.status(404);
  res.send('404 Page not Found');
});

if (process.env.NODE_ENV === 'development') {
  app.use(errorHandler());
} else {
  // need to disable eslint no-unused-vars cause otherwise it will complain 
  // that next is an unused parameter - but is is needed because express only 
  // uses this function to handle parameters if there are 4 parameters

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(function(err: unknown, req: Request, res: Response, next: NextFunction) {
    console.error(err);
    res.status(500);
    res.send('500 Internal Server Error');
  });
}

export { app };