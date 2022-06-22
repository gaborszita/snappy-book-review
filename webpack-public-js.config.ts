import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import webpack from 'webpack';
import mongoose from 'mongoose';
import { config } from './src/util/config';

export default async () => {
  const mode = process.env.NODE_ENV==='development' ? 'development' : 'production';
  const outputPath = path.resolve(__dirname, 'dist/public/js');
  const stats = 'errors-warnings';

  const mongoUrl = process.env.MONGODB_URI;

  mongoose.connect(mongoUrl).then(
      () => {
        // mongoose ready to use
      }
    ).catch(error => {
      console.error('ERROR: Failed to connect to  MongoDB.');
      console.error(error);
    });

  const configData = await config().catch(error => {
    console.error('ERROR: Failed to get config.');
    throw new Error('Failed to get config', { cause: error });
  });

  mongoose.disconnect();

  const webpackConfig = {
    mode: mode,
    entry: './src/public/js/webpack/main.js',
    output: {
      filename: 'main.js',
      path: outputPath,
      library: {
        name: 'Common',
        type: 'umd'
      }
    },
    plugins: [
      new webpack.DefinePlugin({
        config: JSON.stringify({
          siteUrl: configData.siteUrl,
          loggedInCookie: configData.loggedInCookie
        })
      })
    ],
    stats: stats
  }

  return webpackConfig;
};