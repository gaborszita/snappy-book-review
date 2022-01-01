import { Router } from 'express';
import * as mainPage from '../controllers/main-pages';

export const router = Router();

// GET request for main page
router.get('/', mainPage.home);