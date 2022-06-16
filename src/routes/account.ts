import { Router } from 'express';
import * as account from '../controllers/account';

export const router = Router();

// GET request for log in page
router.get('/log-in/', account.logIn);

// POST request for log in submit
router.post('/log-in/submit/', account.logInSubmit);

// GET request for create account page
router.get('/create-account/', account.createAccount);

// POST request for create account submit
router.post('/create-account/submit/', account.createAccountSubmit);

// POST request for log out submit
router.post('/log-out/submit/', account.logOutSubmit);

// GET request for account settings page
router.get('/account-settings/', account.accountSettings);

// POST request for account settings submit
router.post('/account-settings/submit/', account.accountSettingsSubmit);