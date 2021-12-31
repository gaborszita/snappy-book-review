import express, { Request, Response, NextFunction, Express } from 'express';
import session from 'express-session';
import errorHandler from 'errorhandler';
import path from 'path';
import { config } from './util/config';
import './util/passport';
import mongoose from 'mongoose';
import passport from 'passport';
import { default as connectMongoDBSession } from 'connect-mongodb-session';
const MongoDBStore = connectMongoDBSession(session);

// controllers
import * as pagesController from './controllers/pages';

export async function appInit(): Promise<express.Express> {
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
    });

  const configData = await config().catch(error => {
    console.error('ERROR: Failed to get config.');
    console.error(error);
    console.error('Please check if MongoDB was able to connect and that ' + 
      'you set up application correctly!');
    console.error('Application cannot continue without config data, exiting.');
    throw "Failed to get config";
  });

  // Create Express server
  const app = express();

  // config
  app.use(function (req, res, next) {
    res.locals.config = configData;
    next();
  });

  // redirect no trailing slash to trailing slash
  app.use(function (req, res, next) {
    if (!req.path.endsWith('/') && !req.path.slice(req.path.lastIndexOf('/') + 1).includes('.')) {
      const query = req.url.slice(req.path.length);
      res.redirect(301, req.path + '/' + query);
    } else {
      next();
    }
  });

  app.use(express.json()); // for parsing application/json
  app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

  app.use(session({
    secret: configData.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new MongoDBStore({
      uri: mongoUrl,
      collection: 'sessions'
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
  app.get('/account/log-in/', pagesController.logIn);
  app.post('/account/log-in/submit/', pagesController.logInSubmit);
  app.get('/account/create-account/', pagesController.createAccount);
  app.post('/account/create-account/submit/', pagesController.createAccountSubmit);
  app.post('/account/log-out/submit/', pagesController.logOutSubmit);

  // 404 error
  app.use(function (req, res) {
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
    app.use(function (err: unknown, req: Request, res: Response, next: NextFunction) {
      console.error(err);
      res.status(500);
      res.send('500 Internal Server Error');
    });
  }

  return app;
}