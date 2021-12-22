import { Request, Response, NextFunction } from 'express';
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
export const login = (req: Request, res: Response): void => {
  res.render('account/login');
};

/**
 * Login submit page.
 * @route POST /account/log-in/submit
 */
export const loginSubmit = (req: Request, res: Response, next: NextFunction): void => {
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