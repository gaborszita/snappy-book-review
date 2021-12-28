import passport from 'passport';
import passportLocal from 'passport-local';
import { User, IUser } from '../models/User';

const LocalStrategy = passportLocal.Strategy;

// email and password authentication
passport.use(new LocalStrategy ( { usernameField: 'email' },
  function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
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