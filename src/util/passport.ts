import passport from 'passport';
import passportLocal from 'passport-local';
import { User, IUser } from '../models/User';

const LocalStrategy = passportLocal.Strategy;

console.log('file running...');
// email and password authentication
passport.use(new LocalStrategy ( { usernameField: 'email' },
  function(email, password, done) {
    console.log('authenticating....');
    User.findOne({ email: email }, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
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