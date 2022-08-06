// this little script can be used to setup the application

import readline from 'readline';
import mongoose from 'mongoose';
import { MongoError } from 'mongodb';
import { Config } from './src/models/Config';
import crypto from 'crypto';

// used for getting user input
const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// this little function can be used to get input from the user
async function ask(question: string): Promise<string> {
  return new Promise(resolve => {
    r1.question(question, resolve);
  })
}

async function setup() {
  console.log('Snappy Book Review application setup.');
  let mongoUrl: string;
  let connectionOK: boolean;

  // get the mongodb connection url and check if it's correct
  // continue asking until it is correct
  do {
    mongoUrl = await ask('Please enter the MongoDB connection URL: ');
    console.log('Attempting to connect...');
    try {
      await mongoose.connect(mongoUrl);
      connectionOK = true;
      console.log('Connection successful!');
    } catch (err) {
      if (err instanceof MongoError) {
        connectionOK = false;
        console.log('Failed to connect to MongoDB!');
      } else {
        throw err;
      }
    }
  } while (!connectionOK)

  // get the site preferred protocol and the address
  const sitePreferredProtocol = await ask('Please enter the preferred ' +
    'protocol of your site (most likely http or https): ');
  const siteAddress = await ask('Please enter your site address (e.g. ' +
    'localhost, localhost:3000, example.com): ');
  const sessionMaxAge = await ask('Please enter the maximum session length ' +
    'in milliseconds (e.g. 60000 for 1 minutes): ');
  const smtpConnectionUrl = await ask('Please enter the SMTP connection ' +
    'URL (for nodemailer): ');
  const emailFrom = await ask('Please enter the email address from which ' +
    'the app will send emails in the format ' +
    '\'"Firstname Lastname" <no-reply@example.com>\': ');

  // session secret
  console.log('Generating session secret...');
  const sessionSecret = crypto.randomBytes(64).toString('hex');
  console.log('Done');

  const config = {
    sitePreferredProtocol: sitePreferredProtocol,
    siteAddress: siteAddress,
    sessionSecret: sessionSecret,
    sessionMaxAge: sessionMaxAge,
    smtpConnectionUrl: smtpConnectionUrl,
    emailFrom: emailFrom
  }

  // ask user to confirm if the script can write the config data to the
  // database
  let answerValid: boolean;
  do {
    const answer = await ask('Confirm to write config data to database ' +
                             '[y/n]: ');
    const answerLowerCase = answer.toLowerCase();
    if (answerLowerCase === 'y' || answerLowerCase === 'yes') {
      answerValid = true;
    } else if (answerLowerCase === 'n' || answerLowerCase === 'no') {
      console.log('Aborted.');

      try {
        await mongoose.disconnect();
      } catch (err) {
        if (err instanceof MongoError) {
          console.log('Failed to properly disconnect from MongoDB!');
        } else {
          throw err;
        }
      }

      r1.close();
      return;
      answerValid = true;
    } else {
      console.log('Please enter yes or no.');
      answerValid = false;
    }
  } while(!answerValid)

  // write the config to the database
  console.log('Writing config data to database...');
  try {
    const doc = new Config(config);
    await doc.save();
  } catch (err) {
    if (err instanceof MongoError) {
      console.log('Failed to write config data!');

      try {
        await mongoose.disconnect();
      } catch (err) {
        if (err instanceof MongoError) {
          console.log('Failed to properly disconnect from MongoDB!');
        } else {
          throw err;
        }
      }

      r1.close();
      return;
    } else {
      throw err;
    }
  }
  console.log('Config data was successfully written to database!');

  // disconnect mongoose from the database
  try {
    await mongoose.disconnect();
  } catch (err) {
    if (err instanceof MongoError) {
      console.log('Failed to properly disconnect from MongoDB!');
    } else {
      throw err;
    }
  }

  // close the readline object (used for getting user input)
  r1.close();

  // instruct user to set some environment variables
  console.log('Please set the following environment variables in your ' +
    'application (For simplicity, you can just create a .env file in the ' +
    'project root and paste it in there): ');
  console.log();

  // use the production environment
  console.log('NOVE_ENV=production');
  // the mongodb connection url
  console.log('MONGODB_URI=' + mongoUrl);

  // no more environment variables are needed as all config is stored in the
  // database

  console.log();

  console.log('Setup complete!');
}

setup();