import { Request, Response, NextFunction } from 'express';
import { User, AccountState, IUser } from '../models/User';
import { body, validationResult } from 'express-validator';
import passport from 'passport';

// log in page
export const logIn = (req: Request, res: Response): void => {
  res.render('account/log-in');
};

// log in submit
export const logInSubmit = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('local', (err: Error, user) => {
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

// create account page
export const createAccount = (req: Request, res: Response): void => {
  res.render('account/create-account');
};

// create account submit
export const createAccountSubmit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  await body('firstName').isString().not().isEmpty().run(req);
  await body('lastName').isString().not().isEmpty().run(req);
  await body('email').isEmail().normalizeEmail().run(req);
  await body('password').isLength({ min: 8, max: 20 })
    .custom((value: string) => /\d/.test(value))
    .custom((value: string) => /[a-zA-Z]/.test(value)).run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
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

  User.findOne({ email: req.body.email }, function (err, existingUser) {
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
};

// log out submit
export const logOutSubmit = function (req: Request, res: Response): void {
  req.logout();
  res.send('OK');
};

// account settings page
export const accountSettings = (req: Request, res: Response): void => {
  res.render('account/account-settings');
};

// account settings submit
export const accountSettingsSubmit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    res.status(400).send('Not logged in');
    return;
  }

  await body('setting').isString().custom((value: string) => {
    return ['name', 'email', 'password'].includes(value);
  }).run(req);
  if (req.body.setting === 'name') {
    await body('firstName').isString().notEmpty().run(req);
    await body('lastName').isString().notEmpty().run(req);
  } else if (req.body.setting === 'email') {
    await body('email').isEmail().normalizeEmail().run(req);
  } else if (req.body.setting === 'password') {
    await body('password').isLength({ min: 8, max: 20 })
    .custom((value: string) => /\d/.test(value))
    .custom((value: string) => /[a-zA-Z]/.test(value)).run(req);
  }

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const user = req.user as IUser;

  if (req.body.setting === 'name') {
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    await user.save((err) => {
      if (err) { return next(err); }
      res.send('Name changed successfully!');
    });
  } else if (req.body.setting === 'email') {
    user.email = req.body.email;
    // check if email is already in use
    User.findOne({ email: req.body.email }, function (err, existingUser) {
      if (err) { return next(err) }
      if (existingUser) {
        res.status(400).send('An account with this email address already exists');
        return;
      }
      user.save((err) => {
        if (err) { return next(err); }
        res.send('Email changed successfully!');
      });
    });
  } else if (req.body.setting === 'password') {
    user.password = req.body.password;
    await user.save((err) => {
      if (err) { return next(err); }
      res.send('Password changed successfully!');
    });
  }
}