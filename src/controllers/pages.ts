import { Request, Response, NextFunction } from 'express';
import { IUser, User, AccountState } from '../models/User';
import { body, check, validationResult } from 'express-validator';
import passport from 'passport';

/**
 * Home page.
 * @route GET /
 */
export const home = (req: Request, res: Response): void => {
  res.render('home');
};

/**
 * Login page.
 * @route GET /account/log-in
 */
export const logIn = (req: Request, res: Response): void => {
  res.render('account/log-in');
};

/**
 * Login submit page.
 * @route POST /account/log-in/submit
 */
export const logInSubmit = (req: Request, res: Response, next: NextFunction): void => {
  /*passport.authenticate('local', { successRedirect: '/',
                                 failureRedirect: '/login',
                                 failureFlash: true });*/
  passport.authenticate('local', (err: Error, user, info) => {
    if (err) { return next(err); }
    if (!user) {
      return res.status(400).send('Invalid email/password');
    }
    req.logIn(user, (err) => {
      if (err) { return next(err); }
      res.send('Successfully logged in!');
    });
  })(req, res, next);
};

/**
 * Create account page.
 * @route GET /account/sign-up
 */
export const createAccount = (req: Request, res: Response): void => {
  res.render('account/create-account');
};

/**
 * Create account submit page.
 * @route POST /account/sign-up/submit
 */
export const createAccountSubmit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await body('email').isEmail().normalizeEmail().run(req);
  await body('password').isLength({ min: 8, max: 20 })
  .custom((value: string) => /\d/.test(value))
  .custom((value: string) => /[a-zA-Z]/.test(value)).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send("Invalid data");
    return;
  }

  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    accountState: AccountState.Active,
    emailVerificationLink: 'none',
    passwordResetLink: 'none'
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (err) { return next(err) }
    if (existingUser) {
      res.status(400).send('An account with this email address already exists');
      return;
    }
    user.save((err) => {
      if (err) { return next(err); }
      res.send('Account created');
    });
  });
}