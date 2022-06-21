import dotenv from 'dotenv';
dotenv.config();
import path from 'path';

const mode = process.env.NODE_ENV==='development' ? 'development' : 'production';
const outputPath = path.resolve(__dirname, 'dist/public/js');
const stats = 'errors-warnings';

const config = [
  {
    mode: mode,
    entry: './src/public/js/main.js',
    output: {
      filename: 'main.js',
      path: outputPath,
      library: {
        name: 'Common',
        type: 'umd'
      }
    },
    stats: stats
  },
  {
    mode: mode,
    entry: './src/public/js/account.js',
    output: {
      filename: 'account.js',
      path: outputPath,
      library: {
        name: 'Account',
        type: 'umd'
      }
    },
    stats: stats
  }
]

export default config;