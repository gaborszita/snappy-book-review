import passport from 'passport';
import passportLocal from 'passport-local';
import { User, IUser, AccountState } from '../models/User';
import setCookie from 'set-cookie-parser';
import { Request, Response } from 'express';

const LocalStrategy = passportLocal.Strategy;

// email and password authentication
passport.use(new LocalStrategy ( { usernameField: 'email' },
  function(email, password, done) {
    User.findOne({ email: email, accountState: AccountState.Active }, 
      function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      user.verifyPassword(password, function(err, match) {
        if (err) {return done(err); }
        if (match) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    });
  }
));

passport.serializeUser(function(user: IUser, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

export function syncSessionCookieToLoggedInCookie(req: Request, res: Response, 
  sessionCookieName: string, loggedInCookieName: string): void {
  if (req.isAuthenticated()) {
    const responseCookies = setCookie.parse(res.get('Set-Cookie'), {});
    let found = false;
    for (let i=0; i<responseCookies.length; i++) {
      const cookie = responseCookies[i];
      if (cookie.name===sessionCookieName) {
        if (cookie.maxAge) {
          res.cookie(loggedInCookieName, 'true', { maxAge: cookie.maxAge });
        } else if (cookie.expires) {
          res.cookie(loggedInCookieName, 'true', { expires: cookie.expires });
        }
        found = true;
        break;
      }
    }
    if (!found) {
      console.error('WARNING: User appears to be logged in, but couldn\'t ' + 
        'get session cookie and couldn\'t set logged in cookie.');
    }
  } else {
    if (req.cookies[loggedInCookieName]) {
      res.clearCookie(loggedInCookieName);
    }
  }
}