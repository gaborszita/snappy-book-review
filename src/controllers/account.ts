import { Request, Response, NextFunction } from 'express';
import { User, AccountState, IUser } from '../models/User';
import { body, check, validationResult } from 'express-validator';
import passport from 'passport';
import { default as nodemailer } from 'nodemailer';
import { default as crypto } from 'crypto';

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

  User.findOne({ email: req.body.email }, async function (err, existingUser) {
    if (err) { return next(err) }
    if (existingUser) {
      res.status(400).send('An account with this email address already exists');
      return;
    }
    const transporter = nodemailer.createTransport(req.app.locals.config.smtpConnectionUrl);

    const hash = crypto.randomBytes(20).toString('hex');
    const link = req.app.locals.config.siteUrl + '/account/verify-account/submit/?email=' + 
      encodeURIComponent(req.body.email) + '&hash=' + encodeURIComponent(hash);

    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      accountState: AccountState.PendingActivation,
      emailVerificationHash: hash,
      passwordResetLink: 'none'
    });
    
    const body = 'Hello ' + user.firstName + '!\r\n\r\n' + 
                  'Thank you registering at Snappy Book Review!\r\n\r\n' + 
                  'This is your email verification link:\r\n' + link;

    try {
      await transporter.sendMail({
        from: req.app.locals.config.emailFrom,
        to: user.email,
        subject: "Snappy Book Review email verification",
        text: body,
      });
    } catch (err) {
      return next(new Error('Failed to send verification email', { cause: err }));
    }
    user.save((err) => {
      if (err) { return next(err); }
      
      
      res.send('We sent you a verification link to your email address. ' + 
        'The link is valid for 24 hours.');
    });
  });
};

// log out submit
export const logOutSubmit = function (req: Request, res: Response, next: NextFunction): void {
  req.logout((err) => {
    if (err) { return next(err); }
    res.send('OK');
  });
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
      if (existingUser && existingUser.id != user.id) {
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

// account verificaiton submit
export const accountVerificationSubmit = async (req: Request, res: Response, next: NextFunction) => {
  await check('email').isEmail().run(req);
  await check('hash').isString().notEmpty().run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const errorMsg = 'Invalid link. Try re-creating your account, as the ' + 
                   'link may have expired (it is valid for 24 hours).';

  User.findOne({ email: req.query.email }, function (err, user) {
    if (err) { return next(err) }
    if (!user || user.accountState == AccountState.Active 
      || user.emailVerificationHash !== req.query.hash) {
      res.status(400).render('account/verify-account', { responseText: errorMsg });
      return;
    }
    user.accountState = AccountState.Active;
    user.emailVerificationHash = undefined;
    user.emailVerificationExpire = undefined;
    user.save((err) => {
      if (err) { return next(err); }
      res.render('account/verify-account', { responseText: 
        'Email verified successfully! You may now log in.' });
    });
  });
};