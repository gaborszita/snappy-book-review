import { Request, Response } from "express";

/**
 * Home page.
 * @route GET /
 */
export const home = (req: Request, res: Response): void => {
    res.render('home');
};