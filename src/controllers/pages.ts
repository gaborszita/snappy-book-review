import { Request, Response, NextFunction } from 'express';
import { IUser, User, AccountState } from '../models/User';
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
export const createAccountSubmit = async (req: Request, res: Response): Promise<void> => {
  console.log(req.body);
  const firstName = req.body.firstName;
  const lastName = req.body.lastName;
  const email = req.body.email;
  const password = req.body.password;

  const user = new User({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: password,
    accountState: AccountState.Active,
    emailVerificationLink: 'none',
    passwordResetLink: 'none'
  });

  await user.save();

  console.log('account created');
}