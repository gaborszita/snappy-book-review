import { Request, Response } from 'express';

// home page
export const home = (req: Request, res: Response): void => {
  res.render('home');
};