// initialize environment variables from dotenv before doing anything else
import dotenv from 'dotenv';
dotenv.config();

import  { appInit } from './app';

(async() => {
  // start the app
  appInit().then(app => {
    app.listen(app.get('port'), () => {
      console.log('Listening on port ' + app.get('port'));
    })
  }).catch(error => {
    console.error('Application failed.');
    console.error('Error: ' + error);
  });
})();