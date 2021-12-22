const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV==='development' ? 'development' : 'production',
  entry: './src/public/js/main.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist/public/js'),
    library: 'Common',
    libraryTarget:'umd'
  },
  stats: 'errors-warnings'
}