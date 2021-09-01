// initialize environment variables from dotenv before doing anything else
import dotenv from 'dotenv';
dotenv.config();

import  { app } from './app';

// start the app
const server = app.listen(app.get('port'), () => {
  console.log('Listening on port ' + app.get('port'));
});

export { server };