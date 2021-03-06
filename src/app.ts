import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import errorHandler from 'errorhandler';
import path from 'path';
import { config } from './util/config';
import { syncSessionCookieToLoggedInCookie } from './util/passport';
import mongoose from 'mongoose';
import passport from 'passport';
import onHeaders from 'on-headers';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import minify from 'express-minify';
import enforce from 'express-sslify';
import connectMongoDBSession from 'connect-mongodb-session';
const MongoDBStore = connectMongoDBSession(session);

// routes
import { router as mainPagesRouter } from './routes/main-pages';
import { router as accountRouter } from './routes/account';
import { router as booksRouter } from './routes/books';

export async function appInit(): Promise<express.Express> {
  const mongoUrl = process.env.MONGODB_URI;

  mongoose.connect(mongoUrl).then(
      () => {
        // mongoose ready to use
      }
    ).catch(error => {
      console.error('ERROR: Failed to connect to  MongoDB.');
      console.error(error);
      console.error('Application is now in an unstable state, please ' + 
        'resolve issue!');
    });

  const configData = await config().catch(error => {
    console.error('ERROR: Failed to get config.');
    console.error(error);
    console.error('Please check if MongoDB was able to connect and that ' +
      'you set up application correctly!');
    console.error('Application cannot continue without config data, exiting.');
    throw new Error('Failed to get config');
  });

  // Create Express server
  const app = express();

  // config
  app.locals.config = configData;

  if (process.env.NODE_ENV !== 'development') {
    app.use(compression());
    app.use(minify());
  }

  // enforce https if site is using https
  if (configData.sitePreferredProtocol === 'https') {
    app.use(enforce.HTTPS({ trustProtoHeader: true }));
  }

  // redirect no trailing slash to trailing slash
  app.use(function (req, res, next) {
    if (!req.path.endsWith('/') && !req.path.slice(
        req.path.lastIndexOf('/') + 1).includes('.')) {
      const query = req.url.slice(req.path.length);
      res.redirect(301, req.path + '/' + query);
    } else {
      next();
    }
  });

  app.use(cookieParser()); // for parsing cookies
  app.use(express.json()); // for parsing application/json
  // for parsing application/x-www-form-urlencoded
  app.use(express.urlencoded({ extended: true }));

  // Need to use the on-headers library to access the session cookie, because
  // express-session also uses this library to set the session cookie just
  // before sending the response. on-headers executes the listeners in reverse
  // order, so the syncSessionCookieToLoggedInCookie function's onHeaders
  // listener middleware has to come before the express-session middleware.
  app.use(function(req, res, next) {
    onHeaders(res, () => syncSessionCookieToLoggedInCookie(req, res,
      configData.sessionCookie, configData.loggedInCookie));
    next();
  });

  app.use(session({
    secret: configData.sessionSecret,
    resave: true,
    saveUninitialized: false,
    rolling: true,
    name: configData.sessionCookie,
    cookie: { maxAge: configData.sessionMaxAge },
    store: new MongoDBStore({
      uri: mongoUrl,
      collection: 'sessions'
    })
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(function(req, res, next) {
    res.locals.user = req.user;
    next();
  });

  // Express configuration
  app.set('port', process.env.PORT || 3000); // default port 3000
  app.set('views', path.join(__dirname, './views/pages'));
  app.set('view engine', 'ejs');

  // Serve static files
  app.use(express.static(path.join(__dirname, './public'), {
    maxAge: '1d'
  }));

  // cache policy
  app.use(function (req, res, next) {
    res.set('Cache-Control', 'no-store');
    next();
  });

  // routes
  app.use('/', mainPagesRouter);
  app.use('/account/', accountRouter);
  app.use('/', booksRouter);

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
    /* eslint-disable @typescript-eslint/no-unused-vars */
    app.use(function (err: unknown, req: Request, res: Response,
                      next: NextFunction) {
    /* eslint-enable @typescript-eslint/no-unused-vars */
      console.error(err);
      res.status(500);
      res.send('500 Internal Server Error');
    });
  }

  return app;
}