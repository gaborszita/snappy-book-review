import { Request, Response, NextFunction } from 'express';
import { User, AccountState, IUser } from '../models/User';
import { body, check, validationResult } from 'express-validator';
import passport from 'passport';
import { default as nodemailer } from 'nodemailer';
import { default as crypto } from 'crypto';
import { PasswordReset } from '../models/PasswordReset';
import { ChangeEmail } from '..//models/ChangeEmail';

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
  if (!req.isAuthenticated()) {
    return res.redirect(req.app.locals.config.siteUrl + '/account/log-in/');
  }
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
    // check if email is already in use
    User.findOne({ email: req.body.email }, function (err, existingUser) {
      if (err) { return next(err) }
      if (existingUser && existingUser.id !== user.id) {
        res.status(400).send('An account with this email address already exists');
        return;
      }

      // send email verification link
      const transporter = nodemailer.createTransport(req.app.locals.config.smtpConnectionUrl);

      const hash = crypto.randomBytes(20).toString('hex');
      const link = req.app.locals.config.siteUrl + '/account/' + 
        'verify-email-change/submit/?email=' +
        encodeURIComponent(user.email) + '&hash=' + 
        encodeURIComponent(hash);
        
      const body = 'Hello ' + user.firstName + '!\r\n\r\n' +
        'Please click on the following link to verify your email address ' + 
        'change:\r\n' + link;

      try {
        transporter.sendMail({
          from: req.app.locals.config.emailFrom,
          to: req.body.email,
          subject: "Snappy Book Review email change verification",
          text: body,
        });
      } catch (err) {
        return next(new Error('Failed to send email change verification ' + 
          'email', { cause: err }));
      }

      ChangeEmail.updateOne({ user: user.id }, 
        { hash: hash, email: req.body.email }, 
        { upsert: true }, (err) => {
        if (err) { return next(err); }
        res.send('We sent you a verification link to your email address. ' + 
          'The link is valid for 24 hours.');
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

// email change verification submit
export const emailChangeVerificationSubmit = async (req: Request, res: Response, next: NextFunction) => {
  await check('email').isEmail().run(req);
  await check('hash').isString().notEmpty().run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const errorMessage = 'Failed to change email address. Try requesting a ' + 
                       'change email link again, as the link may have ' + 
                       'already expired (it is valid for 24 hours).';

  User.findOne({ email: req.query.email, accountState: AccountState.Active }, 
    function(err, user) {
    if (err) { return next(err); }
    if (!user) {
      res.render('account/verify-email-change', { success: false, 
        responseText: errorMessage });
      return;
    }
    ChangeEmail.findOne({ user: user }, function(err, changeEmail) {
      if (err) { return next(err); }
      if (!changeEmail || changeEmail.hash !== req.query.hash) {
        res.render('account/verify-email-change', { success: false, 
          responseText: errorMessage });
        return;
      }

      User.findOne({ email: changeEmail.email }, function(err, existingUser) {
        if (err) { return next(err); }
        if (existingUser) {
          res.render('account/verify-email-change', { success: false, 
            responseText: errorMessage });
          return;
        }
        changeEmail.delete((err) => {
          if (err) { return next(err); }
          user.email = changeEmail.email;
          user.save((err) => {
            if (err) { return next(err); }
            res.render('account/verify-email-change', { success: true, 
              responseText: 'Email changed successfully!' });
          });
        });
      });
    });
  });
};


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

// reset password page
export const resetPassword = (req: Request, res: Response): void => {
  res.render('account/reset-password');
};

// reset password submit
export const resetPasswordSubmit = async (req: Request, res: Response, next: NextFunction) => {
  await body('email').isEmail().run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const message = 'If an account with the email address you provided ' + 
                  'exists, we have sent you a reset password link. ' + 
                  'The link is valid for 24 hours.';

  User.findOne({ email: req.body.email, accountState: AccountState.Active }, 
    async function(err, user) {
    if (err) { return next(err) }
    if (!user) {
      res.send(message);
      return;
    }

    const hash = crypto.randomBytes(20).toString('hex');
    const link = req.app.locals.config.siteUrl + '/account/' + 
      'reset-password-reset/?email=' + 
      encodeURIComponent(req.body.email) + '&hash=' + encodeURIComponent(hash);
    
    const body = 'Hello ' + user.firstName + '!\r\n\r\n' + 
                 'Please click on the following link to reset your ' + 
                 'password:\r\n' + link;

    const transporter = nodemailer.createTransport(req.app.locals.config.smtpConnectionUrl);

    try {
      await transporter.sendMail({
        from: req.app.locals.config.emailFrom,
        to: user.email,
        subject: "Snappy Book Review password reset",
        text: body,
      });
    } catch (err) {
      return next(new Error('Failed to send password reset email', { cause: err }));
    }

    PasswordReset.updateOne({ user: user }, { hash: hash }, { upsert: true }, 
      (err) => {
      if (err) { return next(err); }
      res.send(message);
    });
  });
};

// reset password reset page
export const resetPasswordReset = (req: Request, res: Response): void => {
  res.render('account/reset-password-reset');
};

// reset password reset submit
export const resetPasswordResetSubmit = async (req: Request, res: Response, next: NextFunction) => {
  await body('email').isEmail().run(req);
  await body('password').isLength({ min: 8, max: 20 })
    .custom((value: string) => /\d/.test(value))
    .custom((value: string) => /[a-zA-Z]/.test(value)).run(req);
  await body('hash').isString().notEmpty().run(req);

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).send('Invalid data');
    return;
  }

  const errorMessage = 'Failed to reset password. Try requesting a reset ' + 
                       'password link again, as the link may have already ' + 
                       'expired (it is valid for 24 hours).'

  User.findOne({ email: req.body.email, accountState: AccountState.Active }, 
    function(err, user) {
    if (err) return ( next(err) );
    if (!user) {
      res.status(400).send(errorMessage);
      return;
    }
    PasswordReset.findOne({ user: user }, function(err, passwordReset) {
      if (err) return ( next(err) );
      if (!passwordReset || req.body.hash !== passwordReset.hash) {
        res.status(400).send(errorMessage);
        return;
      }
      passwordReset.delete((err) => {
        if (err) { next(err); }
        user.password = req.body.password;
        user.save((err) => {
          if (err) { next(err); }
          res.send('Password has been reset successfully! You may now log in.');
        });
      });
    });
  });
};